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

export function ApprovalsTab({
  approvals,
  loading,
  error,
  onApproval,
  onRefresh,
}: ApprovalsTabProps) {
  return (
    <div className="tab-content">
      <PageHeader title="Approvals">
        <button className="btn" onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      <Card title="Pending Approvals">
        {loading && approvals.length === 0 && <LoadingSpinner />}
        {error && approvals.length === 0 && (
          <EmptyState message={error} variant="error" action={{ label: "Retry", onClick: onRefresh }} />
        )}
        {!loading && !error && approvals.length === 0 ? (
          <EmptyState message="No pending approvals" />
        ) : (
          approvals.map((a) => (
            <ListItemCard
              key={a.id}
              badge={<Badge variant={mapBadgeVariant(a.status)}>{a.status}</Badge>}
              title={a.tool_name}
              meta={
                <>
                  {a.matched_rule} &middot; {a.provider} &middot; {a.created_at}
                </>
              }
              actions={
                a.status === "pending" ? (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => onApproval(a.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      className="btn btn-danger"
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
