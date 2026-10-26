import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomBytes, scryptSync } from 'crypto';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function hashPasswordSafe(plainText: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bcrypt = require('bcrypt') as typeof import('bcrypt');
    return bcrypt.hashSync(plainText, 10);
  } catch {
    const salt = randomBytes(16).toString('hex');
    const derived = scryptSync(plainText, salt, 64).toString('hex');
    return `scrypt$${salt}$${derived}`;
  }
}

export const IMMUTABLE_GENERAL_POLICY = `POLÍTICA GENERAL DE FIDEL (CLEAR MINDS):
1. Eres Fidel, asesor comercial consultivo de Clear Minds y sus unidades de negocio (KrakeDev, Movilis, Software a la Medida).
2. Tono: Profesional, cordial, empático y altamente conciso (máximo 2 a 3 oraciones por respuesta).
3. Regla de oro comercial: Realiza UNA sola pregunta de cualificación a la vez para mantener la conversación ágil y agradable.
4. Nunca inventes precios, fechas ni promociones que no figuren en los brochures autorizados.
5. Si el cliente solicita agendar una cita o reunión, coordina fecha y hora para la llamada/diagnóstico.
6. Nunca ofrezcas descuentos espontáneos que no estén en la política oficial (ej. promoción de lanzamiento o grupos).`;

export const DEFAULT_PRODUCT_LINES = [
  {
    id: 'ia_docencia',
    name: 'Diplomado práctico en IA aplicada a la docencia',
    tagline: '128 horas académicas con aval universitario UHE y UDLA (37 herramientas IA)',
    badge: 'Aval UHE & UDLA · 128 Hrs',
    ragStoreId: 'brochure://ia-docencia',
    systemInstructions: `DIPLOMADO PRÁCTICO EN IA APLICADA A LA DOCENCIA:
- Duración: 128 horas académicas (4 meses / 16 semanas).
- Modalidad: 100% virtual (48h sincrónicas por Zoom + 80h trabajo autónomo práctico).
- Horarios: Lunes y miércoles de 19h00 a 20h30 (inicio 18 de mayo) O Sábados de 08h30 a 11h30 (inicio 9 de mayo).
- Inversión Normal: $360 USD.
- Precio Promocional: $249 USD (30% OFF - inscripción inicial $69 + 3 cuotas mensuales de $60).
- Pago de Contado: $230 USD.
- Descuentos Grupos: 3 personas = $209 c/u ($627 total) | 5 o más personas = $199 c/u ($995 total).
- Aval Universitario: Universidad Hemisferios (UHE) y UDLA, incluido sin costo adicional + 4 insignias digitales verificables en Blockchain con Credly.`,
    keyFields: [
      'Nombre',
      'Institución Educativa',
      'Cargo / Nivel que enseña',
      'Tamaño de grupo (1, 3 o 5+)',
      'Interés en Aval Universitario',
      'Forma de pago preferida',
    ],
    suggestedPrompts: [
      'Hola, somos 3 docentes interesados en el Diplomado de IA. ¿Cuánto nos cuesta y cómo son las cuotas?',
      '¿El aval de la Universidad Hemisferios y UDLA tiene algún costo adicional?',
    ],
  },
  {
    id: 'aws_pack',
    name: 'Pack 2 Certificaciones Internacionales en AWS',
    tagline: 'Cloud Practitioner (CLF-C02) + AI Practitioner (AIF-C01) en 10 semanas',
    badge: 'Doble Certificación AWS',
    ragStoreId: 'brochure://aws-pack',
    systemInstructions: `PACK 2 CERTIFICACIONES INTERNACIONALES EN AWS:
- Certificaciones Objetivo: AWS Certified Cloud Practitioner (CLF-C02) + AWS Certified AI Practitioner (AIF-C01).
- Duración: 120 horas totales (10 semanas: 70h en vivo + 50h en plataforma con simuladores).
- Horarios: Lunes, martes y jueves de 19h00 a 21h00 + Sábados de 09h00 a 10h00 (inicio 4 de mayo).
- Inversión Normal: $450 USD | Precio Promocional: $279 USD (Inscripción $99 + 2 cuotas de $90) | Contado: $250 USD.
- Descuentos Grupos: 3 personas = $235 c/u ($705 total) | 5 o más personas = $220 c/u ($1,100 total).
- Vouchers incluidos: 100% descuento examen AI Practitioner + 50% descuento examen Cloud Practitioner.`,
    keyFields: [
      'Nombre',
      'Perfil / Rol actual',
      'Objetivo (Empleabilidad / Ascenso)',
      'Modalidad de pago ($99 inscripción o Contado $250)',
      'Tamaño de grupo (Individual, 3 o 5+)',
      'Disponibilidad de horario',
    ],
    suggestedPrompts: [
      'Quiero certificarme en AWS Cloud y AI Practitioner. ¿Qué precio tiene de contado y para 3 amigos?',
    ],
  },
  {
    id: 'krake_mentor',
    name: 'Krake Mentor — Plataforma B2B de Capacitación y Evaluación con IA',
    tagline: 'Tutor IA 24/7, evaluación conversacional oral/escrita y analítica de brechas',
    badge: 'Plataforma Corporativa B2B',
    ragStoreId: 'brochure://krake-mentor',
    systemInstructions: `KRAKE MENTOR — PLATAFORMA DE CAPACITACIÓN Y EVALUACIÓN CON IA:
- Enfoque: Solución corporativa B2B de formación inteligente y verificación real del aprendizaje.
- Diferencial: Transforma manuales PDF, videos y presentaciones en rutas con tutoría IA 24/7 y evaluación conversacional oral/escrita.
- Acción Comercial: Agendar Demo Ejecutiva con el equipo de Clear Minds.`,
    keyFields: [
      'Nombre y Cargo',
      'Empresa / Institución',
      'Cantidad de colaboradores a capacitar',
      'Proceso a optimizar (Onboarding, Ventas, Normativa)',
      'Formatos de contenido actuales',
      'Fecha tentativa de demo',
    ],
    suggestedPrompts: [
      'Necesitamos capacitar a 80 vendedores con nuestros manuales PDF. ¿Podemos agendar una demo de Krake Mentor?',
    ],
  },
  {
    id: 'custom_software',
    name: 'Clear Minds — Desarrollo de Software a la Medida & Consultoría IA',
    tagline: 'Desarrollo Web/Móvil empresarial, Cloud AWS, Agentes MCP e integraciones ERP/CRM',
    badge: 'Fábrica de Software Clear Minds',
    ragStoreId: 'brochure://software-medida',
    systemInstructions: `DESARROLLO DE SOFTWARE A LA MEDIDA & CONSULTORÍA IA — CLEAR MINDS:
- Soluciones: Desarrollo Web y Móvil empresarial, Arquitecturas Cloud en AWS, Agentes de IA con protocolo MCP (WhatsApp, Web, CRM), Integración de pasarelas de pago y ERPs.
- Acción Comercial: Levantar requerimiento técnico y agendar sesión de arquitectura gratuita de 30 minutos.`,
    keyFields: [
      'Nombre',
      'Empresa',
      'Dolor / Necesidad Técnica',
      'Presupuesto Estimado',
      'Plazo / Urgencia',
      'Sistemas actuales a integrar',
    ],
    suggestedPrompts: [
      'Queremos desarrollar una app móvil conectada a nuestro SAP y un agente de WhatsApp. ¿Agendamos reunión?',
    ],
  },
];

async function main() {
  console.log('🌱 Iniciando Seed de FidelBack_MCP en Supabase PostgreSQL...');

  const passwordHash = hashPasswordSafe('ClearMinds2026!');

  // 1. Usuarios Admin por defecto (soporta ambos correos comunes)
  for (const email of ['admin@clearminds.ec', 'admin@clearminds-it.com']) {
    await prisma.user.upsert({
      where: { email },
      update: { passwordHash, tenantSlug: 'clearminds', isActive: true },
      create: {
        email,
        passwordHash,
        fullName: 'Administrador Clear Minds',
        role: 'ADMIN',
        tenantSlug: 'clearminds',
      },
    });
  }

  // 2. Tenant principal: Clear Minds
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'clearminds' },
    update: {
      generalPolicy: IMMUTABLE_GENERAL_POLICY,
      apiKey: 'fidel_live_clearminds_2026',
    },
    create: {
      slug: 'clearminds',
      name: 'Clear Minds / KrakeDev',
      apiKey: 'fidel_live_clearminds_2026',
      generalPolicy: IMMUTABLE_GENERAL_POLICY,
      memoryThreshold: 5,
    },
  });

  // 3.Segundo Tenant de demostración Multi-Empresa (ej. Academia Demo)
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'academia-futuro' },
    update: {
      apiKey: 'fidel_live_academia_2026',
    },
    create: {
      slug: 'academia-futuro',
      name: 'Academia Futuro Digital (Demo Multi-Empresa)',
      apiKey: 'fidel_live_academia_2026',
      generalPolicy:
        'Eres el asesor virtual de Academia Futuro Digital. Responde siempre con entusiasmo, ofrece becas del 20% y agenda llamadas de admisión.',
      memoryThreshold: 5,
    },
  });

  await prisma.user.upsert({
    where: { email: 'asesor@academiafuturo.com' },
    update: { passwordHash, tenantSlug: demoTenant.slug, isActive: true },
    create: {
      email: 'asesor@academiafuturo.com',
      passwordHash,
      fullName: 'Asesor Academia Futuro',
      role: 'ADVISOR',
      tenantSlug: demoTenant.slug,
    },
  });

  // 4. Líneas de Producto para Clear Minds
  for (const line of DEFAULT_PRODUCT_LINES) {
    await prisma.productLine.upsert({
      where: { id: line.id },
      update: {
        name: line.name,
        tagline: line.tagline,
        badge: line.badge,
        ragStoreId: line.ragStoreId,
        systemInstructions: line.systemInstructions,
        keyFieldsJson: JSON.stringify(line.keyFields),
        suggestedPrompts: JSON.stringify(line.suggestedPrompts),
      },
      create: {
        id: line.id,
        tenantId: tenant.id,
        name: line.name,
        tagline: line.tagline,
        badge: line.badge,
        ragStoreId: line.ragStoreId,
        systemInstructions: line.systemInstructions,
        keyFieldsJson: JSON.stringify(line.keyFields),
        suggestedPrompts: JSON.stringify(line.suggestedPrompts),
      },
    });
  }

  console.log('✅ Seed completado en Supabase:');
  console.log('   - Empresa 1: Clear Minds (slug: clearminds | apiKey: fidel_live_clearminds_2026)');
  console.log('   - Empresa 2: Academia Futuro Digital (slug: academia-futuro | apiKey: fidel_live_academia_2026)');
  console.log('   - Logins: admin@clearminds.ec / ClearMinds2026!  |  asesor@academiafuturo.com / ClearMinds2026!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
