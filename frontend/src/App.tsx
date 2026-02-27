import { useState, useEffect, useCallback } from "react";
import "./style.css";
import type { Tab, DaemonStatus, ProxyStats, AgConfig, Approval, Toast as ToastType, MCPPolicyData, MCPAuditEntry, MCPClient, ConfirmDialogState } from "./types";
import { useTimeSince } from "./hooks/useTimeSince";
import { Toast } from "./components/shared/Toast";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { MonitoringTab } from "./components/tabs/MonitoringTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { ApprovalsTab } from "./components/tabs/ApprovalsTab";
import { McpTab } from "./components/tabs/McpTab";

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

const INITIAL_CONFIRM: ConfirmDialogState = {
  open: false, title: "", message: "", confirmLabel: "Confirm", variant: "danger", onConfirm: () => {},
};

function App() {
  const [tab, setTab] = useState<Tab>("monitoring");
  const [daemon, setDaemon] = useState<DaemonStatus>({ state: "stopped", version: "", pid: 0, uptime: "" });
  const [stats, setStats] = useState<ProxyStats | null>(null);
  const [config, setConfig] = useState<AgConfig | null>(null);
  const [ocBaseUrl, setOcBaseUrl] = useState("");
  const [ocFullConfig, setOcFullConfig] = useState<any>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [mcpPolicy, setMcpPolicy] = useState<MCPPolicyData | null>(null);
  const [mcpPolicyText, setMcpPolicyText] = useState("");
  const [mcpAudit, setMcpAudit] = useState<MCPAuditEntry[]>([]);
  const [mcpClients, setMcpClients] = useState<MCPClient[]>([]);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(INITIAL_CONFIRM);

  const timeSince = useTimeSince(lastUpdate);
  const blockRateNum = stats ? parseFloat(String(stats.blockRate).replace("%", "")) : 0;

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const safeCall = useCallback(async (fn: () => Promise<string>) => {
    try { return JSON.parse(await fn()); }
    catch { return { error: "Connection failed" }; }
  }, []);

  const withLoading = useCallback(async (key: string, fn: () => Promise<void>) => {
    setLoading((p) => ({ ...p, [key]: true }));
    setErrors((p) => ({ ...p, [key]: null }));
    try { await fn(); }
    catch (e: any) { setErrors((p) => ({ ...p, [key]: e?.message ?? "Unknown error" })); }
    finally { setLoading((p) => ({ ...p, [key]: false })); }
  }, []);

  // ── Data loaders ─────────────────────────────────────────────
  const loadDaemonStatus = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetDaemonStatus());
    if (!d.error) setDaemon(d);
  }, [safeCall]);

  const loadStats = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetProxyStats());
    if (!d.error) { setStats(d); setLastUpdate(Date.now()); }
    else if (!stats) throw new Error(d.error);
  }, [safeCall, stats]);

  const loadConfig = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetAgentGuardConfig());
    if (!d.error) setConfig(d);
  }, [safeCall]);

  const loadOcConfig = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetOpenClawConfig());
    if (!d.error) {
      setOcFullConfig(d);
      try { setOcBaseUrl(d.models.providers.anthropic.baseUrl || ""); } catch { setOcBaseUrl(""); }
    }
  }, [safeCall]);

  const loadApprovals = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetApprovals());
    if (Array.isArray(d)) setApprovals(d);
    else if (d.error) throw new Error(d.error);
  }, [safeCall]);

  const loadMCPPolicy = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetMCPPolicy());
    if (!d.error) {
      setMcpPolicy(d);
      setMcpPolicyText(d.exists && d.policy ? JSON.stringify(d.policy, null, 2) : "");
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
    loadDaemonStatus(); loadStats(); loadConfig(); loadOcConfig();
    loadApprovals(); loadMCPPolicy(); loadMCPAudit(); loadMCPClients();
  }, [loadDaemonStatus, loadStats, loadConfig, loadOcConfig, loadApprovals, loadMCPPolicy, loadMCPAudit, loadMCPClients]);

  useEffect(() => {
    refreshAll();
    const s = setInterval(loadStats, 5000);
    const d = setInterval(loadDaemonStatus, 3000);
    return () => { clearInterval(s); clearInterval(d); };
  }, [refreshAll, loadStats, loadDaemonStatus]);

  useEffect(() => {
    if (tab === "settings") { loadConfig(); loadOcConfig(); }
    else if (tab === "mcp") { loadMCPPolicy(); loadMCPAudit(); loadMCPClients(); }
    else if (tab === "approvals") { withLoading("approvals", loadApprovals); }
  }, [tab, loadConfig, loadOcConfig, loadMCPPolicy, loadMCPAudit, loadMCPClients, loadApprovals, withLoading]);

  // ── Handlers ────────────────────────────────────────────────
  const handleStartDaemon = async () => {
    const r = await safeCall(() => window.go.main.App.StartDaemon());
    showToast(r.error || "Daemon started", r.error ? "error" : "success");
    loadDaemonStatus();
  };

  const handleStopDaemon = () => {
    setConfirmDialog({
      open: true, title: "Stop Daemon", message: "Are you sure you want to stop the AgentGuard daemon? All protection will be disabled.",
      confirmLabel: "Stop", variant: "danger",
      onConfirm: async () => {
        const r = await safeCall(() => window.go.main.App.StopDaemon());
        showToast(r.error || "Daemon stopped", r.error ? "error" : "success");
        loadDaemonStatus();
      },
    });
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    await withLoading("saveConfig", async () => {
      const body = { gateEnabled: config.gateEnabled, gateMode: config.gateMode, gateFailOpen: config.gateFailOpen, llmMode: config.llmMode, piiEnabled: config.piiEnabled };
      const r = await safeCall(() => window.go.main.App.SaveAgentGuardConfig(JSON.stringify(body)));
      showToast(r.error || "Settings saved", r.error ? "error" : "success");
    });
  };

  const handleSaveOcConfig = async () => {
    await withLoading("saveOcConfig", async () => {
      const cfg = ocFullConfig || { models: { providers: { anthropic: {} } } };
      try { cfg.models.providers.anthropic.baseUrl = ocBaseUrl; } catch { /* structure mismatch */ }
      const r = await safeCall(() => window.go.main.App.SaveOpenClawConfig(JSON.stringify(cfg)));
      showToast(r.error || "OpenClaw settings saved", r.error ? "error" : "success");
    });
  };

  const handleApproval = async (id: string, action: string) => {
    const r = await safeCall(() => window.go.main.App.HandleApproval(id, action));
    showToast(r.error || `Approval ${action}d`, r.error ? "error" : "success");
    loadApprovals();
  };

  const handleCheckUpdate = async () => {
    setUpdateChecking(true);
    setUpdateInfo(await safeCall(() => window.go.main.App.CheckForUpdate()));
    setUpdateChecking(false);
  };

  const handleUpdateCore = async () => {
    setUpdating(true);
    const r = await safeCall(() => window.go.main.App.UpdateDaemon());
    showToast(r.error || `Updated to ${r.version}`, r.error ? "error" : "success");
    setUpdating(false);
    handleCheckUpdate();
    loadDaemonStatus();
  };

  const handleSaveMCPPolicy = async () => {
    try { JSON.parse(mcpPolicyText); } catch { showToast("Invalid JSON", "error"); return; }
    await withLoading("saveMcpPolicy", async () => {
      const r = await safeCall(() => window.go.main.App.SaveMCPPolicy(mcpPolicyText));
      showToast(r.error || "Policy saved", r.error ? "error" : "success");
      loadMCPPolicy();
    });
  };

  const handleWrapClient = async (client: string) => {
    const r = await safeCall(() => window.go.main.App.WrapMCPClient(client));
    showToast(r.error || `${client} wrapped`, r.error ? "error" : "success");
    loadMCPClients();
  };

  const handleUnwrapClient = (client: string) => {
    setConfirmDialog({
      open: true, title: "Unwrap MCP Client", message: `Are you sure you want to unwrap "${client}"? The MCP gateway protection will be removed.`,
      confirmLabel: "Unwrap", variant: "danger",
      onConfirm: async () => {
        const r = await safeCall(() => window.go.main.App.UnwrapMCPClient(client));
        showToast(r.error || `${client} unwrapped`, r.error ? "error" : "success");
        loadMCPClients();
      },
    });
  };

  // ── Sidebar tabs ─────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "monitoring", label: "Monitoring", icon: <path d="M3 12h4l3-9 4 18 3-9h4" /> },
    { id: "settings", label: "Settings", icon: <><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></> },
    { id: "approvals", label: "Approvals", icon: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /> },
    { id: "mcp", label: "MCP", icon: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
  ];

  return (
    <>
      {/* Title bar */}
      <div className="titlebar">
        <h1>AgentGuard</h1>
        <div
          className={`status-indicator ${daemon.state === "running" ? "online" : ""}`}
          aria-label={`Daemon status: ${daemon.state}`}
        />
        {daemon.version && <span className="version-badge">v{daemon.version}</span>}
      </div>

      <div className="app-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">Dashboard</div>
            {tabs.map((t) => (
              <button
                key={t.id}
                className={`sidebar-item ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                aria-label={t.label}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {t.icon}
                </svg>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="sidebar-spacer" />
          <div className="sidebar-footer">
            <div className="daemon-control">
              <div className={`daemon-dot ${daemon.state}`} />
              <span className="daemon-state-text">{daemon.state}</span>
            </div>
            {daemon.state === "running" || daemon.state === "starting" ? (
              <button className="btn btn-danger btn--full-width" onClick={handleStopDaemon}>
                Stop
              </button>
            ) : (
              <button className="btn btn-success btn--full-width" onClick={handleStartDaemon}>
                Start
              </button>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          {tab === "monitoring" && (
            <MonitoringTab
              stats={stats}
              timeSince={timeSince}
              blockRateNum={blockRateNum}
              loading={!!loading.stats}
              error={errors.stats ?? null}
              onRefresh={refreshAll}
            />
          )}
          {tab === "settings" && (
            <SettingsTab
              config={config}
              onConfigChange={setConfig}
              onSaveConfig={handleSaveConfig}
              savingConfig={!!loading.saveConfig}
              ocBaseUrl={ocBaseUrl}
              onOcBaseUrlChange={setOcBaseUrl}
              onSaveOcConfig={handleSaveOcConfig}
              savingOcConfig={!!loading.saveOcConfig}
              updateInfo={updateInfo}
              updateChecking={updateChecking}
              updating={updating}
              onCheckUpdate={handleCheckUpdate}
              onUpdateCore={handleUpdateCore}
            />
          )}
          {tab === "approvals" && (
            <ApprovalsTab
              approvals={approvals}
              loading={!!loading.approvals}
              error={errors.approvals ?? null}
              onApproval={handleApproval}
              onRefresh={() => withLoading("approvals", loadApprovals)}
            />
          )}
          {tab === "mcp" && (
            <McpTab
              clients={mcpClients}
              policy={mcpPolicy}
              policyText={mcpPolicyText}
              onPolicyTextChange={setMcpPolicyText}
              audit={mcpAudit}
              onSavePolicy={handleSaveMCPPolicy}
              savingPolicy={!!loading.saveMcpPolicy}
              onWrapClient={handleWrapClient}
              onUnwrapClient={handleUnwrapClient}
              onRefresh={() => { loadMCPPolicy(); loadMCPAudit(); loadMCPClients(); }}
            />
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && <Toast toast={toast} />}

      {/* Confirm Dialog */}
      <ConfirmDialog state={confirmDialog} onClose={() => setConfirmDialog(INITIAL_CONFIRM)} />
    </>
  );
}

export default App;
