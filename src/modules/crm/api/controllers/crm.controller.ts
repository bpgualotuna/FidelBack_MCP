import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { CrmService } from '../../application/services/crm.service';
import { CreateTenantDto, UpdateTenantConfigDto } from '../dtos/update-tenant-config.dto';

@ApiTags('CRM & Multi-Tenant Management')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Public()
  @Get('tenants')
  @ApiOperation({ summary: 'Listar todas las empresas (Tenants) registradas y sus API Keys' })
  async listTenants() {
    return this.crmService.listTenants();
  }

  @Public()
  @Post('tenants')
  @ApiOperation({ summary: 'Registrar una nueva empresa (Tenant) y generar su API Key para WhatsApp/CRMs' })
  async createTenant(@Body() dto: CreateTenantDto) {
    return this.crmService.createTenant(dto);
  }

  @Public()
  @Post('tenants/:slug/api-key/rotate')
  @ApiOperation({ summary: 'Rotar / regenerar la API Key de una empresa' })
  async rotateApiKey(@Param('slug') slug: string) {
    return this.crmService.rotateApiKey(slug);
  }

  @Public()
  @Get('tenants/:slug')
  @ApiOperation({ summary: 'Obtener configuración del agente y catálogo de líneas de negocio de una empresa' })
  async getTenant(@Param('slug') slug: string) {
    return this.crmService.getTenantConfig(slug);
  }

  @Public()
  @Patch('tenants/:slug')
  @ApiOperation({ summary: 'Actualizar personalidad, reglas globales o intervalo de resumen del tenant' })
  async updateTenant(
    @Param('slug') slug: string,
    @Body() dto: UpdateTenantConfigDto,
  ) {
    return this.crmService.updateTenantConfig(slug, dto);
  }

  @Public()
  @Get('appointments')
  @ApiOperation({ summary: 'Listar citas comerciales agendadas por Fidel MCP en Supabase' })
  async listAppointments() {
    return this.crmService.listAppointments();
  }
}
