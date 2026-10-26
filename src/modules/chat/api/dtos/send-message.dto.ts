import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProductLineKey } from '../../domain/interfaces/llm-gateway.port';

export class SendMessageDto {
  @ApiProperty({ example: 'session-whatsapp-001' })
  @IsString()
  @IsNotEmpty()
  sessionId!: string;

  @ApiProperty({
    example: 'Hola, somos 3 docentes interesados en el Diplomado de IA. ¿Cuánto nos cuesta en cuotas?',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ enum: ['gemini', 'openai'], example: 'gemini' })
  @IsIn(['gemini', 'openai'])
  provider!: 'gemini' | 'openai';

  @ApiProperty({ example: 'gemini-flash-lite-latest' })
  @IsString()
  @IsNotEmpty()
  model!: string;

  @ApiPropertyOptional({
    description: 'API Key opcional (si se omite, el backend utiliza GEMINI_API_KEY u OPENAI_API_KEY de su .env)',
  })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({
    enum: ['ia_docencia', 'aws_pack', 'krake_mentor', 'custom_software'],
    example: 'ia_docencia',
  })
  @IsIn(['ia_docencia', 'aws_pack', 'krake_mentor', 'custom_software'])
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
