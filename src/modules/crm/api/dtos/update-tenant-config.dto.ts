import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'instituto-andino' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'Instituto Tecnológico Andino' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Eres el asesor de admisiones del Instituto Andino. Responde de forma cálida y ofrece becas.',
  })
  @IsString()
  @IsOptional()
  generalPolicy?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(2)
  @Max(20)
  @IsOptional()
  memoryThreshold?: number;
}

export class UpdateTenantConfigDto {
  @ApiPropertyOptional({ example: 'Clear Minds / KrakeDev' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Fidel' })
  @IsString()
  @IsOptional()
  agentName?: string;

  @ApiPropertyOptional({ example: 'Asesor Comercial Senior & Consultor IA' })
  @IsString()
  @IsOptional()
  agentRole?: string;

  @ApiPropertyOptional({ example: 'Consultivo, empático y ejecutivo' })
  @IsString()
  @IsOptional()
  tone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  globalRules?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsInt()
  @Min(2)
  @Max(20)
  @IsOptional()
  summaryInterval?: number;
}
