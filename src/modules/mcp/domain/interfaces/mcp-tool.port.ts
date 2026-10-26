export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  productKey: 'ia_docencia' | 'aws_pack' | 'krake_mentor' | 'custom_software';
  content: string;
  requiredFields: string[];
}

export interface McpToolExecutionResult {
  toolName: string;
  success: boolean;
  timestamp: string;
  data: Record<string, unknown>;
  message: string;
}
