import { useState } from "react";
import type { AgConfig } from "../../types";
import { Card } from "../shared/Card";
import { Toggle } from "../shared/Toggle";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";

interface SettingsTabProps {
  config: AgConfig | null;
  onConfigChange: (config: AgConfig) => void;
  onSaveConfig: () => void;
  savingConfig: boolean;
  ocBaseUrl: string;
  onOcBaseUrlChange: (url: string) => void;
  onSaveOcConfig: () => void;
  savingOcConfig: boolean;
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
}: SettingsTabProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Configuration"
        description="인바운드/아웃바운드 보호 정책과 연동 서비스를 설정합니다."
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
            Inbound Protection
          </div>
          <Card title="AgentGuard Configuration">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Listen Port
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
                  Protection Mode
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    인바운드 요청에 대한 보호 정책을 설정합니다.
                  </span>
                </span>
                <select
                  className="py-2 px-2.5 pr-8 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none cursor-pointer appearance-none select-arrow"
                  value={config.gateMode}
                  onChange={(e) => {
                    onConfigChange({ ...config, gateMode: e.target.value });
                    e.target.blur();
                  }}
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
                  AI Evaluation
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    원격 AI 서버를 이용한 2차 신뢰 평가를 활성화합니다.
                  </span>
                </span>
                <Toggle
                  checked={config.gateEnabled}
                  onChange={(v) =>
                    onConfigChange({ ...config, gateEnabled: v })
                  }
                  label="Toggle AI evaluation"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Evaluation Server
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    2차 신뢰 평가에 사용할 서버 주소입니다.
                  </span>
                </span>
                <input
                  className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.gateURL}
                  onChange={(e) =>
                    onConfigChange({ ...config, gateURL: e.target.value })
                  }
                  placeholder="http://localhost:8000"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Evaluation Timeout (ms)
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    2차 평가 응답 최대 대기 시간입니다.
                  </span>
                </span>
                <input
                  type="number"
                  className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.gateTimeoutMs}
                  onChange={(e) =>
                    onConfigChange({ ...config, gateTimeoutMs: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Fail Open
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    평가 서버에 연결할 수 없을 때 요청을 허용합니다.
                  </span>
                </span>
                <Toggle
                  checked={config.gateFailOpen}
                  onChange={(v) =>
                    onConfigChange({ ...config, gateFailOpen: v })
                  }
                  label="Toggle fail open"
                />
              </div>
            </div>
          </Card>

          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3 mt-5">
            Outbound Protection
          </div>
          <Card title="Outbound LLM Monitoring">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  LLM Port
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    아웃바운드 LLM API 호출을 감시하는 포트입니다.
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
                    AI 에이전트의 도구 호출을 처리하는 방식입니다.
                  </span>
                </span>
                <select
                  className="py-2 px-2.5 pr-8 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none cursor-pointer appearance-none select-arrow"
                  value={config.llmMode}
                  onChange={(e) => {
                    onConfigChange({ ...config, llmMode: e.target.value });
                    e.target.blur();
                  }}
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

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Approval Timeout (ms)
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    How long to wait for manual approval in confirm mode.
                  </span>
                </span>
                <input
                  type="number"
                  className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.approvalTimeoutMs}
                  onChange={(e) =>
                    onConfigChange({ ...config, approvalTimeoutMs: parseInt(e.target.value) || 0 })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                  Max Body Size (bytes)
                  <span className="text-[11px] text-content-muted font-normal mt-0.5">
                    Maximum request body size for inbound filtering.
                  </span>
                </span>
                <input
                  type="number"
                  className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                  value={config.maxBodySize}
                  onChange={(e) =>
                    onConfigChange({ ...config, maxBodySize: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                className={`${btnPrimary} ${savingConfig ? "btn-loading" : ""}`}
                onClick={onSaveConfig}
                disabled={savingConfig}
              >
                Save Settings
              </button>
              <button
                className={btnDefault}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </button>
            </div>

            {showAdvanced && (
              <div className="mt-5 pt-5 border-t border-line flex flex-col gap-4">
                <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide">
                  Advanced
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="flex flex-col text-[13px] font-medium text-content-primary tracking-tight">
                    Upstream Base URL
                    <span className="text-[11px] text-content-muted font-normal mt-0.5">
                      LLM API 요청의 최종 목적지 서버 주소입니다.
                    </span>
                  </span>
                  <input
                    className="py-2 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[13px] font-sans outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                    value={ocBaseUrl}
                    onChange={(e) => onOcBaseUrlChange(e.target.value)}
                    placeholder="https://api.anthropic.com"
                  />
                </div>
                <div>
                  <button
                    className={`${btnPrimary} ${savingOcConfig ? "btn-loading" : ""}`}
                    onClick={onSaveOcConfig}
                    disabled={savingOcConfig}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </Card>

        </>
      )}

    </div>
  );
}
