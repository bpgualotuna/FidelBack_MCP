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
  "linea_detectada": "ia_docencia" | "aws_pack" | "krake_mentor" | "custom_software",
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
REGLAS MCP:
- Si el cliente pregunta precios para 1, 3, 5 o más personas o planes de pago en Diplomado IA o Pack AWS, incluye en "mcp_tool_calls" la herramienta "cotizar_descuento_grupo" con { "productKey": "...", "participants": N, "paymentMode": "cuotas" | "contado" }.
- Si el cliente pide agendar reunión/demo o da fecha/hora, incluye "agendar_cita".
- Si el cliente pide hablar con un asesor humano, incluye "transferir_a_humano".
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
        'ia_docencia',
        'aws_pack',
        'krake_mentor',
        'custom_software',
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
}
