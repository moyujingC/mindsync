export interface ApiDebugTraceEntry {
  id: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  phase: "pending" | "success" | "error";
  method: string;
  url: string;
  requestSummary?: unknown;
  responseSummary?: unknown;
  errorMessage?: string;
  statusCode?: number;
}

type ApiDebugTraceListener = (entries: ApiDebugTraceEntry[]) => void;

const MAX_TRACE_ENTRIES = 40;
const apiDebugTraceEntries: ApiDebugTraceEntry[] = [];
const apiDebugTraceListeners = new Set<ApiDebugTraceListener>();

export function pushApiDebugTrace(entry: ApiDebugTraceEntry): void {
  apiDebugTraceEntries.unshift(entry);
  if (apiDebugTraceEntries.length > MAX_TRACE_ENTRIES) {
    apiDebugTraceEntries.length = MAX_TRACE_ENTRIES;
  }

  for (const listener of apiDebugTraceListeners) {
    listener([...apiDebugTraceEntries]);
  }
}

export function subscribeApiDebugTrace(
  listener: ApiDebugTraceListener,
): () => void {
  apiDebugTraceListeners.add(listener);
  listener([...apiDebugTraceEntries]);

  return () => {
    apiDebugTraceListeners.delete(listener);
  };
}

export function clearApiDebugTrace(): void {
  apiDebugTraceEntries.length = 0;
  for (const listener of apiDebugTraceListeners) {
    listener([]);
  }
}
