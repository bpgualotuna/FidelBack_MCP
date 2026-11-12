import { McpResourceDefinition, McpToolDefinition } from '../../domain/interfaces/mcp-tool.port';

export const CLEARMINDS_MCP_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'brochure://software-medida',
    name: 'Línea A: Software a la Medida (B2B / Gerentes o Dueños de PyMEs)',
    description:
      'Desarrollo de software personalizado para empresas y PyMEs. Sin precios cerrados; requiere levantamiento de requerimientos con especialista.',
    mimeType: 'text/markdown',
    productKey: 'custom_software',
    requiredFields: [
      'Nombre del cliente',
      'Nombre de la empresa',
      'Giro de negocio',
      'Necesidad específica o problema a resolver',
    ],
    content: `# LÍNEA A: SOFTWARE A LA MEDIDA (B2B / PYMES)
- **Público objetivo**: Gerentes, directivos o dueños de PyMEs.
- **Datos a recopilar (en orden natural)**: Nombre del cliente, Nombre de la empresa, Giro de negocio y Necesidad específica o problema que buscan resolver con software.
- **Política de Precios**: PROHIBIDO dar precios cerrados. Explica de forma consultiva que cada desarrollo es a la medida y requiere levantar requerimientos específicos en una reunión con un especialista.
- **Lenguaje técnico**: Ligero y natural (evita tecnicismos innecesarios, demuestra dominio del tema).`,
  },
  {
    uri: 'brochure://krakedev-academy',
    name: 'Línea B: Academia de Programación (Krakedev)',
    description:
      'Formación práctica y especializada en programación orientada al empleo real. Matrícula $40 USD y primer módulo $280 USD.',
    mimeType: 'text/markdown',
    productKey: 'krakedev_academy',
    requiredFields: [
      'Nombre (interesado o estudiante)',
      'Edad del estudiante',
      'Conocimientos previos de programación',
    ],
    content: `# LÍNEA B: ACADEMIA DE PROGRAMACIÓN (KRAKEDEV)
- **Público objetivo**: Estudiantes, profesionales en transición o padres de familia.
- **Datos a recopilar**: Nombre (del interesado o del estudiante), Edad del estudiante, Conocimientos previos de programación (si tiene o empieza desde cero).
- **Política de Precios (Oferta promocional por tiempo limitado)**:
  - **Matrícula**: $40 USD.
  - **Primer módulo**: $280 USD.
- **Manejo de Objeciones Frecuentes**:
  - *¿Dan título?*: Aclara de forma transparente que es una formación práctica y especializada en programación orientada al empleo real (enfocada en habilidades duras del mercado tecnológico), no un título universitario tradicional.
  - *¿Son clases presenciales?*: Explica que la metodología es 100% online, interactiva y con acompañamiento cercano, lo que les permite estudiar sin descuidar sus horarios actuales.`,
  },
  {
    uri: 'brochure://aws-certifications',
    name: 'Línea C: Cursos y Certificaciones AWS',
    description:
      'Preparación oficial para certificaciones AWS (AI Practitioner, Cloud Practitioner, Solutions Architect) con voucher oficial incluido.',
    mimeType: 'text/markdown',
    productKey: 'aws_certifications',
    requiredFields: [
      'Nombre del interesado',
      'Certificación AWS de interés (AI Practitioner, Cloud Practitioner, Solutions Architect)',
    ],
    content: `# LÍNEA C: CURSOS Y CERTIFICACIONES AWS
- **Opciones de certificación**: AI Practitioner, Cloud Practitioner, Solutions Architect.
- **Datos a recopilar**: Nombre del interesado y a qué certificación de AWS le interesa postular.
- **Política de Precios**:
  - **Combo 3 certificaciones**: $320 USD.
  - **Combo 2 certificaciones**: $280 USD.
  - **Certificación individual**: $195 USD c/u.
- **Manejo de Objeciones Frecuentes**:
  - *¿El precio incluye el voucher?*: Sí, aclara con entusiasmo que los valores indicados ya incluyen el acompañamiento de preparación y el voucher oficial para el examen.`,
  },
  {
    uri: 'brochure://ai-assistants-b2b',
    name: 'Línea D: Asistentes de IA para Negocios (B2B / PyMEs)',
    description:
      'Automatización inteligente y asistentes de IA para procesos de negocio. Accesos anticipados y soluciones piloto a medida.',
    mimeType: 'text/markdown',
    productKey: 'ai_assistants_b2b',
    requiredFields: [
      'Nombre',
      'Qué necesita automatizar o resolver',
      'Giro de negocio',
    ],
    content: `# LÍNEA D: ASISTENTES DE IA PARA NEGOCIOS (B2B / PYMES)
- **Datos a recopilar**: Nombre, Qué necesita automatizar o resolver, Giro de negocio.
- **Política de Precios y Disponibilidad**: Como aún no están liberados al público general de forma masiva o se requiere estructurar la solución, indaga en su necesidad y anticípale que se requiere una sesión técnica breve.
- **Respuesta si preguntan disponibilidad**: "Estamos liberando accesos anticipados y estructurando soluciones piloto a la medida. Cuéntame qué proceso de tu negocio te gustaría automatizar para evaluarlo".`,
  },
];

export const CLEARMINDS_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'cotizar_descuento_grupo',
    description:
      'Calcula precios exactos para Cursos/Certificaciones AWS (individual $195, combo 2 $280, combo 3 $320) o Academia Krakedev (matrícula $40 + primer módulo $280). Para Software a la Medida o Asistentes de IA indica sesión de levantamiento sin precios cerrados.',
    inputSchema: {
      type: 'object',
      properties: {
        productKey: {
          type: 'string',
          enum: ['custom_software', 'krakedev_academy', 'aws_certifications', 'ai_assistants_b2b'],
          description: 'Clave de la línea de negocio consultada.',
        },
        participants: {
          type: 'number',
          description: 'Cantidad de certificaciones (en AWS: 1, 2 o 3) o participantes.',
        },
        paymentMode: {
          type: 'string',
          enum: ['contado', 'cuotas'],
          description: 'Modalidad de pago consultada.',
        },
      },
      required: ['productKey', 'participants'],
    },
  },
  {
    name: 'agendar_cita',
    description:
      'Registra solicitud de reunión o cita cuando corresponda (Nota: si el cliente pide explícitamente agendar cita o hablar con un asesor, priorizar transferir_a_humano).',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID de la sesión de conversación.' },
        leadName: { type: 'string', description: 'Nombre completo del cliente.' },
        leadContact: { type: 'string', description: 'Teléfono WhatsApp o correo electrónico.' },
        productKey: {
          type: 'string',
          enum: ['custom_software', 'krakedev_academy', 'aws_certifications', 'ai_assistants_b2b'],
        },
        scheduledAt: {
          type: 'string',
          description: 'Fecha y hora solicitada (ISO 8601 o texto descriptivo).',
        },
        notes: { type: 'string', description: 'Notas del requerimiento o contexto comercial.' },
      },
      required: ['leadName', 'productKey', 'scheduledAt'],
    },
  },
  {
    name: 'registrar_lead_crm',
    description:
      'Guarda o actualiza en tiempo real los atributos comerciales extraídos del prospecto y su nivel de intención en el CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        productKey: {
          type: 'string',
          enum: ['custom_software', 'krakedev_academy', 'aws_certifications', 'ai_assistants_b2b'],
        },
        intentLevel: {
          type: 'string',
          enum: ['ALTO', 'MEDIO', 'BAJO'],
        },
        extractedFields: {
          type: 'object',
          description: 'Mapa clave-valor de campos extraídos según la línea de negocio.',
        },
      },
      required: ['productKey', 'extractedFields'],
    },
  },
  {
    name: 'transferir_a_humano',
    description:
      'Cambia el estado de la conversación a HUMAN_ACTIVE (Modo Espejo / Escalamiento) cuando el cliente pide hablar con un asesor, muestra molestia/fricción o manifiesta intención explícita de agendar una cita o reunión.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID de la sesión a transferir.' },
        reason: { type: 'string', description: 'Motivo de la transferencia al asesor humano.' },
      },
      required: ['sessionId', 'reason'],
    },
  },
];
