export interface TenantProfileEntity {
  id: string;
  slug: string;
  name: string;
  agentName: string;
  agentRole: string;
  tone: string;
  globalRules: string;
  summaryInterval: number;
}
