import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../../common/decorators/public.decorator';
import { CrmService } from '../../application/services/crm.service';
import { UpdateTenantConfigDto } from '../dtos/update-tenant-config.dto';

@ApiTags('CRM & Tenant Config')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Public()
  @Get('tenants/:slug')
  @ApiOperation({ summary: 'Obtener configuración del agente y catálogo de líneas de negocio' })
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
  @ApiOperation({ summary: 'Listar citas comerciales agendadas por Fidel MCP' })
  async listAppointments() {
    return this.crmService.listAppointments();
  }
}
