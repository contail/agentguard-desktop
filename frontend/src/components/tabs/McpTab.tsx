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
  return (
    <div className="tab-content">
      <PageHeader title="MCP Security Gateway">
        <button className="btn" onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      {/* MCP Clients */}
      <Card title="MCP Clients">
        {clients.length === 0 ? (
          <EmptyState message="No MCP clients discovered" />
        ) : (
          clients.map((c) => (
            <ListItemCard
              key={c.name}
              badge={
                <Badge variant={!c.installed ? "denied" : c.wrapped ? "approved" : "pending"}>
                  {!c.installed ? "not found" : c.wrapped ? "protected" : "unprotected"}
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
                      Unwrap
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

      {/* MCP Policy Editor */}
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
        <textarea
          className="form-input policy-editor"
          value={policyText}
          onChange={(e) => onPolicyTextChange(e.target.value)}
          placeholder={`{\n  "version": "1",\n  "default": {\n    "denied_tools": ["bash", "write_*"],\n    "denied_paths": ["/etc/*", "~/.ssh/*"],\n    "mode": "enforce"\n  }\n}`}
          spellCheck={false}
          aria-label="MCP policy JSON editor"
        />
        <button
          className={`btn btn-primary ${savingPolicy ? "btn--loading" : ""}`}
          onClick={onSavePolicy}
          disabled={savingPolicy}
        >
          Save Policy
        </button>
      </Card>

      {/* MCP Audit Log */}
      <Card
        title="Audit Log"
        headerRight={<span className="card-header__hint">Last {audit.length} entries</span>}
      >
        {audit.length === 0 ? (
          <EmptyState message="No audit entries yet" />
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
