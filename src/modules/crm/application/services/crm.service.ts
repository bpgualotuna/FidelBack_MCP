import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../../context/database/prisma.service';
import { CLEARMINDS_MCP_RESOURCES } from '../../../mcp/infrastructure/resources/clearminds-catalog.resource';
import { McpResourceDefinition } from '../../../mcp/domain/interfaces/mcp-tool.port';
import { TenantProfileEntity } from '../../domain/entities/tenant-profile.entity';
import { CreateTenantDto } from '../../api/dtos/update-tenant-config.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  private fallbackTenant: TenantProfileEntity = {
    id: 'tenant-clearminds-default',
    slug: 'clearminds',
    name: 'Clear Minds / KrakeDev',
    agentName: 'Fidel',
    agentRole: 'Asesor Comercial Experto',
    tone: 'Cercano, consultivo, empático y profesional (máximo 2 emojis por mensaje).',
    globalRules:
      '1. Nunca te presentes como bot o IA a menos que el cliente lo pregunte directamente; actúas como asesor comercial humano.\n2. Califica al cliente según su línea (Software a la Medida, Academia Krakedev, Cursos AWS, Asistentes IA).\n3. Si pide hablar con asesor humano, muestra molestia o pide agendar cita, transfiere inmediatamente.',
    summaryInterval: 5,
  };

  constructor(private readonly prisma: PrismaService) {}

  async listTenants() {
    try {
      const tenants = await this.prisma.tenant.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: { select: { productLines: true, conversations: true } },
        },
      });
      return {
        tenants: tenants.map((t) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          apiKey: t.apiKey,
          generalPolicy: t.generalPolicy,
          memoryThreshold: t.memoryThreshold,
          isActive: t.isActive,
          productLinesCount: t._count.productLines,
          conversationsCount: t._count.conversations,
        })),
        persistenceMode: 'SUPABASE_POSTGRES',
      };
    } catch (err) {
      this.logger.warn(`listTenants en modo fallback: ${(err as Error).message}`);
      return {
        tenants: [
          {
            id: this.fallbackTenant.id,
            slug: 'clearminds',
            name: 'Clear Minds / KrakeDev',
            apiKey: 'fidel_live_clearminds_2026',
            generalPolicy: this.fallbackTenant.globalRules,
            memoryThreshold: 5,
            isActive: true,
            productLinesCount: 4,
            conversationsCount: 0,
          },
        ],
        persistenceMode: 'IN_MEMORY_FALLBACK',
      };
    }
  }

  async createTenant(dto: CreateTenantDto) {
    const cleanSlug = dto.slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');
    const generatedKey = `fidel_live_${cleanSlug.replace(/-/g, '_')}_${randomBytes(4).toString('hex')}`;

    const created = await this.prisma.tenant.upsert({
      where: { slug: cleanSlug },
      update: {
        name: dto.name,
        generalPolicy:
          dto.generalPolicy ||
          `Eres el asesor comercial oficial de ${dto.name}. Atiende con cordialidad y precisión.`,
        memoryThreshold: dto.memoryThreshold ?? 5,
      },
      create: {
        slug: cleanSlug,
        name: dto.name,
        apiKey: generatedKey,
        generalPolicy:
          dto.generalPolicy ||
          `Eres el asesor comercial oficial de ${dto.name}. Atiende con cordialidad y precisión.`,
        memoryThreshold: dto.memoryThreshold ?? 5,
      },
    });

    return {
      tenant: created,
      persistenceMode: 'SUPABASE_POSTGRES',
    };
  }

  async rotateApiKey(slug: string) {
    const cleanSlug = slug.toLowerCase().trim();
    const newApiKey = `fidel_live_${cleanSlug.replace(/-/g, '_')}_${randomBytes(5).toString('hex')}`;

    const updated = await this.prisma.tenant.update({
      where: { slug: cleanSlug },
      data: { apiKey: newApiKey },
    });

    return {
      slug: updated.slug,
      name: updated.name,
      apiKey: updated.apiKey,
      message: 'API Key rotada exitosamente en Supabase.',
    };
  }

  async resolveTenantSlug(apiKey?: string, requestedSlug?: string): Promise<string> {
    if (apiKey?.trim()) {
      try {
        const tenantByKey = await this.prisma.tenant.findUnique({
          where: { apiKey: apiKey.trim() },
        });
        if (!tenantByKey || !tenantByKey.isActive) {
          throw new UnauthorizedException('API Key de empresa (x-tenant-key) inválida o inactiva.');
        }
        return tenantByKey.slug;
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
      }
    }
    return requestedSlug?.trim() || 'clearminds';
  }

  async getTenantConfig(slug = 'clearminds') {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug },
        include: { productLines: true },
      });

      if (tenant) {
        return {
          tenant: {
            id: tenant.id,
            slug: tenant.slug,
            name: tenant.name,
            apiKey: tenant.apiKey,
            agentName: this.fallbackTenant.agentName,
            agentRole: this.fallbackTenant.agentRole,
            tone: this.fallbackTenant.tone,
            globalRules: tenant.generalPolicy,
            summaryInterval: tenant.memoryThreshold,
          },
          productLines: tenant.productLines,
          persistenceMode: 'SUPABASE_POSTGRES',
        };
      }
    } catch (err) {
      this.logger.debug(`Usando configuración en memoria para tenant (${(err as Error).message})`);
    }

    return {
      tenant: {
        ...this.fallbackTenant,
        apiKey: 'fidel_live_clearminds_2026',
      },
      productLines: CLEARMINDS_MCP_RESOURCES.map((r: McpResourceDefinition) => ({
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
          generalPolicy: payload.globalRules,
          memoryThreshold: payload.summaryInterval,
        },
      });
      return {
        tenant: {
          ...this.fallbackTenant,
          id: updated.id,
          slug: updated.slug,
          apiKey: updated.apiKey,
          name: updated.name,
          globalRules: updated.generalPolicy,
          summaryInterval: updated.memoryThreshold,
        },
        persistenceMode: 'SUPABASE_POSTGRES',
      };
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
      return { appointments: items, persistenceMode: 'SUPABASE_POSTGRES' };
    } catch {
      return { appointments: [], persistenceMode: 'IN_MEMORY_FALLBACK' };
    }
  }

  async listTrainingRules(tenantSlug = 'clearminds') {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return { rules: [] };
    const rules = await this.prisma.trainingRule.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
    });
    return { rules };
  }

  async createTrainingRule(
    tenantSlug = 'clearminds',
    params: {
      instruction: string;
      category?: string;
      sourceFeedback?: string;
      createdByName?: string;
    },
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) {
      throw new UnauthorizedException(`Tenant no encontrado: ${tenantSlug}`);
    }
    const rule = await this.prisma.trainingRule.create({
      data: {
        tenantId: tenant.id,
        instruction: params.instruction.trim(),
        category: (params.category || 'GENERAL').toUpperCase(),
        sourceFeedback: params.sourceFeedback?.trim() || null,
        createdByName: params.createdByName?.trim() || 'Entrenador',
        isActive: true,
      },
    });
    return { rule };
  }

  async toggleTrainingRule(tenantSlug: string, ruleId: string, isActive: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return { rules: [] };
    await this.prisma.trainingRule.updateMany({
      where: { id: ruleId, tenantId: tenant.id },
      data: { isActive },
    });
    return this.listTrainingRules(tenantSlug);
  }

  async deleteTrainingRule(tenantSlug: string, ruleId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return { rules: [] };
    await this.prisma.trainingRule.deleteMany({
      where: { id: ruleId, tenantId: tenant.id },
    });
    return this.listTrainingRules(tenantSlug);
  }

  async getActiveTrainingRulesBlock(tenantSlug = 'clearminds'): Promise<string> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        select: { id: true },
      });
      if (!tenant) return '';

      const activeRules = await this.prisma.trainingRule.findMany({
        where: { tenantId: tenant.id, isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      if (activeRules.length === 0) return '';

      const list = activeRules
        .map((r, idx) => `${idx + 1}. [${r.category}] ${r.instruction}`)
        .join('\n');

      return `\n---\nREGLAS Y CORRECCIONES APRENDIDAS EN ENTRENAMIENTO (PRIORIDAD MÁXIMA — DEBES CUMPLIRLAS OBLIGATORIAMENTE SOBRE CUALQUIER OTRA REGLA DE ESTILO O CONTENIDO):\n${list}\n---\n`;
    } catch {
      return '';
    }
  }
}
