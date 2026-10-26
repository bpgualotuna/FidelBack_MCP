import { Injectable, Logger } from '@nestjs/common';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaService } from '../../../../context/database/prisma.service';
import {
  McpResourceDefinition,
  McpToolDefinition,
  McpToolExecutionResult,
} from '../../domain/interfaces/mcp-tool.port';
import {
  CLEARMINDS_MCP_RESOURCES,
  CLEARMINDS_MCP_TOOLS,
} from '../../infrastructure/resources/clearminds-catalog.resource';

@Injectable()
export class McpRegistryService {
  private readonly logger = new Logger(McpRegistryService.name);
  private readonly mcpServer: Server;

  // In-memory store for fast inspection & graceful fallback if DB is not running
  private readonly executionLogs: McpToolExecutionResult[] = [];

  constructor(private readonly prisma: PrismaService) {
    this.mcpServer = new Server(
      {
        name: 'fidel-clearminds-mcp-server',
        version: '1.3.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      },
    );

    this.registerProtocolHandlers();
  }

  private registerProtocolHandlers(): void {
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: CLEARMINDS_MCP_TOOLS,
    }));

    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: CLEARMINDS_MCP_RESOURCES.map((r) => ({
        uri: r.uri,
        name: r.name,
        description: r.description,
        mimeType: r.mimeType,
      })),
    }));

    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = CLEARMINDS_MCP_RESOURCES.find((r) => r.uri === request.params.uri);
      if (!resource) {
        throw new Error(`Recurso MCP no encontrado: ${request.params.uri}`);
      }
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType,
            text: resource.content,
          },
        ],
      };
    });

    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const result = await this.executeTool(
        request.params.name,
        (request.params.arguments as Record<string, unknown>) ?? {},
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });
  }

  getMcpServerInstance(): Server {
    return this.mcpServer;
  }

  listTools(): McpToolDefinition[] {
    return CLEARMINDS_MCP_TOOLS;
  }

  listResources(): McpResourceDefinition[] {
    return CLEARMINDS_MCP_RESOURCES;
  }

  getRecentExecutions(): McpToolExecutionResult[] {
    return this.executionLogs.slice(0, 30);
  }

  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<McpToolExecutionResult> {
    const timestamp = new Date().toISOString();

    try {
      switch (toolName) {
        case 'cotizar_descuento_grupo': {
          const productKey = String(args.productKey || 'ia_docencia');
          const participants = Math.max(1, Number(args.participants || 1));
          const paymentMode = String(args.paymentMode || 'cuotas');

          let unitPrice = 249;
          let regularPrice = 360;
          let installmentPlan = 'Inscripción de $69 + 3 cuotas mensuales de $60';

          if (productKey === 'ia_docencia') {
            regularPrice = 360;
            if (participants >= 5) {
              unitPrice = 199;
              installmentPlan = 'Tarifa corporativa 5+ ($199 c/u)';
            } else if (participants >= 3) {
              unitPrice = 209;
              installmentPlan = 'Tarifa grupal 3+ ($209 c/u)';
            } else if (paymentMode === 'contado') {
              unitPrice = 230;
              installmentPlan = 'Pago único de contado ($230)';
            } else {
              unitPrice = 249;
            }
          } else if (productKey === 'aws_pack') {
            regularPrice = 450;
            if (participants >= 5) {
              unitPrice = 220;
              installmentPlan = 'Tarifa corporativa 5+ ($220 c/u)';
            } else if (participants >= 3) {
              unitPrice = 235;
              installmentPlan = 'Tarifa grupal 3+ ($235 c/u)';
            } else if (paymentMode === 'contado') {
              unitPrice = 250;
              installmentPlan = 'Pago único de contado ($250)';
            } else {
              unitPrice = 279;
              installmentPlan = 'Inscripción de $99 + 2 cuotas mensuales de $90';
            }
          } else {
            const customResult: McpToolExecutionResult = {
              toolName,
              success: true,
              timestamp,
              data: {
                productKey,
                participants,
                quotationType: 'B2B_CUSTOM',
                recommendation: 'Agendar demo o sesión de arquitectura ejecutiva sin costo.',
              },
              message: `Cotización B2B preparada para ${productKey}.`,
            };
            this.recordExecution(customResult);
            return customResult;
          }

          const totalInvestment = unitPrice * participants;
          const totalRegular = regularPrice * participants;
          const totalSavings = totalRegular - totalInvestment;

          const result: McpToolExecutionResult = {
            toolName,
            success: true,
            timestamp,
            data: {
              productKey,
              participants,
              paymentMode,
              unitPriceUsd: unitPrice,
              totalInvestmentUsd: totalInvestment,
              totalSavingsUsd: totalSavings,
              installmentPlan,
            },
            message: `Cotización calculada: ${participants} participante(s) en ${productKey} -> $${unitPrice} USD c/u (Total: $${totalInvestment} USD, Ahorro: $${totalSavings} USD).`,
          };
          this.recordExecution(result);
          return result;
        }

        case 'agendar_cita': {
          const leadName = String(args.leadName || 'Prospecto Clear Minds');
          const leadContact = String(args.leadContact || 'Por confirmar');
          const productKey = String(args.productKey || 'custom_software');
          const scheduledAtRaw = String(args.scheduledAt || new Date(Date.now() + 86400000).toISOString());
          const notes = String(args.notes || '');

          let appointmentId = `apt_${Date.now()}`;
          try {
            const tenant = await this.prisma.tenant.findFirst();
            if (tenant) {
              const parsedDate = Number.isNaN(Date.parse(scheduledAtRaw))
                ? new Date(Date.now() + 86400000)
                : new Date(scheduledAtRaw);

              const created = await this.prisma.appointment.create({
                data: {
                  tenantId: tenant.id,
                  sessionId: args.sessionId ? String(args.sessionId) : null,
                  leadName,
                  leadContact,
                  productKey,
                  scheduledAt: parsedDate,
                  notes,
                },
              });
              appointmentId = created.id;
            }
          } catch (dbErr) {
            this.logger.debug(`Modo sin DB activa en agendar_cita: ${(dbErr as Error).message}`);
          }

          const result: McpToolExecutionResult = {
            toolName,
            success: true,
            timestamp,
            data: {
              appointmentId,
              leadName,
              leadContact,
              productKey,
              scheduledAt: scheduledAtRaw,
              meetingLink: `https://meet.clearminds.ec/fidel-${appointmentId.slice(-6)}`,
            },
            message: `Cita agendada para ${leadName} (${productKey}) en fecha/hora: ${scheduledAtRaw}.`,
          };
          this.recordExecution(result);
          return result;
        }

        case 'registrar_lead_crm': {
          const sessionId = String(args.sessionId || '');
          const productKey = String(args.productKey || 'ia_docencia');
          const intentLevel = String(args.intentLevel || 'MEDIO');
          const extractedFields =
            (args.extractedFields as Record<string, unknown>) ?? {};

          try {
            if (sessionId) {
              await this.prisma.conversationSession.updateMany({
                where: { id: sessionId },
                data: {
                  activeProductKey: productKey,
                  extractedData: extractedFields as object,
                },
              });
            }
          } catch (dbErr) {
            this.logger.debug(`Modo sin DB activa en registrar_lead_crm: ${(dbErr as Error).message}`);
          }

          const result: McpToolExecutionResult = {
            toolName,
            success: true,
            timestamp,
            data: {
              sessionId: sessionId || 'session_local',
              productKey,
              intentLevel,
              extractedFields,
            },
            message: `Lead sincronizado en CRM para la línea ${productKey} con intención ${intentLevel}.`,
          };
          this.recordExecution(result);
          return result;
        }

        case 'transferir_a_humano': {
          const sessionId = String(args.sessionId || 'session_local');
          const reason = String(args.reason || 'Solicitud de atención personalizada');

          try {
            await this.prisma.conversationSession.updateMany({
              where: { id: sessionId },
              data: { status: 'HUMAN_ACTIVE' },
            });
          } catch (dbErr) {
            this.logger.debug(`Modo sin DB activa en transferir_a_humano: ${(dbErr as Error).message}`);
          }

          const result: McpToolExecutionResult = {
            toolName,
            success: true,
            timestamp,
            data: {
              sessionId,
              newStatus: 'HUMAN_ACTIVE',
              reason,
            },
            message: `Sesión ${sessionId} transferida a asesor humano (HUMAN_ACTIVE). Motivo: ${reason}`,
          };
          this.recordExecution(result);
          return result;
        }

        default: {
          const unknownResult: McpToolExecutionResult = {
            toolName,
            success: false,
            timestamp,
            data: { args },
            message: `Herramienta MCP no reconocida: ${toolName}`,
          };
          this.recordExecution(unknownResult);
          return unknownResult;
        }
      }
    } catch (error) {
      const errorResult: McpToolExecutionResult = {
        toolName,
        success: false,
        timestamp,
        data: { error: (error as Error).message },
        message: `Error ejecutando tool MCP ${toolName}: ${(error as Error).message}`,
      };
      this.recordExecution(errorResult);
      return errorResult;
    }
  }

  private recordExecution(entry: McpToolExecutionResult): void {
    this.executionLogs.unshift(entry);
    if (this.executionLogs.length > 50) {
      this.executionLogs.pop();
    }
  }
}
