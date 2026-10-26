export type ProductLineKey =
  | 'ia_docencia'
  | 'aws_pack'
  | 'krake_mentor'
  | 'custom_software';

export interface StructuredExtractionItem {
  key: string;
  value: string;
  status: 'captured' | 'partial' | 'missing';
}

export interface RequestedMcpToolCall {
  toolName:
    | 'cotizar_descuento_grupo'
    | 'agendar_cita'
    | 'registrar_lead_crm'
    | 'transferir_a_humano';
  arguments: Record<string, unknown>;
}

export interface LlmTurnInput {
  provider: 'gemini' | 'openai';
  model: string;
  apiKey?: string;
  systemPrompt: string;
  activeProductKey: ProductLineKey;
  requiredFields: string[];
  incrementalSummary: string;
  recentHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  userMessage: string;
}

export interface LlmTurnOutput {
  replyText: string;
  detectedProductKey: ProductLineKey;
  intentLevel: 'ALTO' | 'MEDIO' | 'BAJO';
  intentJustification: string;
  extractedFields: StructuredExtractionItem[];
  nextAction: string;
  mcpToolCalls: RequestedMcpToolCall[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}
