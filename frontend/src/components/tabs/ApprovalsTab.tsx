import type { Approval } from "../../types";
import { Card } from "../shared/Card";
import { PageHeader } from "../shared/PageHeader";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";
import { ListItemCard } from "../shared/ListItemCard";
import { Badge } from "../shared/Badge";

interface ApprovalsTabProps {
  approvals: Approval[];
  loading: boolean;
  error: string | null;
  onApproval: (id: string, action: string) => void;
  onRefresh: () => void;
}

function mapBadgeVariant(status: string): "pending" | "approved" | "denied" {
  if (status === "approved") return "approved";
  if (status === "denied") return "denied";
  return "pending";
}

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all no-drag focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
const btnDefault = `${btnBase} border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary`;
const btnSuccess = `${btnBase} border border-transparent bg-success-muted text-success hover:bg-success hover:text-white`;
const btnDanger = `${btnBase} border border-transparent bg-danger-muted text-danger hover:bg-danger hover:text-white`;

export function ApprovalsTab({
  approvals,
  loading,
  error,
  onApproval,
  onRefresh,
}: ApprovalsTabProps) {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Pending Actions"
        description="AI 에이전트가 위험한 명령이나 파일 삭제를 시도할 때, 여기서 안전한지 확인하고 승인할 수 있습니다."
      >
        <button className={btnDefault} onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      <Card title="Approval Queue">
        {loading && approvals.length === 0 && <LoadingSpinner />}
        {error && approvals.length === 0 && (
          <EmptyState
            message={error}
            variant="error"
            action={{ label: "Retry", onClick: onRefresh }}
          />
        )}
        {!loading && !error && approvals.length === 0 ? (
          <EmptyState
            title="All clear"
            description="현재 승인을 기다리는 보안 액션이 없습니다."
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
                className="text-success"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            }
          />
        ) : (
          approvals.map((a) => (
            <ListItemCard
              key={a.id}
              badge={
                <Badge variant={mapBadgeVariant(a.status)}>{a.status}</Badge>
              }
              title={a.tool_name}
              meta={
                <>
                  {a.matched_rule} &middot; {a.provider} &middot;{" "}
                  {a.created_at}
                </>
              }
              actions={
                a.status === "pending" ? (
                  <>
                    <button
                      className={btnSuccess}
                      onClick={() => onApproval(a.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className={btnDanger}
                      onClick={() => onApproval(a.id, "deny")}
                    >
                      Deny
                    </button>
                  </>
                ) : undefined
              }
            />
          ))
        )}
      </Card>
    </div>
  );
}
