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
    <div className="tab-content">
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
          <div className="settings-section-title" style={{ marginTop: 0 }}>
            Proxy & Security
          </div>
          <Card title="AgentGuard Configuration">
            <div className="form-grid--single">
              <div className="form-field">
                <span className="form-label">
                  Proxy Port{" "}
                  <span className="form-label-desc">
                    The port AgentGuard listens on for inbound traffic.
                  </span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.proxyPort}</span>
                </div>
              </div>

              <div className="form-field">
                <span className="form-label">
                  Gate Mode{" "}
                  <span className="form-label-desc">Trust evaluation enforcement policy.</span>
                </span>
                <select
                  className="form-select"
                  value={config.gateMode}
                  onChange={(e) => onConfigChange({ ...config, gateMode: e.target.value })}
                >
                  <option value="enforce">Enforce (Block malicious requests)</option>
                  <option value="monitor">Monitor (Log only, do not block)</option>
                </select>
              </div>

              <div className="form-field">
                <span className="form-label">
                  Gate Enabled{" "}
                  <span className="form-label-desc">
                    Enable Stage 2 remote AI trust evaluation.
                  </span>
                </span>
                <Toggle
                  checked={config.gateEnabled}
                  onChange={(v) => onConfigChange({ ...config, gateEnabled: v })}
                  label="Toggle gate enabled"
                />
              </div>

              <div className="form-field">
                <span className="form-label">
                  Gate Fail Open{" "}
                  <span className="form-label-desc">
                    Allow requests if the Gate API is unreachable.
                  </span>
                </span>
                <Toggle
                  checked={config.gateFailOpen}
                  onChange={(v) => onConfigChange({ ...config, gateFailOpen: v })}
                  label="Toggle gate fail open"
                />
              </div>
            </div>
          </Card>

          <div className="settings-section-title">LLM Gateway</div>
          <Card title="LLM Traffic Monitoring">
            <div className="form-grid--single">
              <div className="form-field">
                <span className="form-label">
                  LLM Port{" "}
                  <span className="form-label-desc">Port for outbound LLM API interception.</span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.llmPort}</span>
                </div>
              </div>

              <div className="form-field">
                <span className="form-label">
                  LLM Mode{" "}
                  <span className="form-label-desc">How to handle outgoing LLM tool calls.</span>
                </span>
                <select
                  className="form-select"
                  value={config.llmMode}
                  onChange={(e) => onConfigChange({ ...config, llmMode: e.target.value })}
                >
                  <option value="monitor">Monitor (Log all tool calls silently)</option>
                  <option value="enforce">Enforce (Block calls matching deny rules)</option>
                  <option value="confirm">Confirm (Require manual approval for all calls)</option>
                </select>
              </div>

              <div className="form-field">
                <span className="form-label">
                  PII Sanitization{" "}
                  <span className="form-label-desc">
                    Automatically redact personal data from LLM prompts.
                  </span>
                </span>
                <Toggle
                  checked={config.piiEnabled}
                  onChange={(v) => onConfigChange({ ...config, piiEnabled: v })}
                  label="Toggle PII sanitization"
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                className={`btn btn-primary ${savingConfig ? "btn--loading" : ""}`}
                onClick={onSaveConfig}
                disabled={savingConfig}
              >
                Save Settings
              </button>
            </div>
          </Card>

          <div className="settings-section-title">OpenClaw Integration</div>
          <Card title="OpenClaw Target Server">
            <div className="form-grid--single">
              <div className="form-field form-field--mb">
                <span className="form-label">
                  Base URL{" "}
                  <span className="form-label-desc">
                    The upstream endpoint for OpenClaw API requests.
                  </span>
                </span>
                <input
                  className="form-input"
                  value={ocBaseUrl}
                  onChange={(e) => onOcBaseUrlChange(e.target.value)}
                  placeholder="https://api.anthropic.com"
                />
              </div>
            </div>
            <button
              className={`btn btn-primary ${savingOcConfig ? "btn--loading" : ""}`}
              onClick={onSaveOcConfig}
              disabled={savingOcConfig}
            >
              Save OpenClaw Settings
            </button>
          </Card>

          <div className="settings-section-title">Advanced</div>
          <Card title="Advanced Configuration">
            <div className="form-grid--single">
              <div className="form-field">
                <span className="form-label">
                  Max Body Size{" "}
                  <span className="form-label-desc">Maximum HTTP request body size (bytes).</span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.maxBodySize}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">
                  Gate URL{" "}
                  <span className="form-label-desc">Endpoint for Stage 2 trust evaluation.</span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.gateURL}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">
                  Gate Timeout (ms){" "}
                  <span className="form-label-desc">Maximum wait time for Stage 2 evaluation.</span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.gateTimeoutMs}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">
                  Approval Timeout (ms){" "}
                  <span className="form-label-desc">
                    Wait time before pending actions auto-expire.
                  </span>
                </span>
                <div className="info-row">
                  <span className="info-row__value">{config.approvalTimeoutMs}</span>
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
          <button className="btn" onClick={onCheckUpdate} disabled={updateChecking}>
            {updateChecking ? "Checking..." : "Check for Updates"}
          </button>
        }
      >
        {!updateInfo ? (
          <EmptyState message='Click "Check for Updates" to scan for new versions' />
        ) : updateInfo.error ? (
          <EmptyState message={updateInfo.error} variant="error" />
        ) : (
          <div className="update-list">
            <ListItemCard
              badge={
                <Badge variant={updateInfo.coreUpdateAvailable ? "pending" : "approved"}>
                  {updateInfo.coreUpdateAvailable ? "update available" : "up to date"}
                </Badge>
              }
              title="AgentGuard Core"
              meta={
                <>
                  Installed: v{updateInfo.coreLocal || "?"} &middot; Latest:{" "}
                  {updateInfo.coreRemote || "?"}
                  {updateInfo.coreError && ` (error: ${updateInfo.coreError})`}
                </>
              }
              actions={
                updateInfo.coreUpdateAvailable ? (
                  <button
                    className={`btn btn-primary ${updating ? "btn--loading" : ""}`}
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
                <Badge variant={updateInfo.desktopUpdateAvailable ? "pending" : "approved"}>
                  {updateInfo.desktopUpdateAvailable ? "update available" : "up to date"}
                </Badge>
              }
              title="AgentGuard Desktop"
              meta={
                <>
                  Installed: v{updateInfo.appVersion || "?"} &middot; Latest:{" "}
                  {updateInfo.desktopRemote || "?"}
                  {updateInfo.desktopError && ` (error: ${updateInfo.desktopError})`}
                </>
              }
              actions={
                updateInfo.desktopUpdateAvailable && updateInfo.desktopDownloadURL ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => BrowserOpenURL(updateInfo.desktopDownloadURL)}
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
