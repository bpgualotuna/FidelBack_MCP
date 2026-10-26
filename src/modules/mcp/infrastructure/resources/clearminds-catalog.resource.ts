import { McpResourceDefinition, McpToolDefinition } from '../../domain/interfaces/mcp-tool.port';

export const CLEARMINDS_MCP_RESOURCES: McpResourceDefinition[] = [
  {
    uri: 'brochure://ia-docencia',
    name: 'Diplomado práctico en IA aplicada a la docencia (Clear Minds)',
    description:
      'Brochure oficial del Diplomado de 128 horas académicas con aval universitario UHE y UDLA (37 herramientas de IA).',
    mimeType: 'text/markdown',
    productKey: 'ia_docencia',
    requiredFields: [
      'Nombre',
      'Institución Educativa',
      'Cargo / Nivel que enseña',
      'Tamaño de grupo (1, 3 o 5+)',
      'Interés en Aval Universitario',
      'Forma de pago preferida',
    ],
    content: `# DIPLOMADO PRÁCTICO EN IA APLICADA A LA DOCENCIA
- **Duración**: 128 horas académicas (4 meses / 16 semanas).
- **Modalidad**: 100% virtual (48h sincrónicas por Zoom + 80h trabajo autónomo práctico).
- **Horarios**: Lunes y miércoles de 19h00 a 20h30 (inicio 18 de mayo) O Sábados de 08h30 a 11h30 (inicio 9 de mayo).
- **Inversión Normal**: $360 USD.
- **Precio Promocional**: $249 USD (30% OFF - inscripción inicial $69 + 3 cuotas mensuales de $60).
- **Pago de Contado**: $230 USD.
- **Descuentos Grupos**: 3 personas = $209 c/u ($627 total) | 5 o más personas = $199 c/u ($995 total).
- **Aval Universitario**: Universidad Hemisferios (UHE) y UDLA, incluido sin costo adicional + 4 insignias digitales verificables en Blockchain con Credly.
- **Herramientas (37)**: ChatGPT, Claude, Gemini, Perplexity, NotebookLM, Consensus, Gamma, Canva IA, Napkin AI, Suno, ElevenLabs, HeyGen, CapCut, Kahoot IA, Quizizz IA, Mindsmith, Poe, Copilot, etc.
- **Garantía**: Devolución del 100% durante los primeros 15 días.`,
  },
  {
    uri: 'brochure://aws-pack',
    name: 'Pack 2 Certificaciones Internacionales en AWS (Cloud Practitioner + AI Practitioner)',
    description:
      'Brochure oficial del programa intensivo de 10 semanas para obtener doble certificación oficial de Amazon Web Services.',
    mimeType: 'text/markdown',
    productKey: 'aws_pack',
    requiredFields: [
      'Nombre',
      'Perfil / Rol actual',
      'Objetivo (Empleabilidad / Ascenso)',
      'Modalidad de pago ($99 inscripción o Contado $250)',
      'Tamaño de grupo (Individual, 3 o 5+)',
      'Disponibilidad de horario',
    ],
    content: `# PACK 2 CERTIFICACIONES INTERNACIONALES EN AWS
- **Certificaciones Objetivo**: AWS Certified Cloud Practitioner (CLF-C02) + AWS Certified AI Practitioner (AIF-C01).
- **Duración**: 120 horas totales (10 semanas: 70h en vivo + 50h en plataforma con simuladores).
- **Horarios**: Lunes, martes y jueves de 19h00 a 21h00 + Sábados de 09h00 a 10h00 (inicio 4 de mayo).
- **Inversión Normal**: $450 USD.
- **Precio Promocional**: $279 USD (Inscripción inicial de $99 + 2 cuotas mensuales de $90).
- **Pago de Contado**: $250 USD.
- **Descuentos Grupos**: 3 personas = $235 c/u ($705 total) | 5 o más personas = $220 c/u ($1,100 total).
- **Beneficios Incluidos**: 100% de descuento en el examen oficial AWS AI Practitioner ($100 USD ahorro) + 50% de descuento en el examen AWS Cloud Practitioner ($50 USD ahorro). Incluye simuladores reales y AWS Skill Builder.`,
  },
  {
    uri: 'brochure://krake-mentor',
    name: 'Krake Mentor — Plataforma de Capacitación y Evaluación con IA',
    description:
      'Brochure corporativo B2B de Krake Mentor: tutor disponible 24/7, evaluación conversacional oral y escrita y analítica de brechas.',
    mimeType: 'text/markdown',
    productKey: 'krake_mentor',
    requiredFields: [
      'Nombre y Cargo',
      'Empresa / Institución',
      'Cantidad de colaboradores a capacitar',
      'Proceso a optimizar (Onboarding, Ventas, Normativa)',
      'Formatos de contenido actuales',
      'Fecha tentativa de demo',
    ],
    content: `# KRAKE MENTOR — PLATAFORMA DE CAPACITACIÓN Y EVALUACIÓN CON IA
- **Enfoque**: Solución corporativa B2B de formación inteligente y verificación real del aprendizaje.
- **Diferencial**: Supera el LMS tradicional pasivo; transforma manuales PDF, videos, audios y presentaciones en rutas de aprendizaje con tutoría IA 24/7 y evaluación conversacional (escrita u oral).
- **Casos de Uso**: Onboarding de nuevos ingresos, entrenamiento comercial y objeciones, cumplimiento normativo y auditoría, soporte técnico.
- **Flujo en 4 pasos**: 1) Carga de conocimiento interno -> 2) Estructuración de ruta -> 3) Entrenamiento con Tutor IA 24/7 -> 4) Evaluación conversacional y analítica de brechas por área.
- **Acción Comercial**: Agendar Demo Ejecutiva con el equipo de Clear Minds.`,
  },
  {
    uri: 'brochure://software-medida',
    name: 'Desarrollo de Software a la Medida & Consultoría IA — Clear Minds',
    description:
      'Catálogo de ingeniería de software a medida, arquitectura cloud, agentes IA con MCP e integraciones ERP/CRM.',
    mimeType: 'text/markdown',
    productKey: 'custom_software',
    requiredFields: [
      'Nombre',
      'Empresa',
      'Dolor / Necesidad Técnica',
      'Presupuesto Estimado',
      'Plazo / Urgencia',
      'Sistemas actuales a integrar',
    ],
    content: `# DESARROLLO DE SOFTWARE A LA MEDIDA & CONSULTORÍA IA — CLEAR MINDS
- **Soluciones**: Desarrollo Web y Móvil empresarial, Arquitecturas Cloud en AWS, Agentes de IA con protocolo MCP (WhatsApp, Web, CRM), Integración de pasarelas de pago y ERPs.
- **Metodología**: Cédulas ágiles dedicadas, entrega continua y arquitectura limpia escalable.
- **Acción Comercial**: Levantar requerimiento técnico y agendar sesión de arquitectura gratuita de 30 minutos.`,
  },
];

export const CLEARMINDS_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'cotizar_descuento_grupo',
    description:
      'Calcula el precio exacto individual, total, ahorro y plan de cuotas para Diplomado IA Docencia o Pack AWS según cantidad de participantes y modalidad de pago.',
    inputSchema: {
      type: 'object',
      properties: {
        productKey: {
          type: 'string',
          enum: ['ia_docencia', 'aws_pack', 'krake_mentor', 'custom_software'],
          description: 'Clave de la línea de negocio consultada.',
        },
        participants: {
          type: 'number',
          description: 'Cantidad de participantes en el grupo (ej. 1, 3, 5).',
        },
        paymentMode: {
          type: 'string',
          enum: ['contado', 'cuotas'],
          description: 'Modalidad de pago preferida por el cliente.',
        },
      },
      required: ['productKey', 'participants'],
    },
  },
  {
    name: 'agendar_cita',
    description:
      'Agenda una reunión ejecutiva, demo de Krake Mentor, sesión de arquitectura o llamada de inscripción con Clear Minds.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'ID de la sesión de conversación.' },
        leadName: { type: 'string', description: 'Nombre completo del cliente.' },
        leadContact: { type: 'string', description: 'Teléfono WhatsApp o correo electrónico.' },
        productKey: {
          type: 'string',
          enum: ['ia_docencia', 'aws_pack', 'krake_mentor', 'custom_software'],
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
      'Guarda o actualiza en tiempo real los atributos comerciales extraídos del prospecto y su nivel de intención en el CRM de Clear Minds.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string' },
        productKey: {
          type: 'string',
          enum: ['ia_docencia', 'aws_pack', 'krake_mentor', 'custom_software'],
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
      'Cambia el estado de la conversación a HUMAN_ACTIVE (Modo Espejo / Handoff) para que un asesor humano de Clear Minds tome el control y congela las respuestas automáticas.',
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
