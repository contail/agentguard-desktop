export type Tab = "monitoring" | "settings" | "approvals" | "mcp";

export interface DaemonStatus {
  state: string;
  version: string;
  pid: number;
  uptime: string;
  error?: string;
}

export interface ProxyStats {
  totalRequests: number;
  blockedRequests: number;
  allowedRequests: number;
  blockRate: string;
  stage1Blocked: number;
  stage2Blocked: number;
  gateErrors: number;
  uptime: string;
  evaluatorEnabled: boolean;
  version: string;
  llmGateway: {
    total: number;
    flagged: number;
    blocked: number;
    piiSanitized: number;
    confirmed: number;
  };
}

export interface AgConfig {
  proxyPort: string;
  llmPort: string;
  maxBodySize: number;
  gateEnabled: boolean;
  gateURL: string;
  gateMode: string;
  gateTimeoutMs: number;
  gateFailOpen: boolean;
  llmMode: string;
  piiEnabled: boolean;
  approvalTimeoutMs: number;
}

export interface Approval {
  id: string;
  tool_name: string;
  arguments: string;
  matched_rule: string;
  provider: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface Toast {
  message: string;
  type: "success" | "error";
}

export interface MCPPolicyData {
  exists: boolean;
  path: string;
  policy?: {
    version: string;
    default: Record<string, any>;
    agents?: Record<string, Record<string, any>>;
  };
}

export interface MCPAuditEntry {
  ts: string;
  agent?: string;
  dir: string;
  method: string;
  tool?: string;
  decision: string;
  rule?: string;
  pii?: number;
}

export interface MCPClient {
  name: string;
  label: string;
  configPath: string;
  installed: boolean;
  wrapped: boolean;
  servers: number;
  wrappedCount?: number;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "danger" | "primary";
  onConfirm: () => void;
}
