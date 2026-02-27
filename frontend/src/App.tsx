import { useState, useEffect, useCallback } from "react";
import { BrowserOpenURL } from "../wailsjs/runtime/runtime";
import "./style.css";

declare global {
  interface Window {
    go: {
      main: {
        App: {
          StartDaemon(): Promise<string>;
          StopDaemon(): Promise<string>;
          RestartDaemon(): Promise<string>;
          GetDaemonStatus(): Promise<string>;
          GetProxyStats(): Promise<string>;
          GetAgentGuardConfig(): Promise<string>;
          SaveAgentGuardConfig(config: string): Promise<string>;
          GetOpenClawConfig(): Promise<string>;
          SaveOpenClawConfig(config: string): Promise<string>;
          GetApprovals(): Promise<string>;
          HandleApproval(id: string, action: string): Promise<string>;
          CheckForUpdate(): Promise<string>;
          UpdateDaemon(): Promise<string>;
          GetMCPPolicy(): Promise<string>;
          SaveMCPPolicy(policy: string): Promise<string>;
          GetMCPAudit(): Promise<string>;
          GetMCPClients(): Promise<string>;
          WrapMCPClient(client: string): Promise<string>;
          UnwrapMCPClient(client: string): Promise<string>;
        };
      };
    };
  }
}

type Tab = "monitoring" | "settings" | "approvals" | "mcp";

interface DaemonStatus {
  state: string;
  version: string;
  pid: number;
  uptime: string;
  error?: string;
}

interface ProxyStats {
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

interface AgConfig {
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

interface Approval {
  id: string;
  tool_name: string;
  arguments: string;
  matched_rule: string;
  provider: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface Toast {
  message: string;
  type: "success" | "error";
}

interface MCPPolicyData {
  exists: boolean;
  path: string;
  policy?: {
    version: string;
    default: Record<string, any>;
    agents?: Record<string, Record<string, any>>;
  };
}

interface MCPAuditEntry {
  ts: string;
  agent?: string;
  dir: string;
  method: string;
  tool?: string;
  decision: string;
  rule?: string;
  pii?: number;
}

interface MCPClient {
  name: string;
  label: string;
  configPath: string;
  installed: boolean;
  wrapped: boolean;
  servers: number;
  wrappedCount?: number;
}

function App() {
  const [tab, setTab] = useState<Tab>("monitoring");
  const [daemon, setDaemon] = useState<DaemonStatus>({
    state: "stopped",
    version: "",
    pid: 0,
    uptime: "",
  });
  const [stats, setStats] = useState<ProxyStats | null>(null);
  const [config, setConfig] = useState<AgConfig | null>(null);
  const [ocBaseUrl, setOcBaseUrl] = useState("");
  const [ocFullConfig, setOcFullConfig] = useState<any>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [mcpPolicy, setMcpPolicy] = useState<MCPPolicyData | null>(null);
  const [mcpPolicyText, setMcpPolicyText] = useState("");
  const [mcpAudit, setMcpAudit] = useState<MCPAuditEntry[]>([]);
  const [mcpClients, setMcpClients] = useState<MCPClient[]>([]);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updating, setUpdating] = useState(false);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const safeCall = useCallback(async (fn: () => Promise<string>) => {
    try {
      const raw = await fn();
      return JSON.parse(raw);
    } catch {
      return { error: "Connection failed" };
    }
  }, []);

  const loadDaemonStatus = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetDaemonStatus());
    if (!d.error) setDaemon(d);
  }, [safeCall]);

  const loadStats = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetProxyStats());
    if (!d.error) {
      setStats(d);
      setLastUpdate(Date.now());
    }
  }, [safeCall]);

  const loadConfig = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetAgentGuardConfig());
    if (!d.error) setConfig(d);
  }, [safeCall]);

  const loadOcConfig = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetOpenClawConfig());
    if (!d.error) {
      setOcFullConfig(d);
      try {
        setOcBaseUrl(d.models.providers.anthropic.baseUrl || "");
      } catch {
        setOcBaseUrl("");
      }
    }
  }, [safeCall]);

  const loadApprovals = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetApprovals());
    if (Array.isArray(d)) setApprovals(d);
  }, [safeCall]);

  const loadMCPPolicy = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetMCPPolicy());
    if (!d.error) {
      setMcpPolicy(d);
      if (d.exists && d.policy) {
        setMcpPolicyText(JSON.stringify(d.policy, null, 2));
      } else {
        setMcpPolicyText("");
      }
    }
  }, [safeCall]);

  const loadMCPAudit = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetMCPAudit());
    if (Array.isArray(d)) setMcpAudit(d.reverse());
  }, [safeCall]);

  const loadMCPClients = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetMCPClients());
    if (Array.isArray(d)) setMcpClients(d);
  }, [safeCall]);

  const refreshAll = useCallback(() => {
    loadDaemonStatus();
    loadStats();
    loadConfig();
    loadOcConfig();
    loadApprovals();
    loadMCPPolicy();
    loadMCPAudit();
    loadMCPClients();
  }, [
    loadDaemonStatus,
    loadStats,
    loadConfig,
    loadOcConfig,
    loadApprovals,
    loadMCPPolicy,
    loadMCPAudit,
    loadMCPClients,
  ]);

  useEffect(() => {
    refreshAll();
    const statsInterval = setInterval(loadStats, 5000);
    const daemonInterval = setInterval(loadDaemonStatus, 3000);
    return () => {
      clearInterval(statsInterval);
      clearInterval(daemonInterval);
    };
  }, [refreshAll, loadStats, loadDaemonStatus]);

  const handleStartDaemon = async () => {
    const r = await safeCall(() => window.go.main.App.StartDaemon());
    if (r.error) showToast(r.error, "error");
    else showToast("Daemon started", "success");
    loadDaemonStatus();
  };

  const handleStopDaemon = async () => {
    const r = await safeCall(() => window.go.main.App.StopDaemon());
    if (r.error) showToast(r.error, "error");
    else showToast("Daemon stopped", "success");
    loadDaemonStatus();
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    const body = {
      gateEnabled: config.gateEnabled,
      gateMode: config.gateMode,
      gateFailOpen: config.gateFailOpen,
      llmMode: config.llmMode,
      piiEnabled: config.piiEnabled,
    };
    const r = await safeCall(() => window.go.main.App.SaveAgentGuardConfig(JSON.stringify(body)));
    if (r.error) showToast(r.error, "error");
    else showToast("Settings saved", "success");
  };

  const handleSaveOcConfig = async () => {
    const cfg = ocFullConfig || { models: { providers: { anthropic: {} } } };
    try {
      cfg.models.providers.anthropic.baseUrl = ocBaseUrl;
    } catch {
      /* structure mismatch */
    }
    const r = await safeCall(() => window.go.main.App.SaveOpenClawConfig(JSON.stringify(cfg)));
    if (r.error) showToast(r.error, "error");
    else showToast("OpenClaw settings saved", "success");
  };

  const handleApproval = async (id: string, action: string) => {
    const r = await safeCall(() => window.go.main.App.HandleApproval(id, action));
    if (r.error) showToast(r.error, "error");
    else showToast(`Approval ${action}d`, "success");
    loadApprovals();
  };

  const handleCheckUpdate = async () => {
    setUpdateChecking(true);
    const r = await safeCall(() => window.go.main.App.CheckForUpdate());
    setUpdateInfo(r);
    setUpdateChecking(false);
  };

  const handleUpdateCore = async () => {
    setUpdating(true);
    const r = await safeCall(() => window.go.main.App.UpdateDaemon());
    if (r.error) showToast(r.error, "error");
    else showToast(`Updated to ${r.version}`, "success");
    setUpdating(false);
    handleCheckUpdate();
    loadDaemonStatus();
  };

  const handleSaveMCPPolicy = async () => {
    try {
      JSON.parse(mcpPolicyText);
    } catch {
      showToast("Invalid JSON", "error");
      return;
    }
    const r = await safeCall(() => window.go.main.App.SaveMCPPolicy(mcpPolicyText));
    if (r.error) showToast(r.error, "error");
    else showToast("Policy saved", "success");
    loadMCPPolicy();
  };

  const handleWrapClient = async (client: string) => {
    const r = await safeCall(() => window.go.main.App.WrapMCPClient(client));
    if (r.error) showToast(r.error, "error");
    else showToast(`${client} wrapped`, "success");
    loadMCPClients();
  };

  const handleUnwrapClient = async (client: string) => {
    const r = await safeCall(() => window.go.main.App.UnwrapMCPClient(client));
    if (r.error) showToast(r.error, "error");
    else showToast(`${client} unwrapped`, "success");
    loadMCPClients();
  };

  const timeSince = lastUpdate ? `${Math.floor((Date.now() - lastUpdate) / 1000)}s ago` : "";
  const blockRateNum = stats ? parseFloat(String(stats.blockRate).replace("%", "")) : 0;

  return (
    <>
      {/* Title bar */}
      <div className="titlebar">
        <h1>AgentGuard</h1>
        <div className={`status-indicator ${daemon.state === "running" ? "online" : ""}`} />
        {daemon.version && <span className="version-badge">v{daemon.version}</span>}
      </div>

      <div className="app-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Dashboard</div>
            <button
              className={`sidebar-item ${tab === "monitoring" ? "active" : ""}`}
              onClick={() => setTab("monitoring")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h4l3-9 4 18 3-9h4" />
              </svg>
              <span>Monitoring</span>
            </button>
            <button
              className={`sidebar-item ${tab === "settings" ? "active" : ""}`}
              onClick={() => setTab("settings")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span>Settings</span>
            </button>
            <button
              className={`sidebar-item ${tab === "approvals" ? "active" : ""}`}
              onClick={() => setTab("approvals")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
              <span>Approvals</span>
            </button>
            <button
              className={`sidebar-item ${tab === "mcp" ? "active" : ""}`}
              onClick={() => setTab("mcp")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span>MCP</span>
            </button>
          </div>

          <div className="sidebar-spacer" />

          <div className="sidebar-footer">
            <div className="daemon-control">
              <div className={`daemon-dot ${daemon.state}`} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{daemon.state}</span>
            </div>
            {daemon.state === "running" || daemon.state === "starting" ? (
              <button
                className="btn btn-danger"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleStopDaemon}
              >
                Stop
              </button>
            ) : (
              <button
                className="btn btn-success"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleStartDaemon}
              >
                Start
              </button>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          {tab === "monitoring" && (
            <>
              <div className="page-header">
                <h2>Monitoring</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="page-header updated-text">
                    {timeSince && `Updated ${timeSince}`}
                  </span>
                  <button className="btn" onClick={refreshAll}>
                    Refresh
                  </button>
                </div>
              </div>

              {/* Proxy Stats */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Proxy Stats</span>
                </div>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{stats?.totalRequests ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Blocked</div>
                    <div className="stat-value danger">{stats?.blockedRequests ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Allowed</div>
                    <div className="stat-value success">{stats?.allowedRequests ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Stage 1</div>
                    <div className="stat-value">{stats?.stage1Blocked ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Stage 2</div>
                    <div className="stat-value">{stats?.stage2Blocked ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Gate Errors</div>
                    <div className="stat-value warning">{stats?.gateErrors ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Uptime</div>
                    <div className="stat-value">{stats?.uptime ?? "-"}</div>
                  </div>
                  <div className="progress-container">
                    <span className="stat-label" style={{ marginBottom: 0 }}>
                      Block Rate
                    </span>
                    <div className="progress-track">
                      <div className="progress-fill" style={{ width: `${blockRateNum}%` }} />
                    </div>
                    <span
                      style={{ fontSize: 14, fontWeight: 700, minWidth: 45, textAlign: "right" }}
                    >
                      {stats?.blockRate ?? "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* LLM Gateway */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">LLM Gateway</span>
                </div>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{stats?.llmGateway?.total ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Flagged</div>
                    <div className="stat-value danger">{stats?.llmGateway?.flagged ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Blocked</div>
                    <div className="stat-value danger">{stats?.llmGateway?.blocked ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">PII Sanitized</div>
                    <div className="stat-value">{stats?.llmGateway?.piiSanitized ?? "-"}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Confirmed</div>
                    <div className="stat-value success">{stats?.llmGateway?.confirmed ?? "-"}</div>
                  </div>
                </div>
              </div>

              {/* System */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">System</span>
                </div>
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-label">Evaluator</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>
                      {stats?.evaluatorEnabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Version</div>
                    <div className="stat-value" style={{ fontSize: 16 }}>
                      {stats?.version ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "settings" && config && (
            <>
              <div className="page-header">
                <h2>Settings</h2>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">AgentGuard Configuration</span>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <span className="form-label">Proxy Port</span>
                    <input className="form-input" value={config.proxyPort} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">LLM Port</span>
                    <input className="form-input" value={config.llmPort} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Max Body Size</span>
                    <input className="form-input" value={config.maxBodySize} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Gate URL</span>
                    <input className="form-input" value={config.gateURL} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Gate Timeout (ms)</span>
                    <input className="form-input" value={config.gateTimeoutMs} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Approval Timeout (ms)</span>
                    <input className="form-input" value={config.approvalTimeoutMs} readOnly />
                  </div>
                  <div className="form-field">
                    <span className="form-label">Gate Mode</span>
                    <select
                      className="form-select"
                      value={config.gateMode}
                      onChange={(e) => setConfig({ ...config, gateMode: e.target.value })}
                    >
                      <option value="enforce">enforce</option>
                      <option value="monitor">monitor</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <span className="form-label">LLM Mode</span>
                    <select
                      className="form-select"
                      value={config.llmMode}
                      onChange={(e) => setConfig({ ...config, llmMode: e.target.value })}
                    >
                      <option value="monitor">monitor</option>
                      <option value="enforce">enforce</option>
                      <option value="confirm">confirm</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <span className="form-label">Gate Enabled</span>
                    <div className="toggle-row">
                      <span className="toggle-label-text">{config.gateEnabled ? "On" : "Off"}</span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={config.gateEnabled}
                          onChange={(e) => setConfig({ ...config, gateEnabled: e.target.checked })}
                        />
                        <div className="toggle-track" />
                      </label>
                    </div>
                  </div>
                  <div className="form-field">
                    <span className="form-label">Gate Fail Open</span>
                    <div className="toggle-row">
                      <span className="toggle-label-text">
                        {config.gateFailOpen ? "On" : "Off"}
                      </span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={config.gateFailOpen}
                          onChange={(e) => setConfig({ ...config, gateFailOpen: e.target.checked })}
                        />
                        <div className="toggle-track" />
                      </label>
                    </div>
                  </div>
                  <div className="form-field">
                    <span className="form-label">PII Sanitization</span>
                    <div className="toggle-row">
                      <span className="toggle-label-text">{config.piiEnabled ? "On" : "Off"}</span>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={config.piiEnabled}
                          onChange={(e) => setConfig({ ...config, piiEnabled: e.target.checked })}
                        />
                        <div className="toggle-track" />
                      </label>
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSaveConfig}>
                  Save Settings
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">OpenClaw Settings</span>
                </div>
                <div className="form-field" style={{ marginBottom: 16 }}>
                  <span className="form-label">Base URL</span>
                  <input
                    className="form-input"
                    value={ocBaseUrl}
                    onChange={(e) => setOcBaseUrl(e.target.value)}
                    placeholder="https://api.anthropic.com"
                  />
                </div>
                <button className="btn btn-primary" onClick={handleSaveOcConfig}>
                  Save OpenClaw Settings
                </button>
              </div>

              {/* Updates */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Updates</span>
                  <button className="btn" onClick={handleCheckUpdate} disabled={updateChecking}>
                    {updateChecking ? "Checking..." : "Check for Updates"}
                  </button>
                </div>

                {!updateInfo ? (
                  <div className="empty-state">
                    Click "Check for Updates" to scan for new versions
                  </div>
                ) : updateInfo.error ? (
                  <div className="empty-state" style={{ color: "var(--danger)" }}>
                    {updateInfo.error}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Core binary */}
                    <div className="approval-card">
                      <span
                        className={`badge ${updateInfo.coreUpdateAvailable ? "badge-pending" : "badge-approved"}`}
                      >
                        {updateInfo.coreUpdateAvailable ? "update available" : "up to date"}
                      </span>
                      <div className="approval-info">
                        <div className="approval-tool">AgentGuard Core</div>
                        <div className="approval-meta">
                          Installed: v{updateInfo.coreLocal || "?"} &middot; Latest:{" "}
                          {updateInfo.coreRemote || "?"}
                          {updateInfo.coreError && ` (error: ${updateInfo.coreError})`}
                        </div>
                      </div>
                      {updateInfo.coreUpdateAvailable && (
                        <div className="approval-actions">
                          <button
                            className="btn btn-primary"
                            onClick={handleUpdateCore}
                            disabled={updating}
                          >
                            {updating ? "Updating..." : "Update Now"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Desktop app */}
                    <div className="approval-card">
                      <span
                        className={`badge ${updateInfo.desktopUpdateAvailable ? "badge-pending" : "badge-approved"}`}
                      >
                        {updateInfo.desktopUpdateAvailable ? "update available" : "up to date"}
                      </span>
                      <div className="approval-info">
                        <div className="approval-tool">AgentGuard Desktop</div>
                        <div className="approval-meta">
                          Installed: v{updateInfo.appVersion || "?"} &middot; Latest:{" "}
                          {updateInfo.desktopRemote || "?"}
                          {updateInfo.desktopError && ` (error: ${updateInfo.desktopError})`}
                        </div>
                      </div>
                      {updateInfo.desktopUpdateAvailable && updateInfo.desktopDownloadURL && (
                        <div className="approval-actions">
                          <button
                            className="btn btn-primary"
                            onClick={() => BrowserOpenURL(updateInfo.desktopDownloadURL)}
                          >
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "approvals" && (
            <>
              <div className="page-header">
                <h2>Approvals</h2>
                <button className="btn" onClick={loadApprovals}>
                  Refresh
                </button>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Pending Approvals</span>
                </div>
                {approvals.length === 0 ? (
                  <div className="empty-state">No pending approvals</div>
                ) : (
                  approvals.map((a) => (
                    <div key={a.id} className="approval-card">
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                      <div className="approval-info">
                        <div className="approval-tool">{a.tool_name}</div>
                        <div className="approval-meta">
                          {a.matched_rule} &middot; {a.provider} &middot; {a.created_at}
                        </div>
                      </div>
                      {a.status === "pending" && (
                        <div className="approval-actions">
                          <button
                            className="btn btn-success"
                            onClick={() => handleApproval(a.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => handleApproval(a.id, "deny")}
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {tab === "mcp" && (
            <>
              <div className="page-header">
                <h2>MCP Security Gateway</h2>
                <button
                  className="btn"
                  onClick={() => {
                    loadMCPPolicy();
                    loadMCPAudit();
                    loadMCPClients();
                  }}
                >
                  Refresh
                </button>
              </div>

              {/* MCP Clients */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">MCP Clients</span>
                </div>
                {mcpClients.length === 0 ? (
                  <div className="empty-state">No MCP clients discovered</div>
                ) : (
                  mcpClients.map((c) => (
                    <div key={c.name} className="approval-card">
                      <span
                        className={`badge ${c.installed ? (c.wrapped ? "badge-approved" : "badge-pending") : "badge-denied"}`}
                      >
                        {!c.installed ? "not found" : c.wrapped ? "protected" : "unprotected"}
                      </span>
                      <div className="approval-info">
                        <div className="approval-tool">{c.label}</div>
                        <div className="approval-meta">
                          {c.servers} server{c.servers !== 1 ? "s" : ""}
                          {c.wrappedCount ? ` (${c.wrappedCount} wrapped)` : ""} &middot;{" "}
                          {c.configPath}
                        </div>
                      </div>
                      {c.installed && c.servers > 0 && (
                        <div className="approval-actions">
                          {c.wrapped ? (
                            <button
                              className="btn btn-danger"
                              onClick={() => handleUnwrapClient(c.name)}
                            >
                              Unwrap
                            </button>
                          ) : (
                            <button
                              className="btn btn-success"
                              onClick={() => handleWrapClient(c.name)}
                            >
                              Protect
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* MCP Policy Editor */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Policy Editor</span>
                  {mcpPolicy && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {mcpPolicy.exists
                        ? mcpPolicy.path
                        : "No policy file — will be created on save"}
                    </span>
                  )}
                </div>
                <textarea
                  className="form-input"
                  style={{
                    width: "100%",
                    minHeight: 220,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                    resize: "vertical",
                    marginBottom: 12,
                  }}
                  value={mcpPolicyText}
                  onChange={(e) => setMcpPolicyText(e.target.value)}
                  placeholder={`{\n  "version": "1",\n  "default": {\n    "denied_tools": ["bash", "write_*"],\n    "denied_paths": ["/etc/*", "~/.ssh/*"],\n    "mode": "enforce"\n  }\n}`}
                  spellCheck={false}
                />
                <button className="btn btn-primary" onClick={handleSaveMCPPolicy}>
                  Save Policy
                </button>
              </div>

              {/* MCP Audit Log */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Audit Log</span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Last {mcpAudit.length} entries
                  </span>
                </div>
                {mcpAudit.length === 0 ? (
                  <div className="empty-state">No audit entries yet</div>
                ) : (
                  <div style={{ maxHeight: 400, overflowY: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border)" }}>
                          <th
                            style={{
                              padding: "8px 6px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            Time
                          </th>
                          <th
                            style={{
                              padding: "8px 6px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            Tool
                          </th>
                          <th
                            style={{
                              padding: "8px 6px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            Decision
                          </th>
                          <th
                            style={{
                              padding: "8px 6px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            Rule
                          </th>
                          <th
                            style={{
                              padding: "8px 6px",
                              textAlign: "left",
                              color: "var(--text-muted)",
                              fontWeight: 500,
                            }}
                          >
                            Agent
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mcpAudit.map((e, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td
                              style={{
                                padding: "6px",
                                color: "var(--text-muted)",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {e.ts ? new Date(e.ts).toLocaleTimeString() : "-"}
                            </td>
                            <td style={{ padding: "6px", fontWeight: 500 }}>
                              {e.tool || e.method}
                            </td>
                            <td style={{ padding: "6px" }}>
                              <span
                                className={`badge ${e.decision === "pass" ? "badge-approved" : e.decision === "block" ? "badge-denied" : "badge-pending"}`}
                              >
                                {e.decision}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "6px",
                                color: "var(--text-secondary)",
                                fontSize: 11,
                              }}
                            >
                              {e.rule || "-"}
                            </td>
                            <td
                              style={{ padding: "6px", color: "var(--text-muted)", fontSize: 11 }}
                            >
                              {e.agent || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}

export default App;
