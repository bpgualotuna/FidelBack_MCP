import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductLineKey } from '../../domain/interfaces/llm-gateway.port';

export class SendMessageDto {
  @ApiProperty({ example: 'session-whatsapp-001' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({
    example: 'Hola, estoy interesado en las certificaciones de AWS. ¿Qué precios tienen?',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({
    example: 'clearminds',
    description: 'Slug de la empresa (Tenant). También se resuelve automáticamente si envías el header x-tenant-key.',
  })
  @IsString()
  @IsOptional()
  tenantSlug?: string;

  @ApiPropertyOptional({ enum: ['gemini', 'openai'], default: 'gemini' })
  @IsIn(['gemini', 'openai'])
  @IsOptional()
  provider?: 'gemini' | 'openai';

  @ApiPropertyOptional({ default: 'gemini-flash-lite-latest' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'API Key opcional de LLM (por defecto usa la GEMINI_API_KEY protegida en el servidor)',
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({
    enum: ['custom_software', 'krakedev_academy', 'aws_certifications', 'ai_assistants_b2b'],
    example: 'krakedev_academy',
  })
  @IsIn(['custom_software', 'krakedev_academy', 'aws_certifications', 'ai_assistants_b2b'])
  @IsOptional()
  activeProductKey?: ProductLineKey;

  @ApiPropertyOptional({ enum: ['user', 'human_agent'], default: 'user' })
  @IsIn(['user', 'human_agent'])
  @IsOptional()
  senderRole?: 'user' | 'human_agent';

  @ApiPropertyOptional({ description: 'System prompt personalizado desde el laboratorio' })
  @IsString()
  @IsOptional()
  customSystemPrompt?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true, Fidel entra en Modo Entrenamiento (Roleplay / Corrección) y guarda reglas aprendidas.',
  })
  @IsBoolean()
  @IsOptional()
  trainingMode?: boolean;

  @ApiPropertyOptional({ description: 'Nombre del entrenador o supervisor que envía la corrección' })
  @IsString()
  @IsOptional()
  trainerName?: string;
}

export class TestLlmConnectionDto {
  @ApiProperty({ enum: ['gemini', 'openai'], example: 'gemini' })
  @IsIn(['gemini', 'openai'])
  provider!: 'gemini' | 'openai';

  @ApiProperty({ example: 'gemini-flash-lite-latest' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  apiKey?: string;
}

export class UpdateSessionStatusDto {
  @ApiProperty({ enum: ['AI_ACTIVE', 'HUMAN_ACTIVE', 'CLOSED'] })
  @IsIn(['AI_ACTIVE', 'HUMAN_ACTIVE', 'CLOSED'])
  status!: 'AI_ACTIVE' | 'HUMAN_ACTIVE' | 'CLOSED';
}

export class CreateTrainingRuleDto {
  @ApiProperty({ example: 'Usar máximo 1 emoji y preguntar primero por la empresa.' })
  @IsString()
  @IsNotEmpty()
  instruction!: string;

  @ApiPropertyOptional({ enum: ['ESTILO', 'COMERCIAL', 'OBJECIONES', 'GENERAL'], default: 'GENERAL' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sourceFeedback?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  createdByName?: string;
}

export class ToggleTrainingRuleDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class SandboxTrainingTurnDto {
  @ApiProperty({ example: 'Hola Fidel, vamos a practicar. Quiero saber cuánto cuesta el curso AWS.' })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiPropertyOptional({ default: [] })
  @IsArray()
  @IsOptional()
  history?: Array<{ role: 'trainer' | 'fidel'; text: string }>;

  @ApiPropertyOptional({ default: 'Entrenador' })
  @IsString()
  @IsOptional()
  trainerName?: string;
}
