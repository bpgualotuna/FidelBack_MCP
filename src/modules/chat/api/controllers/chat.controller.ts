import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { ProcessInboundMessageUseCase } from '../../application/use-cases/process-inbound-message.use-case';
import { LlmGatewayAdapter } from '../../infrastructure/adapters/llm-gateway.adapter';
import {
  SendMessageDto,
  TestLlmConnectionDto,
  UpdateSessionStatusDto,
} from '../dtos/send-message.dto';

@ApiTags('Chat Orchestrator & Handoff')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly processInboundMessage: ProcessInboundMessageUseCase,
    private readonly llmGateway: LlmGatewayAdapter,
  ) {}

  @Public()
  @Post('test-connection')
  @ApiOperation({ summary: 'Verificar conectividad real con Google Gemini u OpenAI desde el backend' })
  async testConnection(@Body() dto: TestLlmConnectionDto) {
    return this.llmGateway.testConnection(dto.provider, dto.model, dto.apiKey);
  }

  @Public()
  @Post('send')
  @ApiOperation({
    summary:
      'Procesar turno conversacional con enrutamiento multi-servicio, extracción comercial y ejecución de Tools MCP',
  })
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.processInboundMessage.execute(dto);
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
}
