import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { CLEARMINDS_MCP_RESOURCES } from '../../../mcp/infrastructure/resources/clearminds-catalog.resource';
import { McpRegistryService } from '../../../mcp/application/services/mcp-registry.service';
import {
  McpResourceDefinition,
  McpToolExecutionResult,
} from '../../../mcp/domain/interfaces/mcp-tool.port';
import { CrmService } from '../../../crm/application/services/crm.service';
import { LlmGatewayAdapter } from '../../infrastructure/adapters/llm-gateway.adapter';
import {
  ProductLineKey,
  StructuredExtractionItem,
} from '../../domain/interfaces/llm-gateway.port';

export interface InMemorySessionState {
  sessionId: string;
  status: 'AI_ACTIVE' | 'HUMAN_ACTIVE' | 'CLOSED';
  activeProductKey: ProductLineKey;
  incrementalSummary: string;
  messagesCount: number;
  extractedFields: StructuredExtractionItem[];
  history: Array<{
    role: 'user' | 'assistant' | 'human_agent';
    content: string;
    createdAt: string;
  }>;
}

@Injectable()
export class ProcessInboundMessageUseCase {
  private readonly logger = new Logger(ProcessInboundMessageUseCase.name);
  private readonly sessions = new Map<string, InMemorySessionState>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly crmService: CrmService,
    private readonly mcpRegistry: McpRegistryService,
    private readonly llmGateway: LlmGatewayAdapter,
  ) {}

  getOrCreateMemorySession(
    sessionId: string,
    initialProductKey: ProductLineKey = 'ia_docencia',
  ): InMemorySessionState {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;

    const resource =
      CLEARMINDS_MCP_RESOURCES.find(
        (r: McpResourceDefinition) => r.productKey === initialProductKey,
      ) ?? CLEARMINDS_MCP_RESOURCES[0];

    const created: InMemorySessionState = {
      sessionId,
      status: 'AI_ACTIVE',
      activeProductKey: initialProductKey,
      incrementalSummary: '',
      messagesCount: 0,
      extractedFields: resource.requiredFields.map((key: string) => ({
        key,
        value: 'Pendiente',
        status: 'missing',
      })),
      history: [],
    };
    this.sessions.set(sessionId, created);
    return created;
  }

  getSessionState(sessionId: string): InMemorySessionState {
    return this.getOrCreateMemorySession(sessionId);
  }

  async setSessionStatus(
    sessionId: string,
    status: 'AI_ACTIVE' | 'HUMAN_ACTIVE' | 'CLOSED',
  ) {
    const session = this.getOrCreateMemorySession(sessionId);
    session.status = status;

    try {
      await this.prisma.conversation.updateMany({
        where: { sessionId },
        data: { controlState: status },
      });
    } catch {
      // Fallback in-memory
    }

    return {
      sessionId,
      status: session.status,
      message:
        status === 'HUMAN_ACTIVE'
          ? 'Modo Espejo activado (HUMAN_ACTIVE). Fidel escuchará en silencio sin responder al cliente.'
          : 'Modo IA activado (AI_ACTIVE). Fidel retoma la atención automática.',
    };
  }

  async execute(params: {
    sessionId: string;
    message: string;
    provider: 'gemini' | 'openai';
    model: string;
    apiKey?: string;
    activeProductKey?: ProductLineKey;
    senderRole?: 'user' | 'human_agent';
    customSystemPrompt?: string;
  }) {
    const session = this.getOrCreateMemorySession(
      params.sessionId,
      params.activeProductKey || 'ia_docencia',
    );

    if (params.activeProductKey && params.activeProductKey !== session.activeProductKey) {
      session.activeProductKey = params.activeProductKey;
    }

    const incomingRole = params.senderRole || 'user';
    session.history.push({
      role: incomingRole,
      content: params.message,
      createdAt: new Date().toISOString(),
    });
    session.messagesCount += 1;

    if (session.status === 'HUMAN_ACTIVE' || incomingRole === 'human_agent') {
      session.status = 'HUMAN_ACTIVE';
      return {
        sessionId: session.sessionId,
        status: session.status,
        ignoredByAi: true,
        replyText: null,
        detectedProductKey: session.activeProductKey,
        productSwitched: false,
        incrementalSummary: session.incrementalSummary,
        extractedFields: session.extractedFields,
        mcpExecutions: [],
        notice:
          'Mensaje registrado en Modo Espejo (HUMAN_ACTIVE). Fidel actualizó el contexto silenciosamente sin interrumpir al asesor humano.',
      };
    }

    const tenantConfig = await this.crmService.getTenantConfig('clearminds');
    const allBrochuresContext = CLEARMINDS_MCP_RESOURCES.map(
      (r: McpResourceDefinition) =>
        `### [${r.productKey}] ${r.name}\nCampos requeridos: ${r.requiredFields.join(', ')}\n${r.content}`,
    ).join('\n\n');

    const activeResource =
      CLEARMINDS_MCP_RESOURCES.find(
        (r: McpResourceDefinition) => r.productKey === session.activeProductKey,
      ) ?? CLEARMINDS_MCP_RESOURCES[0];

    const systemPrompt =
      params.customSystemPrompt?.trim() ||
      `Eres ${tenantConfig.tenant.agentName}, ${tenantConfig.tenant.agentRole} de ${tenantConfig.tenant.name}.\nTONO: ${tenantConfig.tenant.tone}\nREGLAS GLOBALES:\n${tenantConfig.tenant.globalRules}\n\nCATÁLOGO OFICIAL MCP DE CLEAR MINDS (4 LÍNEAS DE NEGOCIO):\n${allBrochuresContext}`;

    const recentHistory = session.history
      .slice(-8, -1)
      .map((h) => ({
        role: (h.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: h.content,
      }));

    const llmOutput = await this.llmGateway.generateCommercialTurn({
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
      systemPrompt,
      activeProductKey: session.activeProductKey,
      requiredFields: activeResource.requiredFields,
      incrementalSummary: session.incrementalSummary,
      recentHistory,
      userMessage: params.message,
    });

    const previousProductKey = session.activeProductKey;
    const productSwitched = llmOutput.detectedProductKey !== previousProductKey;
    session.activeProductKey = llmOutput.detectedProductKey;
    session.extractedFields = llmOutput.extractedFields;

    const mcpExecutions: McpToolExecutionResult[] = [];

    for (const toolCall of llmOutput.mcpToolCalls) {
      const execResult = await this.mcpRegistry.executeTool(toolCall.toolName, {
        ...toolCall.arguments,
        sessionId: session.sessionId,
        productKey: toolCall.arguments.productKey ?? session.activeProductKey,
      });
      mcpExecutions.push(execResult);

      if (toolCall.toolName === 'transferir_a_humano') {
        session.status = 'HUMAN_ACTIVE';
      }
    }

    const capturedMap: Record<string, string> = {};
    for (const item of llmOutput.extractedFields) {
      if (item.status !== 'missing' && item.value && item.value !== 'Pendiente') {
        capturedMap[item.key] = item.value;
      }
    }

    if (Object.keys(capturedMap).length > 0) {
      const crmSync = await this.mcpRegistry.executeTool('registrar_lead_crm', {
        sessionId: session.sessionId,
        productKey: session.activeProductKey,
        intentLevel: llmOutput.intentLevel,
        extractedFields: capturedMap,
      });
      mcpExecutions.push(crmSync);
    }

    session.history.push({
      role: 'assistant',
      content: llmOutput.replyText,
      createdAt: new Date().toISOString(),
    });
    session.messagesCount += 1;

    const summaryInterval = tenantConfig.tenant.summaryInterval || 5;
    let summaryUpdated = false;
    if (session.messagesCount >= summaryInterval && session.messagesCount % summaryInterval <= 1) {
      session.incrementalSummary = await this.llmGateway.generateSummary(
        params.provider,
        params.model,
        params.apiKey,
        session.incrementalSummary,
        session.history.slice(-6),
      );
      summaryUpdated = true;
    }

    return {
      sessionId: session.sessionId,
      status: session.status,
      replyText: llmOutput.replyText,
      detectedProductKey: session.activeProductKey,
      previousProductKey,
      productSwitched,
      intentLevel: llmOutput.intentLevel,
      intentJustification: llmOutput.intentJustification,
      extractedFields: session.extractedFields,
      nextAction: llmOutput.nextAction,
      incrementalSummary: session.incrementalSummary,
      summaryUpdated,
      mcpExecutions,
      metrics: {
        provider: params.provider,
        model: params.model,
        inputTokens: llmOutput.inputTokens,
        outputTokens: llmOutput.outputTokens,
        latencyMs: llmOutput.latencyMs,
      },
    };
  }
}
