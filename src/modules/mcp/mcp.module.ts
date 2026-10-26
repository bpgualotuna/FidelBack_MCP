import { Module } from '@nestjs/common';
import { McpController } from './api/controllers/mcp.controller';
import { McpRegistryService } from './application/services/mcp-registry.service';

@Module({
  controllers: [McpController],
  providers: [McpRegistryService],
  exports: [McpRegistryService],
})
export class McpModule {}
