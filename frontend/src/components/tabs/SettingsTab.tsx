import { BrowserOpenURL } from "../../../wailsjs/runtime/runtime";
import type { AgConfig } from "../../types";
import { Card } from "../shared/Card";
import { Toggle } from "../shared/Toggle";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { ListItemCard } from "../shared/ListItemCard";
import { Badge } from "../shared/Badge";

interface SettingsTabProps {
  config: AgConfig | null;
  onConfigChange: (config: AgConfig) => void;
  onSaveConfig: () => void;
  savingConfig: boolean;
  ocBaseUrl: string;
  onOcBaseUrlChange: (url: string) => void;
  onSaveOcConfig: () => void;
  savingOcConfig: boolean;
  updateInfo: any;
  updateChecking: boolean;
  updating: boolean;
  onCheckUpdate: () => void;
  onUpdateCore: () => void;
}

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const btnDefault = `${btnBase} border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary`;
const btnPrimary = `${btnBase} border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover`;

export function SettingsTab({
  config,
  onConfigChange,
  onSaveConfig,
  savingConfig,
  ocBaseUrl,
  onOcBaseUrlChange,
  onSaveOcConfig,
  savingOcConfig,
  updateInfo,
  updateChecking,
  updating,
  onCheckUpdate,
  onUpdateCore,
}: SettingsTabProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Configuration"
        description="포트, 타임아웃, 보안 모드 등 프록시 데몬의 전반적인 환경을 설정합니다."
      />

      {!config && (
        <Card title="Configuration">
          <EmptyState
            title="AgentGuard가 꺼져있습니다."
            description="설정을 로드하려면 좌측 하단의 [Start] 버튼을 눌러 데몬을 켜주세요."
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="32"
                height="32"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            }
          />
        </Card>
      )}

      {config && (
        <>
          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3">
            Proxy & Security
          </div>
          <Card title="AgentGuard Configuration">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Proxy Port
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    The port AgentGuard listens on for inbound traffic.
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.proxyPort}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Gate Mode
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Trust evaluation enforcement policy.
                  </span>
                </span>
                <select
                  className="py-2 px-2.5 pr-8 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none cursor-pointer appearance-none select-arrow focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.gateMode}
                  onChange={(e) =>
                    onConfigChange({ ...config, gateMode: e.target.value })
                  }
                >
                  <option value="enforce">
                    Enforce (Block malicious requests)
                  </option>
                  <option value="monitor">
                    Monitor (Log only, do not block)
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Gate Enabled
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Enable Stage 2 remote AI trust evaluation.
                  </span>
                </span>
                <Toggle
                  checked={config.gateEnabled}
                  onChange={(v) =>
                    onConfigChange({ ...config, gateEnabled: v })
                  }
                  label="Toggle gate enabled"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Gate Fail Open
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Allow requests if the Gate API is unreachable.
                  </span>
                </span>
                <Toggle
                  checked={config.gateFailOpen}
                  onChange={(v) =>
                    onConfigChange({ ...config, gateFailOpen: v })
                  }
                  label="Toggle gate fail open"
                />
              </div>
            </div>
          </Card>

          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3 mt-5">
            LLM Gateway
          </div>
          <Card title="LLM Traffic Monitoring">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  LLM Port
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Port for outbound LLM API interception.
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.llmPort}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  LLM Mode
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    How to handle outgoing LLM tool calls.
                  </span>
                </span>
                <select
                  className="py-2 px-2.5 pr-8 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none cursor-pointer appearance-none select-arrow focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.llmMode}
                  onChange={(e) =>
                    onConfigChange({ ...config, llmMode: e.target.value })
                  }
                >
                  <option value="monitor">
                    Monitor (Log all tool calls silently)
                  </option>
                  <option value="enforce">
                    Enforce (Block calls matching deny rules)
                  </option>
                  <option value="confirm">
                    Confirm (Require manual approval for all calls)
                  </option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  PII Sanitization
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Automatically redact personal data from LLM prompts.
                  </span>
                </span>
                <Toggle
                  checked={config.piiEnabled}
                  onChange={(v) =>
                    onConfigChange({ ...config, piiEnabled: v })
                  }
                  label="Toggle PII sanitization"
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                className={`${btnPrimary} ${savingConfig ? "btn-loading" : ""}`}
                onClick={onSaveConfig}
                disabled={savingConfig}
              >
                Save Settings
              </button>
            </div>
          </Card>

          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3 mt-5">
            OpenClaw Integration
          </div>
          <Card title="OpenClaw Target Server">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Base URL
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    The upstream endpoint for OpenClaw API requests.
                  </span>
                </span>
                <input
                  className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={ocBaseUrl}
                  onChange={(e) => onOcBaseUrlChange(e.target.value)}
                  placeholder="https://api.anthropic.com"
                />
              </div>
            </div>
            <button
              className={`${btnPrimary} ${savingOcConfig ? "btn-loading" : ""}`}
              onClick={onSaveOcConfig}
              disabled={savingOcConfig}
            >
              Save OpenClaw Settings
            </button>
          </Card>

          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3 mt-5">
            Advanced
          </div>
          <Card title="Advanced Configuration">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Max Body Size
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Maximum HTTP request body size (bytes).
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.maxBodySize}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Gate URL
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Endpoint for Stage 2 trust evaluation.
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.gateURL}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Gate Timeout (ms)
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Maximum wait time for Stage 2 evaluation.
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.gateTimeoutMs}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Approval Timeout (ms)
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Wait time before pending actions auto-expire.
                  </span>
                </span>
                <div className="flex items-center justify-between py-2 px-2.5 bg-surface-input border border-line rounded-sm">
                  <span className="text-[13px] text-content-secondary">
                    {config.approvalTimeoutMs}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Updates */}
      <Card
        title="Updates"
        headerRight={
          <button
            className={btnDefault}
            onClick={onCheckUpdate}
            disabled={updateChecking}
          >
            {updateChecking ? "Checking..." : "Check for Updates"}
          </button>
        }
      >
        {!updateInfo ? (
          <EmptyState message='Click "Check for Updates" to scan for new versions' />
        ) : updateInfo.error ? (
          <EmptyState message={updateInfo.error} variant="error" />
        ) : (
          <div className="flex flex-col gap-3">
            <ListItemCard
              badge={
                <Badge
                  variant={
                    updateInfo.coreUpdateAvailable ? "pending" : "approved"
                  }
                >
                  {updateInfo.coreUpdateAvailable
                    ? "update available"
                    : "up to date"}
                </Badge>
              }
              title="AgentGuard Core"
              meta={
                <>
                  Installed: v{updateInfo.coreLocal || "?"} &middot; Latest:{" "}
                  {updateInfo.coreRemote || "?"}
                  {updateInfo.coreError &&
                    ` (error: ${updateInfo.coreError})`}
                </>
              }
              actions={
                updateInfo.coreUpdateAvailable ? (
                  <button
                    className={`${btnPrimary} ${updating ? "btn-loading" : ""}`}
                    onClick={onUpdateCore}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update Now"}
                  </button>
                ) : undefined
              }
            />
            <ListItemCard
              badge={
                <Badge
                  variant={
                    updateInfo.desktopUpdateAvailable ? "pending" : "approved"
                  }
                >
                  {updateInfo.desktopUpdateAvailable
                    ? "update available"
                    : "up to date"}
                </Badge>
              }
              title="AgentGuard Desktop"
              meta={
                <>
                  Installed: v{updateInfo.appVersion || "?"} &middot; Latest:{" "}
                  {updateInfo.desktopRemote || "?"}
                  {updateInfo.desktopError &&
                    ` (error: ${updateInfo.desktopError})`}
                </>
              }
              actions={
                updateInfo.desktopUpdateAvailable &&
                updateInfo.desktopDownloadURL ? (
                  <button
                    className={btnPrimary}
                    onClick={() =>
                      BrowserOpenURL(updateInfo.desktopDownloadURL)
                    }
                  >
                    Download
                  </button>
                ) : undefined
              }
            />
          </div>
        )}
      </Card>
    </div>
  );
}
