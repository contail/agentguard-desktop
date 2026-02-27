import { useState, useEffect } from "react";

export function useTimeSince(timestamp: number): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timestamp) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timestamp]);

  if (!timestamp) return "";
  const seconds = Math.floor((now - timestamp) / 1000);
  return `Updated ${seconds}s ago`;
}
