import { useState, useMemo } from "react";
import type { MCPClient, MCPPolicyData, MCPAuditEntry } from "../../types";
import { Card } from "../shared/Card";
import { StatBox } from "../shared/StatBox";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { ListItemCard } from "../shared/ListItemCard";
import { Badge } from "../shared/Badge";

/* ── Policy Templates ── */
interface PolicyTemplate {
  id: string;
  name: string;
  description: string;
  color: "success" | "accent" | "danger";
  policy: {
    version: string;
    default: {
      denied_tools: string[];
      denied_paths: string[];
      mode: string;
    };
  };
}

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "최소한의 보안, 자유로운 작업",
    color: "success",
    policy: {
      version: "1",
      default: {
        denied_tools: ["bash"],
        denied_paths: ["~/.ssh/*"],
        mode: "monitor",
      },
    },
  },
  {
    id: "standard",
    name: "Standard",
    description: "일반적인 보안 수준",
    color: "accent",
    policy: {
      version: "1",
      default: {
        denied_tools: ["bash", "write_*", "execute_*"],
        denied_paths: ["/etc/*", "~/.ssh/*", "~/.aws/*", "~/.gnupg/*"],
        mode: "enforce",
      },
    },
  },
  {
    id: "strict",
    name: "Strict",
    description: "최대 보안, 엄격한 제한",
    color: "danger",
    policy: {
      version: "1",
      default: {
        denied_tools: ["bash", "write_*", "execute_*", "read_*", "delete_*"],
        denied_paths: [
          "/etc/*",
          "~/.ssh/*",
          "~/.aws/*",
          "~/.gnupg/*",
          "~/.config/*",
          "/usr/*",
        ],
        mode: "enforce",
      },
    },
  },
];

interface McpTabProps {
  clients: MCPClient[];
  policy: MCPPolicyData | null;
  policyText: string;
  onPolicyTextChange: (text: string) => void;
  audit: MCPAuditEntry[];
  onSavePolicy: () => void;
  savingPolicy: boolean;
  onWrapClient: (name: string) => void;
  onUnwrapClient: (name: string) => void;
  onRefresh: () => void;
}

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const btnDefault = `${btnBase} border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary`;
const btnPrimary = `${btnBase} border border-accent bg-accent text-white hover:bg-accent-hover hover:border-accent-hover`;
const btnSuccess = `${btnBase} border border-transparent bg-success-muted text-success hover:bg-success hover:text-white`;
const btnDanger = `${btnBase} border border-transparent bg-danger-muted text-danger hover:bg-danger hover:text-white`;

function detectActiveTemplate(text: string): string | null {
  try {
    const parsed = JSON.parse(text);
    for (const t of POLICY_TEMPLATES) {
      if (JSON.stringify(parsed) === JSON.stringify(t.policy)) return t.id;
    }
  } catch {
    /* invalid JSON — no match */
  }
  return null;
}

interface PolicySummary {
  templateName: string;
  templateColor: "success" | "accent" | "danger" | null;
  templateDesc: string;
  mode: string;
  deniedTools: string[];
  deniedPaths: string[];
}

function extractPolicySummary(
  policy: MCPPolicyData | null,
  policyText: string,
): PolicySummary | null {
  if (!policy?.policy?.default) return null;

  const def = policy.policy.default;
  const deniedTools: string[] = Array.isArray(def.denied_tools) ? def.denied_tools : [];
  const deniedPaths: string[] = Array.isArray(def.denied_paths) ? def.denied_paths : [];
  const mode: string = typeof def.mode === "string" ? def.mode : "unknown";

  const activeId = detectActiveTemplate(policyText);
  const matched = activeId ? POLICY_TEMPLATES.find((t) => t.id === activeId) : null;

  return {
    templateName: matched ? matched.name : "Custom",
    templateColor: matched ? matched.color : null,
    templateDesc: matched ? matched.description : "사용자 정의 규칙",
    mode,
    deniedTools,
    deniedPaths,
  };
}

const chipDanger = "inline-block px-2 py-[2px] rounded text-[11px] font-mono bg-danger-muted text-danger";
const chipWarning = "inline-block px-2 py-[2px] rounded text-[11px] font-mono bg-warning-muted text-warning";

const colorMap = {
  success: {
    border: "border-success",
    bg: "bg-success-muted",
    text: "text-success",
    dot: "bg-success",
  },
  accent: {
    border: "border-accent",
    bg: "bg-accent/10",
    text: "text-accent",
    dot: "bg-accent",
  },
  danger: {
    border: "border-danger",
    bg: "bg-danger-muted",
    text: "text-danger",
    dot: "bg-danger",
  },
} as const;

export function McpTab({
  clients,
  policy,
  policyText,
  onPolicyTextChange,
  audit,
  onSavePolicy,
  savingPolicy,
  onWrapClient,
  onUnwrapClient,
  onRefresh,
}: McpTabProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeTemplateId = useMemo(() => detectActiveTemplate(policyText), [policyText]);
  const policySummary = useMemo(
    () => extractPolicySummary(policy, policyText),
    [policy, policyText],
  );

  const applyTemplate = (t: PolicyTemplate) => {
    onPolicyTextChange(JSON.stringify(t.policy, null, 2));
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="IDE Protection"
        description="Cursor, VS Code 등 AI 코딩 에디터가 내 컴퓨터를 마음대로 조작하지 못하도록 방어하고 감사 로그를 기록합니다."
      >
        <button className={btnDefault} onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      {/* MCP Clients */}
      <Card title="MCP Clients">
        {clients.length === 0 ? (
          <EmptyState
            title="발견된 AI 에디터가 없습니다."
            description="Cursor, VS Code, Claude Desktop 등이 설치되어 있는지 확인하거나, 먼저 Start 버튼을 눌러 데몬을 켜주세요."
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="32"
                height="32"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }
          />
        ) : (
          clients.map((c) => (
            <ListItemCard
              key={c.name}
              badge={
                <Badge
                  variant={
                    !c.installed
                      ? "denied"
                      : c.wrapped
                        ? "approved"
                        : "pending"
                  }
                >
                  {!c.installed
                    ? "not found"
                    : c.wrapped
                      ? "Protected"
                      : "Unprotected"}
                </Badge>
              }
              title={c.label}
              meta={
                <>
                  {c.servers} server{c.servers !== 1 ? "s" : ""}
                  {c.wrappedCount
                    ? ` (${c.wrappedCount} wrapped)`
                    : ""}{" "}
                  &middot; {c.configPath}
                </>
              }
              actions={
                c.installed && c.servers > 0 ? (
                  c.wrapped ? (
                    <button
                      className={btnDanger}
                      onClick={() => onUnwrapClient(c.name)}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      className={btnSuccess}
                      onClick={() => onWrapClient(c.name)}
                    >
                      Protect
                    </button>
                  )
                ) : undefined
              }
            />
          ))
        )}
      </Card>

      {/* Active Policy Summary */}
      {policySummary ? (
        <>
          <div className="text-[10px] font-medium text-content-muted uppercase tracking-wide mt-6 mb-2 px-1">
            Active Policy
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <StatBox
              label="Template"
              value={policySummary.templateName}
              variant="info"
              colorClass={policySummary.templateColor ?? undefined}
              description={policySummary.templateDesc}
            />
            <StatBox
              label="Mode"
              value={policySummary.mode}
              variant="info"
              colorClass={policySummary.mode === "enforce" ? "success" : "warning"}
              description={policySummary.mode === "enforce" ? "규칙 위반 시 차단" : "위반을 기록만 함"}
            />
            <StatBox
              label="Rules"
              value={`${policySummary.deniedTools.length + policySummary.deniedPaths.length} rules`}
              variant="info"
              description={`${policySummary.deniedTools.length} tools, ${policySummary.deniedPaths.length} paths`}
            />
          </div>
          {(policySummary.deniedTools.length > 0 || policySummary.deniedPaths.length > 0) && (
            <Card title="Policy Details">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-medium text-content-muted uppercase tracking-wide mb-2">
                    Denied Tools
                  </div>
                  {policySummary.deniedTools.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {policySummary.deniedTools.map((t) => (
                        <span key={t} className={chipDanger}>{t}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-content-muted">제한 없음</span>
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-medium text-content-muted uppercase tracking-wide mb-2">
                    Denied Paths
                  </div>
                  {policySummary.deniedPaths.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {policySummary.deniedPaths.map((p) => (
                        <span key={p} className={chipWarning}>{p}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-content-muted">제한 없음</span>
                  )}
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card title="Policy">
          <EmptyState
            title="보안 규칙이 설정되지 않았습니다"
            description="아래 Advanced 섹션에서 설정할 수 있습니다."
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="32"
                height="32"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />
        </Card>
      )}

      {/* MCP Audit Log */}
      <Card
        title="Audit Log"
        headerRight={
          <span className="text-[11px] text-content-muted">
            Last {audit.length} entries
          </span>
        }
      >
        {audit.length === 0 ? (
          <EmptyState
            title="No audit entries yet"
            description="AgentGuard가 AI 에이전트의 행동을 감시하면 여기에 기록됩니다."
          />
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="py-2 px-1.5 text-left text-content-muted font-medium border-b border-line">
                    Time
                  </th>
                  <th className="py-2 px-1.5 text-left text-content-muted font-medium border-b border-line">
                    Tool
                  </th>
                  <th className="py-2 px-1.5 text-left text-content-muted font-medium border-b border-line">
                    Decision
                  </th>
                  <th className="py-2 px-1.5 text-left text-content-muted font-medium border-b border-line">
                    Rule
                  </th>
                  <th className="py-2 px-1.5 text-left text-content-muted font-medium border-b border-line">
                    Agent
                  </th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr key={i}>
                    <td className="py-1.5 px-1.5 border-b border-line text-content-muted whitespace-nowrap">
                      {e.ts
                        ? new Date(e.ts).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="py-1.5 px-1.5 border-b border-line font-medium">
                      {e.tool || e.method}
                    </td>
                    <td className="py-1.5 px-1.5 border-b border-line">
                      <Badge
                        variant={
                          e.decision === "pass"
                            ? "approved"
                            : e.decision === "block"
                              ? "denied"
                              : "pending"
                        }
                      >
                        {e.decision}
                      </Badge>
                    </td>
                    <td className="py-1.5 px-1.5 border-b border-line text-content-secondary text-[11px]">
                      {e.rule || "-"}
                    </td>
                    <td className="py-1.5 px-1.5 border-b border-line text-content-muted text-[11px]">
                      {e.agent || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Advanced: Policy Editor — collapsed by default at the bottom */}
      <div className="mt-2">
        <button
          className="flex items-center gap-2 w-full py-3 px-4 rounded border border-line bg-surface-card text-content-muted text-xs font-medium cursor-pointer transition-all hover:border-line-hover hover:text-content-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Advanced: Policy Editor
        </button>

        {showAdvanced && (
          <div className="mt-2">
            <Card
              title="Policy Editor"
              headerRight={
                policy && (
                  <span className="text-[11px] text-content-muted">
                    {policy.exists
                      ? policy.path
                      : "No policy file — will be created on save"}
                  </span>
                )
              }
            >
              <div className="py-3 px-4 bg-accent/10 border border-accent/20 rounded-sm mb-4 text-xs text-content-primary leading-relaxed">
                <strong>보안 규칙 설정:</strong> AI가 실행할 수 없는 위험한
                명령어(예: bash)나 접근할 수 없는 폴더(예: /etc)를 설정합니다. 잘
                모를 경우 기본값을 그대로 유지하는 것이 안전합니다.
              </div>

              {/* Template Selection */}
              <div className="template-grid">
                {POLICY_TEMPLATES.map((t) => {
                  const selected = activeTemplateId === t.id;
                  const c = colorMap[t.color];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`template-card ${selected ? `template-card--selected ${c.border}` : ""}`}
                      onClick={() => applyTemplate(t)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${c.dot}`} />
                        <span className={`text-xs font-semibold ${selected ? c.text : "text-content-primary"}`}>
                          {t.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-content-muted leading-snug">
                        {t.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <textarea
                className="w-full min-h-[220px] font-mono text-xs leading-relaxed resize-y mb-3 py-2 px-2.5 bg-[#121212] border border-line rounded-sm text-content-primary outline-none transition-colors focus:border-accent focus-visible:ring-2 focus-visible:ring-accent"
                value={policyText}
                onChange={(e) => onPolicyTextChange(e.target.value)}
                placeholder={`{\n  "version": "1",\n  "default": {\n    "denied_tools": ["bash", "write_*"],\n    "denied_paths": ["/etc/*", "~/.ssh/*"],\n    "mode": "enforce"\n  }\n}`}
                spellCheck={false}
                aria-label="MCP policy JSON editor"
              />
              <button
                className={`${btnPrimary} ${savingPolicy ? "btn-loading" : ""}`}
                onClick={onSavePolicy}
                disabled={savingPolicy}
              >
                Save Policy
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
