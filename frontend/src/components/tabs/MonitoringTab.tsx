import type { ProxyStats } from "../../types";
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
  daemonState: string;
  onRefresh: () => void;
}

/* Reusable tiny SVG icons */
const Icons = {
  activity: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12h4l3-9 4 18 3-9h4" />
    </svg>
  ),
  shield: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  slash: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  layers: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  alertTriangle: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  fingerprint: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 10v4" />
      <path d="M9 12a3 3 0 016 0" />
      <path d="M7 10a5 5 0 0110 0v2a5 5 0 01-10 0v-2z" />
      <path d="M5 8a7 7 0 0114 0v4a7 7 0 01-14 0V8z" />
    </svg>
  ),
};

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary no-drag";

export function MonitoringTab({
  stats,
  timeSince,
  blockRateNum,
  loading,
  error,
  daemonState,
  onRefresh,
}: MonitoringTabProps) {
  /* Daemon is offline → show hero empty state */
  if (daemonState !== "running") {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Dashboard"
          description="AgentGuard가 차단하거나 허용한 전체 보안 통계를 한눈에 확인합니다."
        />
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
          <svg
            className="w-12 h-12 text-content-muted mb-5 opacity-50"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div className="text-base font-semibold text-content-secondary mb-2">
            AgentGuard가 오프라인입니다
          </div>
          <div className="text-[13px] text-content-muted max-w-xs leading-relaxed">
            좌측 하단의 [Start] 버튼을 눌러 AI 에이전트 보호를 시작하세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="AgentGuard가 차단하거나 허용한 전체 보안 통계를 한눈에 확인합니다."
      >
        <span className="text-[11px] text-content-muted">{timeSince}</span>
        <button className={btnBase} onClick={onRefresh}>
          Refresh
        </button>
      </PageHeader>

      {loading && !stats && <LoadingSpinner />}
      {error && !stats && (
        <EmptyState
          message={error}
          variant="error"
          action={{ label: "Retry", onClick: onRefresh }}
        />
      )}

      {stats && (
        <>
          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatBox
              label="Total Requests"
              value={stats.totalRequests}
              icon={Icons.activity}
              description="All intercepted traffic"
            />
            <StatBox
              label="Blocked"
              value={stats.blockedRequests}
              colorClass="danger"
              icon={Icons.slash}
              description="Malicious activity blocked"
            />
            <StatBox
              label="Allowed"
              value={stats.allowedRequests}
              colorClass="success"
              icon={Icons.check}
              description="Safe traffic passed"
            />
          </div>

          {/* Block Rate Progress */}
          <div className="col-span-full bg-white/[0.02] border border-line rounded-lg p-3.5 flex items-center gap-3.5 mb-8 mt-4">
            <span className="text-[10px] font-medium text-content-muted uppercase tracking-wide">
              Block Rate
            </span>
            <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-success via-warning to-danger rounded-full transition-all duration-[600ms]"
                style={{ width: `${blockRateNum}%` }}
              />
            </div>
            <span className="text-sm font-bold min-w-[45px] text-right">
              {stats.blockRate ?? "-"}
            </span>
          </div>

          <div className="text-[11px] font-semibold text-content-muted uppercase tracking-wide mb-3 mt-5">
            Detailed Metrics
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2.5">
            <StatBox
              label="Stage 1 Blocks"
              value={stats.stage1Blocked}
              icon={Icons.shield}
              description="Local pattern matched"
            />
            <StatBox
              label="Stage 2 Blocks"
              value={stats.stage2Blocked}
              icon={Icons.layers}
              description="Remote AI evaluation"
            />
            <StatBox
              label="PII Sanitized"
              value={stats.llmGateway?.piiSanitized ?? "-"}
              icon={Icons.fingerprint}
              description="Personal data hidden"
            />
            <StatBox
              label="Uptime"
              value={stats.uptime}
              icon={Icons.clock}
              description="Since last restart"
            />
          </div>
        </>
      )}
    </div>
  );
}
