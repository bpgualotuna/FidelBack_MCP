import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ExecuteMcpToolDto {
  @ApiProperty({
    example: 'cotizar_descuento_grupo',
    description: 'Nombre de la herramienta MCP registrada en Fidel.',
  })
  @IsString()
  @IsNotEmpty()
  toolName!: string;

  @ApiProperty({
    example: {
      productKey: 'aws_certifications',
      participants: 2,
      paymentMode: 'contado',
    },
    description: 'Argumentos estructurados para la herramienta MCP.',
  })
  @IsObject()
  @IsOptional()
  arguments?: Record<string, unknown>;
}
