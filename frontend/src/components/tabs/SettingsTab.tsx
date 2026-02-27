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
      <PageHeader title="Settings" />

      {!config && (
        <Card title="Configuration">
          <EmptyState message="Start the daemon to load configuration" />
        </Card>
      )}

      {config && (
        <>
          <Card title="AgentGuard Configuration">
            <div className="form-grid">
              <div className="form-field">
                <span className="form-label">Proxy Port</span>
                <div className="info-row">
                  <span className="info-row__value">{config.proxyPort}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">LLM Port</span>
                <div className="info-row">
                  <span className="info-row__value">{config.llmPort}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">Max Body Size</span>
                <div className="info-row">
                  <span className="info-row__value">{config.maxBodySize}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">Gate URL</span>
                <div className="info-row">
                  <span className="info-row__value">{config.gateURL}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">Gate Timeout (ms)</span>
                <div className="info-row">
                  <span className="info-row__value">{config.gateTimeoutMs}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">Approval Timeout (ms)</span>
                <div className="info-row">
                  <span className="info-row__value">{config.approvalTimeoutMs}</span>
                </div>
              </div>
              <div className="form-field">
                <span className="form-label">Gate Mode</span>
                <select
                  className="form-select"
                  value={config.gateMode}
                  onChange={(e) => onConfigChange({ ...config, gateMode: e.target.value })}
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
                  onChange={(e) => onConfigChange({ ...config, llmMode: e.target.value })}
                >
                  <option value="monitor">monitor</option>
                  <option value="enforce">enforce</option>
                  <option value="confirm">confirm</option>
                </select>
              </div>
              <div className="form-field">
                <span className="form-label">Gate Enabled</span>
                <Toggle
                  checked={config.gateEnabled}
                  onChange={(v) => onConfigChange({ ...config, gateEnabled: v })}
                  label="Toggle gate enabled"
                />
              </div>
              <div className="form-field">
                <span className="form-label">Gate Fail Open</span>
                <Toggle
                  checked={config.gateFailOpen}
                  onChange={(v) => onConfigChange({ ...config, gateFailOpen: v })}
                  label="Toggle gate fail open"
                />
              </div>
              <div className="form-field">
                <span className="form-label">PII Sanitization</span>
                <Toggle
                  checked={config.piiEnabled}
                  onChange={(v) => onConfigChange({ ...config, piiEnabled: v })}
                  label="Toggle PII sanitization"
                />
              </div>
            </div>
            <button
              className={`btn btn-primary ${savingConfig ? "btn--loading" : ""}`}
              onClick={onSaveConfig}
              disabled={savingConfig}
            >
              Save Settings
            </button>
          </Card>

          <Card title="OpenClaw Settings">
            <div className="form-field form-field--mb">
              <span className="form-label">Base URL</span>
              <input
                className="form-input"
                value={ocBaseUrl}
                onChange={(e) => onOcBaseUrlChange(e.target.value)}
                placeholder="https://api.anthropic.com"
              />
            </div>
            <button
              className={`btn btn-primary ${savingOcConfig ? "btn--loading" : ""}`}
              onClick={onSaveOcConfig}
              disabled={savingOcConfig}
            >
              Save OpenClaw Settings
            </button>
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
