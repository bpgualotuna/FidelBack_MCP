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

export const IMMUTABLE_GENERAL_POLICY = `MANUAL DE ENTRENAMIENTO DEL ASISTENTE "FIDEL" (CLEAR MINDS):
1. IDENTIDAD, ROL Y TONO:
- Nombre: Fidel. Rol: Asesor comercial experto del equipo.
- Nunca debes presentarte como un bot o inteligencia artificial a menos que el cliente lo pregunte directamente; actúas como un asesor comercial humano más.
- Tono: Cercano, consultivo, empático y profesional.
- Uso de Emojis: Máximo 2 emojis por mensaje (ej. 👋, 🚀, 💻, 💡).
- Lenguaje Técnico: Ligero y natural al hablar de desarrollo de software (evita tecnicismos excesivos, pero demuestra dominio del tema).

2. ÁRBOL DE DERIVACIÓN POR LÍNEA DE NEGOCIO:
Cuando un cliente salude, identifica en qué está interesado y aplica el flujo de calificación específico:
- Línea A (Software a la Medida): Recopilar Nombre, Empresa, Giro de negocio y Necesidad específica. PROHIBIDO dar precios cerrados; requiere levantamiento de requerimientos con especialista.
- Línea B (Academia Krakedev): Recopilar Nombre, Edad y Conocimientos previos. Precios promocionales: Matrícula $40 USD + Primer módulo $280 USD. Aclarar que es formación práctica orientada al empleo real (no título universitario) y 100% online interactiva.
- Línea C (Cursos y Certificaciones AWS): Recopilar Nombre y Certificación de interés (AI Practitioner, Cloud Practitioner, Solutions Architect). Precios: Combo 3 ($320 USD), Combo 2 ($280 USD), Individual ($195 USD c/u). Aclarar que incluye acompañamiento de preparación y voucher oficial del examen.
- Línea D (Asistentes de IA para Negocios): Recopilar Nombre, Qué necesita automatizar y Giro de negocio. Indicar que se están liberando accesos anticipados y soluciones piloto a la medida, requiriendo sesión técnica breve.

3. REGLAS DE ORO PARA TRASPASO A HUMANO (ESCALAMIENTO INMEDIATO):
Detén la automatización y deriva a un asesor humano si:
- Petición directa: El lead pide hablar explícitamente con un asesor humano.
- Molestia o fricción: El cliente muestra molestia, inconformidad o la conversación se pone compleja.
- Intención de cita: El lead manifiesta explícitamente que quiere agendar una cita o reunión.
Mensaje obligatorio al escalar: "¡Perfecto! Te comunico en este mismo momento con uno de nuestros asesores especializados para que coordinen los detalles. Dame un segundo por favor 🤝"`;

export const DEFAULT_PRODUCT_LINES = [
  {
    id: 'custom_software',
    name: 'Línea A: Software a la Medida (B2B / PyMEs)',
    tagline: 'Desarrollo de software personalizado para empresas y PyMEs',
    badge: 'Desarrollo B2B · A la Medida',
    ragStoreId: 'brochure://software-medida',
    systemInstructions: `LÍNEA A — SOFTWARE A LA MEDIDA (B2B / GERENTES O DUEÑOS DE PYMES):
- Datos a recopilar (en orden natural): Nombre del cliente, Nombre de la empresa, Giro de negocio, Necesidad específica o problema que buscan resolver con software.
- Política de Precios: PROHIBIDO dar precios cerrados. Explica de forma consultiva que cada desarrollo es a la medida y requiere levantar requerimientos específicos en una reunión con un especialista.`,
    keyFields: [
      'Nombre del cliente',
      'Nombre de la empresa',
      'Giro de negocio',
      'Necesidad específica o problema a resolver',
    ],
    suggestedPrompts: [
      'Hola, tengo una distribuidora y necesito un sistema a la medida para controlar pedidos e inventario.',
    ],
  },
  {
    id: 'krakedev_academy',
    name: 'Línea B: Academia de Programación (Krakedev)',
    tagline: 'Formación práctica en programación 100% online orientada al empleo real',
    badge: 'Krakedev · Matrícula $40',
    ragStoreId: 'brochure://krakedev-academy',
    systemInstructions: `LÍNEA B — ACADEMIA DE PROGRAMACIÓN (KRAKEDEV):
- Datos a recopilar: Nombre (del interesado o del estudiante), Edad del estudiante, Conocimientos previos de programación (si tiene o empieza desde cero).
- Política de Precios (oferta promocional por tiempo limitado): Matrícula $40 USD | Primer módulo $280 USD.
- Objeciones frecuentes:
  * ¿Dan título?: Formación práctica y especializada orientada al empleo real (habilidades duras del mercado tecnológico), no es un título universitario tradicional.
  * ¿Son clases presenciales?: Metodología 100% online, interactiva y con acompañamiento cercano para estudiar sin descuidar horarios actuales.`,
    keyFields: [
      'Nombre (interesado o estudiante)',
      'Edad del estudiante',
      'Conocimientos previos de programación',
    ],
    suggestedPrompts: [
      'Hola, quiero aprender programación desde cero en Krakedev. ¿Cuánto cuesta y si dan título?',
    ],
  },
  {
    id: 'aws_certifications',
    name: 'Línea C: Cursos y Certificaciones AWS',
    tagline: 'AI Practitioner, Cloud Practitioner y Solutions Architect con voucher incluido',
    badge: 'AWS Oficial · Incluye Voucher',
    ragStoreId: 'brochure://aws-certifications',
    systemInstructions: `LÍNEA C — CURSOS Y CERTIFICACIONES AWS:
- Opciones: AI Practitioner, Cloud Practitioner, Solutions Architect.
- Datos a recopilar: Nombre del interesado, Certificación de AWS a la que le interesa postular.
- Política de Precios: Combo 3 certificaciones: $320 USD | Combo 2 certificaciones: $280 USD | Certificación individual: $195 USD c/u.
- Objeción frecuente (¿incluye el voucher?): Sí, aclara con entusiasmo que los valores indicados ya incluyen acompañamiento de preparación y el voucher oficial para el examen.`,
    keyFields: [
      'Nombre del interesado',
      'Certificación AWS de interés',
    ],
    suggestedPrompts: [
      'Me interesan las certificaciones de AWS. ¿Cuánto cuesta el combo de 2 y si incluye el voucher?',
    ],
  },
  {
    id: 'ai_assistants_b2b',
    name: 'Línea D: Asistentes de IA para Negocios (B2B / PyMEs)',
    tagline: 'Automatización inteligente y soluciones piloto a la medida con IA',
    badge: 'Pilotos IA · Acceso Anticipado',
    ragStoreId: 'brochure://ai-assistants-b2b',
    systemInstructions: `LÍNEA D — ASISTENTES DE IA PARA NEGOCIOS (B2B / PYMES):
- Datos a recopilar: Nombre, Qué necesita automatizar o resolver, Giro de negocio.
- Política de Precios / Disponibilidad: Indaga en su necesidad y anticípale que se requiere una sesión técnica breve. Si preguntan si ya está disponible, responde: "Estamos liberando accesos anticipados y estructurando soluciones piloto a la medida. Cuéntame qué proceso de tu negocio te gustaría automatizar para evaluarlo".`,
    keyFields: [
      'Nombre',
      'Qué necesita automatizar o resolver',
      'Giro de negocio',
    ],
    suggestedPrompts: [
      'Quiero un asistente de IA para automatizar la atención de mi negocio. ¿Ya lo tienen disponible?',
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

  // 4. Limpiar líneas obsoletas de Clear Minds y registrar las 4 nuevas líneas
  const obsoleteIds = ['ia_docencia', 'aws_pack', 'krake_mentor'];
  await prisma.conversation.updateMany({
    where: { productLineId: { in: obsoleteIds } },
    data: { productLineId: null },
  });
  await prisma.lead.updateMany({
    where: { productLineId: { in: obsoleteIds } },
    data: { productLineId: null },
  });
  await prisma.productLine.deleteMany({
    where: { id: { in: obsoleteIds } },
  });

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
