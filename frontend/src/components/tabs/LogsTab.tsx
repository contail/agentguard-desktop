import { useState, useEffect, useRef } from "react";
import { PageHeader } from "../shared/PageHeader";
import { EmptyState } from "../shared/EmptyState";

interface LogsTabProps {
  daemonState: string;
}

const btnBase =
  "inline-flex items-center gap-1.5 py-[7px] px-3.5 rounded-sm text-xs font-medium cursor-pointer transition-all border border-line bg-surface-card text-content-secondary hover:bg-surface-primary hover:border-line-hover hover:text-content-primary no-drag";

export function LogsTab({ daemonState }: LogsTabProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadLogs = async () => {
    try {
      const raw = await window.go.main.App.GetLogs(500);
      const data = JSON.parse(raw);
      if (Array.isArray(data.lines)) setLines(data.lines);
    } catch {}
  };

  useEffect(() => {
    loadLogs();
    const id = setInterval(loadLogs, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoScroll]);

  const filtered = filter
    ? lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase()))
    : lines;

  const colorize = (line: string) => {
    if (line.includes("[LLM-BLOCKED]") || line.includes("BLOCKED"))
      return "text-danger";
    if (line.includes("[LLM-MONITOR]") || line.includes("WARN"))
      return "text-warning";
    if (line.includes("[LLM-PASS]") || line.includes("PASS"))
      return "text-success";
    if (line.includes("[LLM-CONFIRM]")) return "text-accent";
    return "text-content-secondary";
  };

  if (daemonState !== "running") {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Logs" description="AgentGuard 데몬의 실시간 로그를 확인합니다." />
        <EmptyState
          title="AgentGuard가 오프라인입니다"
          description="좌측 하단의 [Start] 버튼을 눌러 데몬을 시작하세요."
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <PageHeader title="Logs" description="AgentGuard 데몬의 실시간 로그를 확인합니다.">
        <input
          className="py-1.5 px-2.5 bg-surface-input border border-line rounded-sm text-content-primary text-[12px] font-mono outline-none w-48 focus:border-accent"
          placeholder="Filter..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button
          className={`${btnBase} ${autoScroll ? "!bg-accent !text-white !border-accent" : ""}`}
          onClick={() => setAutoScroll(!autoScroll)}
        >
          Auto-scroll
        </button>
        <button className={btnBase} onClick={loadLogs}>
          Refresh
        </button>
      </PageHeader>

      <div className="flex-1 min-h-0 bg-black/20 border border-line rounded-lg overflow-y-auto font-mono text-[11px] leading-[1.6] p-3 scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-content-muted text-center py-10">No log entries</div>
        ) : (
          filtered.map((line, i) => (
            <div key={i} className={`${colorize(line)} whitespace-pre-wrap break-all`}>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
