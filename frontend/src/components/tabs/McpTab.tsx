import { useState } from "react";
import type { MCPClient, MCPPolicyData, MCPAuditEntry } from "../../types";
import { Card } from "../shared/Card";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";
import { ListItemCard } from "../shared/ListItemCard";
import { Badge } from "../shared/Badge";

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

  return (
    <div className="tab-content">
      <PageHeader
        title="IDE Protection"
        description="Cursor, VS Code 등 AI 코딩 에디터가 내 컴퓨터를 마음대로 조작하지 못하도록 방어하고 감사 로그를 기록합니다."
      >
        <button className="btn" onClick={onRefresh}>
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
                <Badge variant={!c.installed ? "denied" : c.wrapped ? "approved" : "pending"}>
                  {!c.installed ? "not found" : c.wrapped ? "Protected" : "Unprotected"}
                </Badge>
              }
              title={c.label}
              meta={
                <>
                  {c.servers} server{c.servers !== 1 ? "s" : ""}
                  {c.wrappedCount ? ` (${c.wrappedCount} wrapped)` : ""} &middot; {c.configPath}
                </>
              }
              actions={
                c.installed && c.servers > 0 ? (
                  c.wrapped ? (
                    <button className="btn btn-danger" onClick={() => onUnwrapClient(c.name)}>
                      Remove
                    </button>
                  ) : (
                    <button className="btn btn-success" onClick={() => onWrapClient(c.name)}>
                      Protect
                    </button>
                  )
                ) : undefined
              }
            />
          ))
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
        <button
          className="btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            background: "transparent",
            border: "1px dashed var(--border)",
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
        </button>
      </div>

      {showAdvanced && (
        <Card
          title="Policy Editor"
          headerRight={
            policy && (
              <span className="card-header__hint">
                {policy.exists ? policy.path : "No policy file — will be created on save"}
              </span>
            )
          }
        >
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(96, 165, 250, 0.1)",
              border: "1px solid rgba(96, 165, 250, 0.2)",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "var(--text-primary)",
              lineHeight: "1.5",
            }}
          >
            💡 <strong>보안 규칙 설정:</strong> AI가 실행할 수 없는 위험한 명령어(예: bash)나 접근할
            수 없는 폴더(예: /etc)를 설정합니다. 잘 모를 경우 기본값을 그대로 유지하는 것이
            안전합니다.
          </div>
          <textarea
            className="form-input policy-editor"
            value={policyText}
            onChange={(e) => onPolicyTextChange(e.target.value)}
            placeholder={`{\n  "version": "1",\n  "default": {\n    "denied_tools": ["bash", "write_*"],\n    "denied_paths": ["/etc/*", "~/.ssh/*"],\n    "mode": "enforce"\n  }\n}`}
            spellCheck={false}
            aria-label="MCP policy JSON editor"
            style={{ backgroundColor: "#121212" }}
          />
          <button
            className={`btn btn-primary ${savingPolicy ? "btn--loading" : ""}`}
            onClick={onSavePolicy}
            disabled={savingPolicy}
          >
            Save Policy
          </button>
        </Card>
      )}

      {/* MCP Audit Log */}
      <Card
        title="Audit Log"
        headerRight={<span className="card-header__hint">Last {audit.length} entries</span>}
      >
        {audit.length === 0 ? (
          <EmptyState
            title="No audit entries yet"
            description="AgentGuard가 AI 에이전트의 행동을 감시하면 여기에 기록됩니다."
          />
        ) : (
          <div className="audit-scroll">
            <table className="audit-table">
              <thead>
                <tr>
                  <th className="audit-th" scope="col">
                    Time
                  </th>
                  <th className="audit-th" scope="col">
                    Tool
                  </th>
                  <th className="audit-th" scope="col">
                    Decision
                  </th>
                  <th className="audit-th" scope="col">
                    Rule
                  </th>
                  <th className="audit-th" scope="col">
                    Agent
                  </th>
                </tr>
              </thead>
              <tbody>
                {audit.map((e, i) => (
                  <tr key={i}>
                    <td className="audit-td audit-td--time">
                      {e.ts ? new Date(e.ts).toLocaleTimeString() : "-"}
                    </td>
                    <td className="audit-td audit-td--tool">{e.tool || e.method}</td>
                    <td className="audit-td">
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
                    <td className="audit-td audit-td--rule">{e.rule || "-"}</td>
                    <td className="audit-td audit-td--agent">{e.agent || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
