import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../../../../context/config/app.config';
import {
  LlmTurnInput,
  LlmTurnOutput,
  ProductLineKey,
} from '../../domain/interfaces/llm-gateway.port';

@Injectable()
export class LlmGatewayAdapter {
  private readonly logger = new Logger(LlmGatewayAdapter.name);

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables, true>,
  ) {}

  resolveApiKey(provider: 'gemini' | 'openai', overrideKey?: string): string {
    const trimmed = overrideKey?.trim();
    if (trimmed) return trimmed;

    if (provider === 'gemini') {
      const envKey = this.configService.get('GEMINI_API_KEY', { infer: true });
      if (envKey) return envKey.trim();
      throw new BadRequestException(
        'No se proporcionó GEMINI_API_KEY en la petición ni en el archivo .env del servidor.',
      );
    }

    const envKey = this.configService.get('OPENAI_API_KEY', { infer: true });
    if (envKey) return envKey.trim();
    throw new BadRequestException(
      'No se proporcionó OPENAI_API_KEY en la petición ni en el archivo .env del servidor.',
    );
  }

  async testConnection(
    provider: 'gemini' | 'openai',
    model: string,
    overrideKey?: string,
  ): Promise<{ ok: boolean; provider: string; model: string; latencyMs: number; message: string }> {
    const start = Date.now();
    const apiKey = this.resolveApiKey(provider, overrideKey);

    if (provider === 'gemini') {
      const cleanModel = (model || 'gemini-flash-lite-latest').replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Responde solo OK' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new BadRequestException(`Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      }

      return {
        ok: true,
        provider: 'gemini',
        model: cleanModel,
        latencyMs: Date.now() - start,
        message: `Conexión exitosa con Google Gemini (${cleanModel}) desde FidelBack_MCP.`,
      };
    }

    const cleanModel = model || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: cleanModel,
        messages: [{ role: 'user', content: 'Responde solo OK' }],
        max_tokens: 10,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new BadRequestException(`OpenAI HTTP ${res.status}: ${errBody.slice(0, 200)}`);
    }

    return {
      ok: true,
      provider: 'openai',
      model: cleanModel,
      latencyMs: Date.now() - start,
      message: `Conexión exitosa con OpenAI (${cleanModel}) desde FidelBack_MCP.`,
    };
  }

  async generateCommercialTurn(input: LlmTurnInput): Promise<LlmTurnOutput> {
    const start = Date.now();
    const apiKey = this.resolveApiKey(input.provider, input.apiKey);

    const jsonInstruction = `
Devuelve SIEMPRE un objeto JSON válido con la siguiente estructura exacta:
{
  "respuesta_chat": "Tu respuesta comercial en español al cliente",
  "linea_detectada": "custom_software" | "krakedev_academy" | "aws_certifications" | "ai_assistants_b2b",
  "intencion": "ALTO" | "MEDIO" | "BAJO",
  "justificacion_intencion": "Breve explicación de la intención comercial",
  "extraccion": [
    { "key": "Nombre del campo requerido", "value": "Valor extraído o 'Pendiente'", "status": "captured" | "partial" | "missing" }
  ],
  "siguiente_accion": "Siguiente paso comercial recomendado",
  "mcp_tool_calls": [
    {
      "toolName": "cotizar_descuento_grupo" | "agendar_cita" | "registrar_lead_crm" | "transferir_a_humano",
      "arguments": {}
    }
  ]
}
REGLAS MCP Y DE COMPORTAMIENTO:
- Usa máximo 2 emojis por mensaje (ej. 👋, 🚀, 💻, 💡) y lenguaje técnico ligero y natural.
- Nunca te presentes como un bot o IA a menos que el cliente lo pregunte directamente.
- Si el cliente pregunta precios de Academia Krakedev o Cursos/Certificaciones AWS, incluye "cotizar_descuento_grupo" en "mcp_tool_calls".
- Para Software a la Medida está PROHIBIDO dar precios cerrados; indaga en su necesidad para reunión con especialista.
- REGLA DE ORO DE TRASPASO A HUMANO: Si el cliente pide hablar explícitamente con un asesor humano, muestra molestia/fricción o manifiesta explícitamente intención de agendar una cita o reunión, incluye obligatoriamente "transferir_a_humano" en "mcp_tool_calls" y pon en "respuesta_chat": "¡Perfecto! Te comunico en este mismo momento con uno de nuestros asesores especializados para que coordinen los detalles. Dame un segundo por favor 🤝".
- Si el cliente cambia de producto en la conversación, actualiza "linea_detectada" al nuevo producto y llena "extraccion" con los campos de ese nuevo producto.
`;

    const fullSystemPrompt = `${input.systemPrompt}\n\nMEMORIA INCREMENTAL PREVIA:\n${input.incrementalSummary || 'Sin resumen previo.'}\n\nLÍNEA ACTIVA ACTUAL: ${input.activeProductKey}\nCAMPOS DE EXTRACCIÓN DE LÍNEA ACTIVA: ${input.requiredFields.join(', ')}\n${jsonInstruction}`;

    if (input.provider === 'gemini') {
      const cleanModel = (input.model || 'gemini-flash-lite-latest').replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const contents = [
        ...input.recentHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        {
          role: 'user',
          parts: [{ text: input.userMessage }],
        },
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: fullSystemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Error Gemini: ${errText}`);
        throw new BadRequestException(`Error en Gemini (${res.status}): ${errText.slice(0, 250)}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = this.safeParseJson(rawText, input.activeProductKey, input.requiredFields);

      return {
        ...parsed,
        inputTokens: data.usageMetadata?.promptTokenCount ?? 420,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 180,
        latencyMs: Date.now() - start,
      };
    }

    // OpenAI execution
    const cleanModel = input.model || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: cleanModel,
        response_format: { type: 'json_object' },
        temperature: 0.35,
        messages: [
          { role: 'system', content: fullSystemPrompt },
          ...input.recentHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          { role: 'user', content: input.userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      this.logger.error(`Error OpenAI: ${errText}`);
      throw new BadRequestException(`Error en OpenAI (${res.status}): ${errText.slice(0, 250)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const rawText = data.choices?.[0]?.message?.content || '{}';
    const parsed = this.safeParseJson(rawText, input.activeProductKey, input.requiredFields);

    return {
      ...parsed,
      inputTokens: data.usage?.prompt_tokens ?? 450,
      outputTokens: data.usage?.completion_tokens ?? 190,
      latencyMs: Date.now() - start,
    };
  }

  async generateSummary(
    provider: 'gemini' | 'openai',
    model: string,
    apiKey: string | undefined,
    previousSummary: string,
    messagesToSummarize: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const resolvedKey = this.resolveApiKey(provider, apiKey);
    const prompt = `Actualiza el siguiente resumen ejecutivo comercial en máximo 4 viñetas concisas conservando nombre del cliente, empresa/institución, línea de interés, presupuesto/grupo y objeciones.\n\nRESUMEN ANTERIOR:\n${previousSummary || 'Ninguno'}\n\nNUEVOS MENSAJES:\n${messagesToSummarize.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}`;

    try {
      if (provider === 'gemini') {
        const cleanModel = (model || 'gemini-flash-lite-latest').replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || previousSummary;
        }
      }
    } catch (err) {
      this.logger.warn(`No se pudo comprimir resumen incremental: ${(err as Error).message}`);
    }
    return previousSummary;
  }

  private safeParseJson(
    rawText: string,
    fallbackProduct: ProductLineKey,
    requiredFields: string[],
  ): Omit<LlmTurnOutput, 'inputTokens' | 'outputTokens' | 'latencyMs'> {
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      const validProducts: ProductLineKey[] = [
        'custom_software',
        'krakedev_academy',
        'aws_certifications',
        'ai_assistants_b2b',
      ];
      const detected = validProducts.includes(parsed.linea_detectada as ProductLineKey)
        ? (parsed.linea_detectada as ProductLineKey)
        : fallbackProduct;

      const rawExtraction = Array.isArray(parsed.extraccion) ? parsed.extraccion : [];
      const extractedFields =
        rawExtraction.length > 0
          ? rawExtraction.map((item: Record<string, unknown>) => ({
              key: String(item.key || 'Dato'),
              value: String(item.value || 'Pendiente'),
              status: (['captured', 'partial', 'missing'].includes(String(item.status))
                ? String(item.status)
                : 'missing') as 'captured' | 'partial' | 'missing',
            }))
          : requiredFields.map((key) => ({
              key,
              value: 'Pendiente',
              status: 'missing' as const,
            }));

      const rawTools = Array.isArray(parsed.mcp_tool_calls) ? parsed.mcp_tool_calls : [];

      return {
        replyText: String(
          parsed.respuesta_chat ||
            'Hola, soy Fidel de Clear Minds. ¿En qué programa o solución tecnológica te puedo asesorar hoy?',
        ),
        detectedProductKey: detected,
        intentLevel: (['ALTO', 'MEDIO', 'BAJO'].includes(String(parsed.intencion))
          ? String(parsed.intencion)
          : 'MEDIO') as 'ALTO' | 'MEDIO' | 'BAJO',
        intentJustification: String(
          parsed.justificacion_intencion || 'Evaluación comercial en curso.',
        ),
        extractedFields,
        nextAction: String(
          parsed.siguiente_accion || 'Continuar calificación consultiva del prospecto.',
        ),
        mcpToolCalls: rawTools
          .filter((t: Record<string, unknown>) => typeof t?.toolName === 'string')
          .map((t: Record<string, unknown>) => ({
            toolName: t.toolName as
              | 'cotizar_descuento_grupo'
              | 'agendar_cita'
              | 'registrar_lead_crm'
              | 'transferir_a_humano',
            arguments: (t.arguments as Record<string, unknown>) ?? {},
          })),
      };
    } catch {
      return {
        replyText: rawText || 'Recibido. ¿Me comentas más detalles para asesorarte mejor?',
        detectedProductKey: fallbackProduct,
        intentLevel: 'MEDIO',
        intentJustification: 'Respuesta en texto libre.',
        extractedFields: requiredFields.map((key) => ({
          key,
          value: 'Pendiente',
          status: 'missing' as const,
        })),
        nextAction: 'Indagar requerimiento principal.',
        mcpToolCalls: [],
      };
    }
  }

  async generateTrainingTurn(input: {
    provider: 'gemini' | 'openai';
    model: string;
    apiKey?: string;
    systemPrompt: string;
    recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
    userMessage: string;
  }): Promise<{
    reply: string;
    mode: 'SETUP' | 'ROLEPLAY' | 'CORRECTION';
    learnedRule: { instruction: string; category: string } | null;
  }> {
    const resolvedKey = this.resolveApiKey(input.provider, input.apiKey);

    const trainingInstructions = `
# MODO ENTRENAMIENTO INTERACTIVO — FIDEL (COACH COMERCIAL)
Estás operando en **MODO ENTRENAMIENTO ACTIVO** conversando con un Entrenador (jefe de ventas o asesor) que practica contigo mediante roleplay y te da correcciones para mejorar.

Clasifica el ÚLTIMO MENSAJE del Entrenador en uno de 3 escenarios:
1. "SETUP": El usuario te avisa que va a empezar a entrenarte o pregunta si estás listo.
   - mode: "SETUP", learnedRule: null, reply: Confirma brevemente que estás en Modo Entrenamiento y listo para practicar.
2. "CORRECTION": El usuario sale del papel de cliente o usa frases como "Entrenador:", "Mejor di...", "Corrige...", "Menos emojis", "Ten en cuenta...", "Guarda en memoria..." para corregir tu respuesta, tono o enseñarte un dato nuevo.
   - mode: "CORRECTION"
   - learnedRule: { "instruction": "Directriz clara en imperativo para futuros clientes", "category": "ESTILO" | "COMERCIAL" | "OBJECIONES" | "GENERAL" }
   - reply: En dos partes breves separadas por un salto de línea:
     1) "✅ Anotado en memoria: [resumen breve]."
     2) "Respuesta corregida: \"[nueva respuesta mejorada aplicando la regla]\""
3. "ROLEPLAY": El usuario escribe actuando como un cliente real.
   - mode: "ROLEPLAY", learnedRule: null, reply: Responde 100% en tu papel de Fidel aplicando tu conocimiento base y TODAS las reglas aprendidas previamente.

Devuelve ÚNICAMENTE un JSON válido:
{
  "mode": "SETUP" | "ROLEPLAY" | "CORRECTION",
  "learnedRule": { "instruction": "string", "category": "ESTILO" | "COMERCIAL" | "OBJECIONES" | "GENERAL" } | null,
  "reply": "string con la respuesta exacta para el chat"
}`;

    const fullSystem = `${input.systemPrompt}\n\n${trainingInstructions}`;

    if (input.provider === 'gemini') {
      const cleanModel = (input.model || 'gemini-flash-lite-latest').replace(/^models\//, '');
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${encodeURIComponent(resolvedKey)}`;
      const contents = [
        ...input.recentHistory.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        { role: 'user', parts: [{ text: input.userMessage }] },
      ];

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: fullSystem }] },
          contents,
          generationConfig: { temperature: 0.35, responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new BadRequestException(`Error en Gemini Training (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return this.parseTrainingJson(raw);
    }

    const cleanModel = input.model || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resolvedKey}`,
      },
      body: JSON.stringify({
        model: cleanModel,
        response_format: { type: 'json_object' },
        temperature: 0.35,
        messages: [
          { role: 'system', content: fullSystem },
          ...input.recentHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: input.userMessage },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(`Error en OpenAI Training (${res.status}): ${errText.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content || '{}';
    return this.parseTrainingJson(raw);
  }

  private parseTrainingJson(rawText: string): {
    reply: string;
    mode: 'SETUP' | 'ROLEPLAY' | 'CORRECTION';
    learnedRule: { instruction: string; category: string } | null;
  } {
    try {
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;
      const mode = (['SETUP', 'ROLEPLAY', 'CORRECTION'].includes(String(parsed.mode))
        ? String(parsed.mode)
        : 'ROLEPLAY') as 'SETUP' | 'ROLEPLAY' | 'CORRECTION';

      let learnedRule: { instruction: string; category: string } | null = null;
      if (
        mode === 'CORRECTION' &&
        parsed.learnedRule &&
        typeof parsed.learnedRule === 'object' &&
        (parsed.learnedRule as Record<string, unknown>).instruction
      ) {
        const lr = parsed.learnedRule as Record<string, unknown>;
        learnedRule = {
          instruction: String(lr.instruction),
          category: String(lr.category || 'GENERAL').toUpperCase(),
        };
      }

      return {
        reply: String(parsed.reply || 'Modo Entrenamiento activo. Continúa por favor.'),
        mode,
        learnedRule,
      };
    } catch {
      return {
        reply: rawText || 'Modo Entrenamiento activo. ¿Cómo deseas continuar?',
        mode: 'ROLEPLAY',
        learnedRule: null,
      };
    }
  }
}
