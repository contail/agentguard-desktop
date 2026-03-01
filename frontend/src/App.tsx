import { useState, useEffect, useCallback } from "react";
import "./style.css";

import type {
  Tab,
  DaemonStatus,
  ProxyStats,
  AgConfig,
  Approval,
  Toast as ToastType,
  MCPPolicyData,
  MCPAuditEntry,
  MCPClient,
  ConfirmDialogState,
} from "./types";

import { useTimeSince } from "./hooks/useTimeSince";
import { Toast } from "./components/shared/Toast";
import { ConfirmDialog } from "./components/shared/ConfirmDialog";
import { MonitoringTab } from "./components/tabs/MonitoringTab";
import { SettingsTab } from "./components/tabs/SettingsTab";
import { ApprovalsTab } from "./components/tabs/ApprovalsTab";
import { McpTab } from "./components/tabs/McpTab";
import { LogsTab } from "./components/tabs/LogsTab";

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
          GetLogs(lines: number): Promise<string>;
        };
      };
    };
  }
}

const initialConfirmState: ConfirmDialogState = {
  open: false,
  title: "",
  message: "",
  confirmLabel: "",
  variant: "primary",
  onConfirm: () => {},
};

function App() {
  const [tab, setTab] = useState<Tab>("monitoring");
  const [daemon, setDaemon] = useState<DaemonStatus>({
    state: "stopped",
    version: "",
    pid: 0,
    uptime: "",
  });
  const [stats, setStats] = useState<ProxyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [config, setConfig] = useState<AgConfig | null>(null);
  const [ocBaseUrl, setOcBaseUrl] = useState("");
  const [ocFullConfig, setOcFullConfig] = useState<any>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastType | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [mcpPolicy, setMcpPolicy] = useState<MCPPolicyData | null>(null);
  const [mcpPolicyText, setMcpPolicyText] = useState("");
  const [mcpAudit, setMcpAudit] = useState<MCPAuditEntry[]>([]);
  const [mcpClients, setMcpClients] = useState<MCPClient[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingOcConfig, setSavingOcConfig] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [confirmState, setConfirmState] =
    useState<ConfirmDialogState>(initialConfirmState);

  const timeSince = useTimeSince(lastUpdate);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    [],
  );

  const safeCall = useCallback(async (fn: () => Promise<string>) => {
    try {
      const raw = await fn();
      return JSON.parse(raw);
    } catch {
      return { error: "Connection failed" };
    }
  }, []);

  // --- Data loaders ---

  const loadDaemonStatus = useCallback(async () => {
    const d = await safeCall(() => window.go.main.App.GetDaemonStatus());
    if (!d.error) setDaemon(d);
  }, [safeCall]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    const d = await safeCall(() => window.go.main.App.GetProxyStats());
    if (d.error) {
      setStatsError(d.error);
    } else {
      setStats(d);
      setLastUpdate(Date.now());
    }
    setStatsLoading(false);
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
    setApprovalsLoading(true);
    setApprovalsError(null);
    const d = await safeCall(() => window.go.main.App.GetApprovals());
    if (Array.isArray(d)) {
      setApprovals(d);
    } else if (d.error) {
      setApprovalsError(d.error);
    }
    setApprovalsLoading(false);
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

  useEffect(() => {
    if (tab === "mcp") {
      loadMCPAudit();
      const mcpInterval = setInterval(loadMCPAudit, 5000);
      return () => clearInterval(mcpInterval);
    }
  }, [tab, loadMCPAudit]);

  useEffect(() => {
    if (tab === "settings") {
      loadConfig();
      loadOcConfig();
    } else if (tab === "mcp") {
      loadMCPPolicy();
      loadMCPAudit();
      loadMCPClients();
    } else if (tab === "approvals") {
      loadApprovals();
    }
  }, [
    tab,
    loadConfig,
    loadOcConfig,
    loadMCPPolicy,
    loadMCPAudit,
    loadMCPClients,
    loadApprovals,
  ]);

  // --- Event handlers ---

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
    setSavingConfig(true);
    const body = {
      gateEnabled: config.gateEnabled,
      gateMode: config.gateMode,
      gateFailOpen: config.gateFailOpen,
      llmMode: config.llmMode,
      piiEnabled: config.piiEnabled,
    };
    const r = await safeCall(() =>
      window.go.main.App.SaveAgentGuardConfig(JSON.stringify(body)),
    );
    if (r.error) showToast(r.error, "error");
    else showToast("Settings saved", "success");
    setSavingConfig(false);
  };

  const handleSaveOcConfig = async () => {
    setSavingOcConfig(true);
    const cfg = ocFullConfig || {
      models: { providers: { anthropic: {} } },
    };
    try {
      cfg.models.providers.anthropic.baseUrl = ocBaseUrl;
    } catch {
      /* structure mismatch */
    }
    const r = await safeCall(() =>
      window.go.main.App.SaveOpenClawConfig(JSON.stringify(cfg)),
    );
    if (r.error) showToast(r.error, "error");
    else showToast("OpenClaw settings saved", "success");
    setSavingOcConfig(false);
  };

  const handleApproval = async (id: string, action: string) => {
    const r = await safeCall(() =>
      window.go.main.App.HandleApproval(id, action),
    );
    if (r.error) showToast(r.error, "error");
    else showToast(`Approval ${action}d`, "success");
    loadApprovals();
  };

  const handleSaveMCPPolicy = async () => {
    try {
      JSON.parse(mcpPolicyText);
    } catch {
      showToast("Invalid JSON", "error");
      return;
    }
    setSavingPolicy(true);
    const r = await safeCall(() =>
      window.go.main.App.SaveMCPPolicy(mcpPolicyText),
    );
    if (r.error) showToast(r.error, "error");
    else showToast("Policy saved", "success");
    setSavingPolicy(false);
    loadMCPPolicy();
  };

  const handleWrapClient = async (client: string) => {
    const r = await safeCall(() => window.go.main.App.WrapMCPClient(client));
    if (r.error) showToast(r.error, "error");
    else showToast(`${client} wrapped`, "success");
    loadMCPClients();
  };

  const handleUnwrapClient = async (client: string) => {
    setConfirmState({
      open: true,
      title: "Unwrap MCP Client",
      message: `Remove AgentGuard protection from ${client}? The original MCP config will be restored.`,
      confirmLabel: "Unwrap",
      variant: "danger",
      onConfirm: async () => {
        const r = await safeCall(() =>
          window.go.main.App.UnwrapMCPClient(client),
        );
        if (r.error) showToast(r.error, "error");
        else showToast(`${client} unwrapped`, "success");
        loadMCPClients();
      },
    });
  };

  const blockRateNum = stats
    ? parseFloat(String(stats.blockRate).replace("%", ""))
    : 0;

  // --- Sidebar nav items ---
  const navItems: { id: Tab; label: string; icon: JSX.Element }[] = [
    {
      id: "monitoring",
      label: "Dashboard",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h4l3-9 4 18 3-9h4" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Configuration",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
    },
    {
      id: "approvals",
      label: "Pending Actions",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      id: "mcp",
      label: "IDE Protection",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: "logs" as Tab,
      label: "Logs",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  const daemonDotClass =
    daemon.state === "running"
      ? "bg-success shadow-[0_0_6px_theme(colors.success.DEFAULT)]"
      : daemon.state === "starting"
        ? "bg-warning animate-pulse"
        : daemon.state === "error"
          ? "bg-danger shadow-[0_0_6px_theme(colors.danger.DEFAULT)]"
          : "bg-content-muted";

  return (
    <>
      {/* Titlebar */}
      <div className="h-[38px] flex items-center px-4 bg-surface-primary border-b border-line select-none gap-2.5">
        <h1 className="text-[13px] font-semibold text-content-secondary tracking-tight">
          AgentGuard
        </h1>
        <div
          className={`w-[7px] h-[7px] rounded-full shrink-0 ${
            daemon.state === "running"
              ? "bg-success shadow-[0_0_6px_theme(colors.success.DEFAULT)]"
              : "bg-content-muted"
          }`}
        />
        {daemon.version && (
          <span className="text-[10px] text-content-muted bg-white/[0.06] px-[7px] py-[2px] rounded">
            v{daemon.version}
          </span>
        )}
      </div>

      {/* Layout */}
      <div className="flex h-[calc(100%-38px)]">
        {/* Sidebar */}
        <nav className="w-[200px] max-[900px]:w-[52px] border-r border-line flex flex-col py-3 shrink-0">
          <div className="px-3 mb-5">
            <div className="text-[10px] font-semibold text-content-muted uppercase tracking-widest px-2 mb-1.5 max-[900px]:hidden">
              Dashboard
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-2 py-2 px-2.5 rounded-sm cursor-pointer text-[13px] transition-all border-none w-full text-left max-[900px]:justify-center max-[900px]:p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  tab === item.id
                    ? "bg-white/[0.06] text-content-primary"
                    : "bg-transparent text-content-secondary hover:bg-surface-card hover:text-content-primary"
                }`}
                onClick={() => setTab(item.id)}
              >
                <svg className="w-4 h-4 shrink-0" viewBox={item.icon.props.viewBox} fill={item.icon.props.fill} stroke={item.icon.props.stroke} strokeWidth={item.icon.props.strokeWidth}>
                  {item.icon.props.children}
                </svg>
                <span className="max-[900px]:hidden">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Sidebar footer */}
          <div className="p-3 border-t border-line">
            <div className="flex items-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full ${daemonDotClass}`} />
              <span className="text-[11px] text-content-muted">
                {daemon.state}
              </span>
            </div>
            {daemon.state === "running" || daemon.state === "starting" ? (
              <button
                className="inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-transparent bg-danger-muted text-danger hover:bg-danger hover:text-white no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent w-full justify-center"
                onClick={handleStopDaemon}
              >
                Stop
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-transparent bg-success-muted text-success hover:bg-success hover:text-white no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent w-full justify-center"
                onClick={handleStartDaemon}
              >
                Start
              </button>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {tab === "monitoring" && (
            <MonitoringTab
              stats={stats}
              timeSince={timeSince}
              blockRateNum={blockRateNum}
              loading={statsLoading}
              error={statsError}
              daemonState={daemon.state}
              onRefresh={refreshAll}
            />
          )}

          {tab === "settings" && (
            <SettingsTab
              config={config}
              onConfigChange={setConfig}
              onSaveConfig={handleSaveConfig}
              savingConfig={savingConfig}
              ocBaseUrl={ocBaseUrl}
              onOcBaseUrlChange={setOcBaseUrl}
              onSaveOcConfig={handleSaveOcConfig}
              savingOcConfig={savingOcConfig}
            />
          )}

          {tab === "approvals" && (
            <ApprovalsTab
              approvals={approvals}
              loading={approvalsLoading}
              error={approvalsError}
              onApproval={handleApproval}
              onRefresh={loadApprovals}
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
              savingPolicy={savingPolicy}
              onWrapClient={handleWrapClient}
              onUnwrapClient={handleUnwrapClient}
              onRefresh={() => {
                loadMCPPolicy();
                loadMCPAudit();
                loadMCPClients();
              }}
            />
          )}

          {tab === "logs" && (
            <LogsTab daemonState={daemon.state} />
          )}
        </main>
      </div>

      {toast && <Toast toast={toast} />}
      <ConfirmDialog
        state={confirmState}
        onClose={() => setConfirmState(initialConfirmState)}
      />
    </>
  );
}

export default App;
