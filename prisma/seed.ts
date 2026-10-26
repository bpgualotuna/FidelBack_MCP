import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
    name: 'Diplomado en IA Aplicada a la Docencia',
    tagline: 'Transforma tu planificación, creación de recursos y evaluación docente con IA (120 hrs)',
    badge: 'Aval MOVILIS · 120 Hrs',
    ragStoreId: 'fileSearchStores/diplomado_ia_docencia',
    systemInstructions: `BASE DE CONOCIMIENTO AUTORIZADA — DIPLOMADO EN IA APLICADA A LA DOCENCIA:
- Título Oficial: Diplomado en Inteligencia Artificial Aplicada a la Docencia.
- Aval Institucional: Avalado por el Instituto Tecnológico de Educación Superior MOVILIS.
- Docente Principal: Ing. Santiago Mosquera (Director de KrakeDev y Director Académico de Movilis, MBA por UNIR, Ingeniero en Sistemas EPN, 12 años instructor en Clear Minds, TEDx Speaker, capacitador de más de 20.000 docentes y estudiantes).
- Duración y Carga: 3 meses, 120 horas académicas totales (40 horas de clases síncronas en vivo + 80 horas de aplicación práctica).
- Horario de Clases: Martes y Jueves de 18h00 a 20h00 (Modalidad Online síncrona).
- Próxima Cohorte: Inicio 11 de enero de 2027.
- Dirigido a: Docentes de básica, bachillerato, universidad, coordinadores académicos y capacitadores. ¡NO requiere experiencia previa en IA!
- Temario y Módulos:
  * Módulo 1 (40 hrs) - Productividad docente con IA: Prompting para docentes, ChatGPT, Claude, Gemini, NotebookLM, Canva, Gamma. Planificación de clases y unidades completas.
  * Módulo 2 (40 hrs) - Evaluación y actividades interactivas: Cuestionarios, rúbricas y criterios, Quizizz y Kahoot con IA, retroalimentación asistida.
  * Módulo 3 (40 hrs) - Recursos digitales y multimedia: Generación de imágenes, infografías, guiones educativos, videos con IA, narración y audio, ética docente.
- Inversión y Precios:
  * Precio Regular: USD $300.
  * Precio Especial de Lanzamiento: USD $250.
  * Reserva de cupo: Se puede reservar con USD $100 y congelar el precio de lanzamiento de $250. El saldo se paga antes de iniciar.
  * Beneficios para grupos de docentes e instituciones educativas.
  * Métodos de pago: Tarjeta de crédito, transferencia, efectivo. Contacto: 098 709 9635.`,
    keyFields: [
      { key: 'institucion_educativa', label: 'Institución / Colegio / Universidad', placeholder: 'Ej. Colegio San Gabriel / Univ. Central' },
      { key: 'nivel_docencia', label: 'Nivel Docente', placeholder: 'Ej. Bachillerato / Educación Básica / Universidad' },
      { key: 'tipo_pago_interes', label: 'Modalidad de Pago', placeholder: 'Ej. Reserva $100 / Pago total $250' },
      { key: 'contacto_docente', label: 'Contacto / Teléfono', placeholder: 'Ej. 099xxxxxxx' }
    ],
    suggestedPrompts: [
      'Hola, soy docente de bachillerato y me interesa el diplomado de IA. ¿Cuál es el costo y horario?',
      '¿Cómo puedo congelar el precio especial de $250 con la reserva de $100?',
      '¿El certificado cuenta con aval institucional de MOVILIS y cuántas horas acredita?',
      '¿Qué herramientas de IA aprenderemos para planificar clases y rúbricas de evaluación?'
    ]
  },
  {
    id: 'aws_pack',
    name: 'AWS Pack 2 Certificaciones (AI Practitioner + Solutions Architect)',
    tagline: 'Certificaciones mundiales en la nube AWS: Desde IA y Cloud Practitioner hasta Arquitectura',
    badge: 'Certificaciones AWS Oficiales',
    ragStoreId: 'fileSearchStores/aws_pack_certificaciones',
    systemInstructions: `BASE DE CONOCIMIENTO AUTORIZADA — AWS PACK CERTIFICACIONES:
- Enfoque: Preparación integral para rendir y aprobar exámenes oficiales de certificación de Amazon Web Services.
- Programas y Fechas de Inicio:
  * Ruta 1: AWS Certified AI Practitioner (Fundamentos de IA/ML, Bedrock, SageMaker, Amazon Q, GenAI, Prompt Engineering). Inicio: 26 de Octubre.
  * Ruta 2: AWS Certified Solutions Architect - Associate (Diseño de arquitecturas escalables, EC2, IAM, S3, RDS, VPC, Serverless Lambda, Disaster Recovery, Alta Disponibilidad). Inicio: 11 de Enero.
- Duración y Horarios: 6 semanas de duración intensiva. Clases: Martes, Miércoles y Jueves de 19h30 a 21h30 (Online en vivo).
- Metodología: Práctica en consola real de AWS, análisis de lógica de preguntas de examen oficial, casos reales de arquitectura empresarial.
- Promociones y Precios Grupales / Empresariales (Valores por persona):
  * PACK 1 CERTIFICACIÓN:
    - 2 personas: $185 c/u | 3 personas: $175 c/u | 5 personas: $150 c/u | 10 o más personas: $130 c/u
    - Beneficio: Incluye 2 vouchers de AI Practitioner y 1 voucher de examen de regalo al mejor puntuado.
  * PACK 2 CERTIFICACIONES (AI Practitioner + Solutions Architect):
    - 2 personas: $260 c/u | 3 personas: $250 c/u | 5 personas: $230 c/u | 10 o más personas: $210 c/u
    - Beneficio: Incluye vouchers de certificación oficial.`,
    keyFields: [
      { key: 'ruta_certificacion', label: 'Ruta Deseada', placeholder: 'Ej. Pack 2 Certificaciones / Solo AI Practitioner' },
      { key: 'numero_personas', label: 'Número de Personas', placeholder: 'Ej. Individual / Grupo de 3 personas' },
      { key: 'experiencia_cloud', label: 'Experiencia en AWS / Cloud', placeholder: 'Ej. Principiante / Administrador TI' },
      { key: 'contacto_empresa', label: 'Empresa / Contacto', placeholder: 'Ej. Líder Técnico / CTO' }
    ],
    suggestedPrompts: [
      'Queremos capacitar a nuestro equipo técnico en AWS, ¿qué precios tienen para 3 o 5 personas?',
      '¿Qué fechas de inicio y horarios tienen para el pack de Solutions Architect y AI Practitioner?',
      '¿El programa incluye los vouchers para los exámenes oficiales de AWS?',
      '¿Cómo es la metodología con laboratorios prácticos en consola real de AWS?'
    ]
  },
  {
    id: 'krake_mentor',
    name: 'Krake Mentor (Orientación Vocacional con IA)',
    tagline: 'Descubre tu vocación profesional y proyecto de vida antes de elegir qué estudiar en la universidad',
    badge: 'Orientación Vocacional IA',
    ragStoreId: 'fileSearchStores/krake_mentor_vocacional',
    systemInstructions: `BASE DE CONOCIMIENTO AUTORIZADA — KRAKE MENTOR:
- Filosofía: "Antes de elegir qué estudiar, conoce quién eres. De: 'No sé qué estudiar' a: 'Ahora sé qué puedo explorar'".
- Qué es: Experiencia completa de orientación vocacional que combina autoconocimiento con Inteligencia Artificial para estudiantes que están por definir su carrera.
- Metodología Científica Integrada:
  * Integra dimensiones de personalidad y preferencias: RIASEC, Big Five, DAT/GATB (aptitudes), Career Anchors / Work Values, SCCT y enfoques de Donald Super y Mark Savickas.
- Inversión y Precios:
  * Precio Regular: $40 + IVA.
  * Promoción Especial: $25 + IVA (experiencia completa con informe personalizado).
  * ESCOLTAS: Descuento especial por mérito académico.
  * ABANDERADOS: 100% GRATIS (como reconocimiento a su liderazgo y compromiso).
  * Contacto oficial: 096 908 9700 / info@clearminds-it.com.`,
    keyFields: [
      { key: 'tipo_estudiante', label: 'Grado / Colegio', placeholder: 'Ej. 3ro de Bachillerato / Graduado' },
      { key: 'es_abanderado_escolta', label: 'Mérito (Abanderado / Escolta)', placeholder: 'Ej. Sí, es abanderada (Aplica Gratis!)' },
      { key: 'area_interes', label: 'Área de Interés Preliminar', placeholder: 'Ej. Tecnología, Negocios o Salud' },
      { key: 'contacto_representante', label: 'Teléfono Representante / Alumno', placeholder: 'Ej. 0969xxxxxx' }
    ],
    suggestedPrompts: [
      'Hola, mi hijo está en 3ro de bachillerato y no sabe qué estudiar. ¿Cómo funciona Krake Mentor?',
      '¿Es verdad que para abanderados la orientación vocacional con IA es 100% gratuita?',
      '¿Cuánto cuesta la promoción especial de $25 y qué incluye el informe vocacional?',
      '¿Qué modelos psicológicos y dimensiones de personalidad evalúa el test?'
    ]
  },
  {
    id: 'custom_software',
    name: 'Clear Minds — Software a la Medida & Consultoría',
    tagline: 'Desarrollo ágil de plataformas SaaS, Apps móviles nativas y modernización cloud',
    badge: 'Fábrica de Software Clear Minds',
    ragStoreId: 'fileSearchStores/clearminds_custom_dev',
    systemInstructions: `BASE DE CONOCIMIENTO AUTORIZADA — CLEAR MINDS CONSULTING:
- Quiénes somos: Clear Minds Consultores, más de 12 años de trayectoria desarrollando software empresarial de alto impacto.
- Servicios:
  * Desarrollo de plataformas web y SaaS escalables en la nube.
  * Aplicaciones móviles nativas y multiplataforma (Flutter, React Native, iOS, Android).
  * Modernización de sistemas legacy a arquitecturas serverless y microservicios en AWS.
  * Consultoría en Inteligencia Artificial aplicada a negocios y automatización de procesos.
- Proceso comercial: Diagnóstico técnico gratuito de 30 minutos con un arquitecto de software de Clear Minds.`,
    keyFields: [
      { key: 'tipo_solucion', label: 'Tipo de Software Requerido', placeholder: 'Ej. App móvil multiplataforma / Plataforma SaaS' },
      { key: 'plazo_deseado', label: 'Plazo Estimado', placeholder: 'Ej. 3 a 4 meses' },
      { key: 'etapa_proyecto', label: 'Etapa del Proyecto', placeholder: 'Ej. Especificación / MVP / Migración' },
      { key: 'presupuesto_estimado', label: 'Rango de Presupuesto', placeholder: 'Ej. $3,000 - $6,000 USD' }
    ],
    suggestedPrompts: [
      'Queremos cotizar el desarrollo de una app móvil de logística con pasarela de pagos.',
      'Tenemos un sistema empresarial antiguo en PHP y queremos modernizarlo a la nube en 3 meses.',
      'Me gustaría agendar una reunión de descubrimiento técnico con el equipo de Clear Minds.',
      '¿Qué metodología de trabajo ágil aplican para construir un MVP?'
    ]
  }
];

async function main() {
  console.log('Seeding Clear Minds Fidel database...');

  // 1. Seed default Admin user
  const passwordHash = await bcrypt.hash('ClearMinds2026!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@clearminds-it.com' },
    update: {},
    create: {
      email: 'admin@clearminds-it.com',
      passwordHash,
      fullName: 'Administrador Clear Minds',
      role: 'ADMIN'
    }
  });

  // 2. Seed Clear Minds Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'clearminds' },
    update: {
      generalPolicy: IMMUTABLE_GENERAL_POLICY
    },
    create: {
      slug: 'clearminds',
      name: 'Clear Minds Consultores',
      generalPolicy: IMMUTABLE_GENERAL_POLICY,
      memoryThreshold: 5
    }
  });

  // 3. Seed Product Lines
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
        suggestedPrompts: JSON.stringify(line.suggestedPrompts)
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
        suggestedPrompts: JSON.stringify(line.suggestedPrompts)
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
