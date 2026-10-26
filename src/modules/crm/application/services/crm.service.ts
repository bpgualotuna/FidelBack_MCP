import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../context/database/prisma.service';
import { CLEARMINDS_MCP_RESOURCES } from '../../mcp/infrastructure/resources/clearminds-catalog.resource';
import { TenantProfileEntity } from '../../domain/entities/tenant-profile.entity';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  private fallbackTenant: TenantProfileEntity = {
    id: 'tenant-clearminds-default',
    slug: 'clearminds',
    name: 'Clear Minds / KrakeDev',
    agentName: 'Fidel',
    agentRole: 'Asesor Comercial Senior & Consultor de Soluciones IA y Cloud',
    tone: 'Consultivo, empático, ejecutivo y enfocado en cierre comercial sin presión artificial.',
    globalRules:
      '1. Responde siempre en español neutro profesional.\n2. Detecta automáticamente de cuál de las 4 líneas de negocio habla el cliente.\n3. No inventes precios ni horarios fuera de los brochures oficiales.',
    summaryInterval: 5,
  };

  constructor(private readonly prisma: PrismaService) {}

  async getTenantConfig(slug = 'clearminds') {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
        include: { productLines: { where: { isActive: true } } },
      });

      if (tenant) {
        return {
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            agentName: tenant.agentName,
            agentRole: tenant.agentRole,
            tone: tenant.tone,
            globalRules: tenant.globalRules,
            summaryInterval: tenant.summaryInterval,
          },
          productLines: tenant.productLines,
          persistenceMode: 'POSTGRES_PRISMA',
        };
      }
    } catch (err) {
      this.logger.debug(`Usando configuración en memoria para tenant (${(err as Error).message})`);
    }

    return {
      tenant: this.fallbackTenant,
      productLines: CLEARMINDS_MCP_RESOURCES.map((r) => ({
        key: r.productKey,
        title: r.name,
        brochureContext: r.content,
        requiredFields: r.requiredFields,
      })),
      persistenceMode: 'IN_MEMORY_FALLBACK',
    };
  }

  async updateTenantConfig(
    slug: string,
    payload: Partial<Omit<TenantProfileEntity, 'id' | 'slug'>>,
  ) {
    this.fallbackTenant = {
      ...this.fallbackTenant,
      ...payload,
    };

    try {
      const updated = await this.prisma.tenant.update({
        where: { slug },
        data: {
          name: payload.name,
          agentName: payload.agentName,
          agentRole: payload.agentRole,
          tone: payload.tone,
          globalRules: payload.globalRules,
          summaryInterval: payload.summaryInterval,
        },
      });
      return { tenant: updated, persistenceMode: 'POSTGRES_PRISMA' };
    } catch {
      return { tenant: this.fallbackTenant, persistenceMode: 'IN_MEMORY_FALLBACK' };
    }
  }

  async listAppointments() {
    try {
      const items = await this.prisma.appointment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
      });
      return { appointments: items, persistenceMode: 'POSTGRES_PRISMA' };
    } catch {
      return { appointments: [], persistenceMode: 'IN_MEMORY_FALLBACK' };
    }
  }
}
