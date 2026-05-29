/** One entry from `SYNO.Core.SyslogClient.Log`. DSM field names vary, so most are optional. */
export interface LogEntry {
  /** Event time — usually a formatted string (e.g. `"2026-05-29 10:21:34"`). */
  time?: string;
  /** Severity, e.g. `"Information"`, `"Warning"`, `"Error"`. */
  level?: string;
  /** User account associated with the event. */
  who?: string;
  /** Source IP/host, when present. */
  ip?: string;
  /** Human-readable description of the event. */
  descr?: string;
  [key: string]: unknown;
}

export interface LogListPage {
  items?: LogEntry[];
  total?: number;
}

export interface ListLogsOptions {
  offset?: number;
  limit?: number;
  /** Severity filter — DSM accepts `"all" | "info" | "warning" | "error"` (release-dependent). */
  level?: string;
  /** Free-text keyword filter. */
  keyword?: string;
  /** Log category, e.g. `"system"`, `"connection"`, `"fileTransfer"` (release-dependent). */
  logType?: string;
  /** Range start (unix epoch seconds). */
  fromTime?: number;
  /** Range end (unix epoch seconds). */
  toTime?: number;
}

/** `SYNO.Core.SyslogClient.Status` — log volume + throughput summary. */
export interface LogStatus {
  /** Total stored log count. */
  total?: number;
  /** Events per second. */
  eps?: number;
  [key: string]: unknown;
}
