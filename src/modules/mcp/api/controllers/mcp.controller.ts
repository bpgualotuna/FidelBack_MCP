import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../../../common/decorators/public.decorator';
import { McpRegistryService } from '../../application/services/mcp-registry.service';
import { ExecuteMcpToolDto } from '../dtos/execute-mcp-tool.dto';

@ApiTags('MCP Server (Model Context Protocol)')
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpRegistry: McpRegistryService) {}

  @Public()
  @Get('status')
  @ApiOperation({ summary: 'Estado del servidor MCP de Fidel y resumen de capacidades' })
  getStatus() {
    return {
      server: 'fidel-clearminds-mcp-server',
      version: '1.3.0',
      protocol: 'Model Context Protocol (MCP)',
      toolsCount: this.mcpRegistry.listTools().length,
      resourcesCount: this.mcpRegistry.listResources().length,
      recentExecutions: this.mcpRegistry.getRecentExecutions(),
    };
  }

  @Public()
  @Get('tools')
  @ApiOperation({ summary: 'Listar todas las Tools MCP disponibles para el agente comercial' })
  listTools() {
    return {
      tools: this.mcpRegistry.listTools(),
    };
  }

  @Public()
  @Get('resources')
  @ApiOperation({ summary: 'Listar los Resources MCP (brochures oficiales de Clear Minds)' })
  listResources() {
    return {
      resources: this.mcpRegistry.listResources(),
    };
  }

  @Public()
  @Get('resources/:productKey')
  @ApiOperation({ summary: 'Leer el contenido de un brochure MCP por productKey' })
  getResourceByKey(@Param('productKey') productKey: string) {
    const resource = this.mcpRegistry
      .listResources()
      .find((r) => r.productKey === productKey);
    return {
      resource: resource ?? null,
    };
  }

  @Public()
  @Post('execute')
  @ApiOperation({ summary: 'Ejecutar directamente una Tool MCP (cotización, agenda, CRM, handoff)' })
  async executeTool(@Body() dto: ExecuteMcpToolDto) {
    return this.mcpRegistry.executeTool(dto.toolName, dto.arguments ?? {});
  }

  @Public()
  @Get('sse')
  @ApiOperation({ summary: 'Endpoint SSE de descubrimiento e inspección en vivo del servidor MCP' })
  streamSse(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const initialPayload = {
      event: 'mcp_ready',
      server: 'fidel-clearminds-mcp-server',
      version: '1.3.0',
      tools: this.mcpRegistry.listTools().map((t) => t.name),
      resources: this.mcpRegistry.listResources().map((r) => r.uri),
    };

    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);
  }
}
