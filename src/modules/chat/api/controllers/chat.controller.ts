import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { CrmService } from '../../../crm/application/services/crm.service';
import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';
import { LlmGatewayAdapter } from '../../infrastructure/adapters/llm-gateway.adapter';
import {
  CreateTrainingRuleDto,
  SandboxTrainingTurnDto,
  SendMessageDto,
  TestLlmConnectionDto,
  ToggleTrainingRuleDto,
  UpdateSessionStatusDto,
} from '../dtos/send-message.dto';

@ApiTags('Chat Orchestrator & Multi-Tenant Webhook')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly processInboundMessage: ProcessInboundMessageUseCase,
    private readonly llmGateway: LlmGatewayAdapter,
    private readonly crmService: CrmService,
  ) {}

  @Public()
  @Post('test-connection')
  @ApiOperation({ summary: 'Verificar conectividad real con Google Gemini u OpenAI desde el backend' })
  async testConnection(@Body() dto: TestLlmConnectionDto) {
    return this.llmGateway.testConnection(dto.provider, dto.model, dto.apiKey);
  }

  @Public()
  @Post('send')
  @ApiHeader({
    name: 'x-tenant-key',
    required: false,
    description: 'API Key exclusiva de la empresa (ej. fidel_live_clearminds_2026) para bots de WhatsApp o CRMs',
  })
  @ApiOperation({
    summary:
      'Procesar turno conversacional Multi-Empresa con enrutamiento dinámico, extracción comercial y ejecución de Tools MCP',
  })
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    return this.processInboundMessage.execute({
      ...dto,
      provider: dto.provider || 'gemini',
      model: dto.model || 'gemini-flash-lite-latest',
      tenantApiKey,
      tenantSlug: dto.tenantSlug || tenantHeaderSlug,
    });
  }

  @Public()
  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Obtener estado actual, memoria incremental e historial de una sesión' })
  getSession(@Param('sessionId') sessionId: string) {
    return this.processInboundMessage.getSessionState(sessionId);
  }

  @Public()
  @Patch('sessions/:sessionId/status')
  @ApiOperation({ summary: 'Alternar entre AI_ACTIVE y HUMAN_ACTIVE (Modo Espejo / Handoff)' })
  async updateStatus(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionStatusDto,
  ) {
    return this.processInboundMessage.setSessionStatus(sessionId, dto.status);
  }

  @Public()
  @Get('rules')
  @ApiHeader({ name: 'x-tenant-key', required: false })
  @ApiOperation({ summary: 'Listar reglas aprendidas en Modo Entrenamiento para el tenant' })
  async listRules(
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    const slug = await this.crmService.resolveTenantSlug(tenantApiKey, tenantHeaderSlug);
    const { rules } = await this.crmService.listTrainingRules(slug);
    return { ok: true, rules };
  }

  @Public()
  @Post('rules')
  @ApiHeader({ name: 'x-tenant-key', required: false })
  @ApiOperation({ summary: 'Crear manualmente una regla de entrenamiento para el tenant' })
  async createRule(
    @Body() dto: CreateTrainingRuleDto,
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    const slug = await this.crmService.resolveTenantSlug(tenantApiKey, tenantHeaderSlug);
    const { rule } = await this.crmService.createTrainingRule(slug, dto);
    return { ok: true, rule };
  }

  @Public()
  @Patch('rules/:ruleId')
  @ApiHeader({ name: 'x-tenant-key', required: false })
  @ApiOperation({ summary: 'Activar o pausar una regla de entrenamiento' })
  async toggleRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: ToggleTrainingRuleDto,
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    const slug = await this.crmService.resolveTenantSlug(tenantApiKey, tenantHeaderSlug);
    const { rules } = await this.crmService.toggleTrainingRule(slug, ruleId, dto.isActive);
    return { ok: true, rules };
  }

  @Public()
  @Delete('rules/:ruleId')
  @ApiHeader({ name: 'x-tenant-key', required: false })
  @ApiOperation({ summary: 'Eliminar una regla de entrenamiento' })
  async deleteRule(
    @Param('ruleId') ruleId: string,
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    const slug = await this.crmService.resolveTenantSlug(tenantApiKey, tenantHeaderSlug);
    const { rules } = await this.crmService.deleteTrainingRule(slug, ruleId);
    return { ok: true, rules };
  }

  @Public()
  @Post('training-turn')
  @ApiHeader({ name: 'x-tenant-key', required: false })
  @ApiOperation({ summary: 'Ejecutar un turno de entrenamiento sandbox (Roleplay / Corrección)' })
  async sandboxTrainingTurn(
    @Body() dto: SandboxTrainingTurnDto,
    @Headers('x-tenant-key') tenantApiKey?: string,
    @Headers('x-tenant-id') tenantHeaderSlug?: string,
  ) {
    return this.processInboundMessage.runSandboxTrainingTurn({
      tenantApiKey,
      tenantSlug: tenantHeaderSlug,
      message: dto.message,
      history: dto.history,
      trainerName: dto.trainerName,
    });
  }
}
