import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
