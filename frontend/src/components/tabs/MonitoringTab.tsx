import type { ProxyStats } from "../../types";
import { Card } from "../shared/Card";
import { StatBox } from "../shared/StatBox";
import { PageHeader } from "../shared/PageHeader";
import { LoadingSpinner } from "../shared/LoadingSpinner";
import { EmptyState } from "../shared/EmptyState";

interface MonitoringTabProps {
  stats: ProxyStats | null;
  timeSince: string;
  blockRateNum: number;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function MonitoringTab({
  stats,
  timeSince,
  blockRateNum,
  loading,
  error,
  onRefresh,
}: MonitoringTabProps) {
  return (
    <div className="tab-content">
      <PageHeader title="Monitoring">
        <span className="page-header updated-text">{timeSince}</span>
        <button className="btn" onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      {loading && !stats && <LoadingSpinner />}
      {error && !stats && <EmptyState message={error} variant="error" action={{ label: "Retry", onClick: onRefresh }} />}

      {stats && (
        <>
          {/* Proxy Stats */}
          <Card title="Proxy Stats">
            <div className="stats-grid">
              <StatBox label="Total" value={stats.totalRequests} />
              <StatBox label="Blocked" value={stats.blockedRequests} colorClass="danger" />
              <StatBox label="Allowed" value={stats.allowedRequests} colorClass="success" />
              <StatBox label="Stage 1" value={stats.stage1Blocked} />
              <StatBox label="Stage 2" value={stats.stage2Blocked} />
              <StatBox label="Gate Errors" value={stats.gateErrors} colorClass="warning" />
              <StatBox label="Uptime" value={stats.uptime} />
              <div className="progress-container">
                <span className="stat-label stat-label--inline">Block Rate</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${blockRateNum}%` }} />
                </div>
                <span className="progress-value">{stats.blockRate ?? "-"}</span>
              </div>
            </div>
          </Card>

          {/* LLM Gateway */}
          <Card title="LLM Gateway">
            <div className="stats-grid">
              <StatBox label="Total" value={stats.llmGateway?.total ?? "-"} />
              <StatBox label="Flagged" value={stats.llmGateway?.flagged ?? "-"} colorClass="danger" />
              <StatBox label="Blocked" value={stats.llmGateway?.blocked ?? "-"} colorClass="danger" />
              <StatBox label="PII Sanitized" value={stats.llmGateway?.piiSanitized ?? "-"} />
              <StatBox label="Confirmed" value={stats.llmGateway?.confirmed ?? "-"} colorClass="success" />
            </div>
          </Card>

          {/* System */}
          <Card title="System">
            <div className="stats-grid">
              <StatBox
                label="Evaluator"
                value={stats.evaluatorEnabled ? "Enabled" : "Disabled"}
                variant="info"
              />
              <StatBox label="Version" value={stats.version ?? "-"} variant="info" />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
