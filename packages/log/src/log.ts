import type { SynoClient } from "@overworks/syno-core";
import type { LogListPage, LogStatus, ListLogsOptions } from "./types.js";

// SYNO.Core.SyslogClient.* API versions/method names vary by DSM release.
// Centralized so they're easy to bump after checking
// `syno api list --query SyslogClient` (maxVersion) on a live DSM.
const LOG_VER = 1;
const STATUS_VER = 1;

/** Query the DSM system log (login / connection / file-transfer / system events). */
export async function listLogs(
  client: SynoClient,
  opts: ListLogsOptions = {},
): Promise<LogListPage> {
  return client.request<LogListPage>({
    api: "SYNO.Core.SyslogClient.Log",
    version: LOG_VER,
    method: "list",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      level: opts.level,
      keyword: opts.keyword,
      logtype: opts.logType,
      datefrom: opts.fromTime,
      dateto: opts.toTime,
    },
  });
}

/** Stored-log count + events-per-second summary. */
export async function getStatus(client: SynoClient): Promise<LogStatus> {
  return client.request<LogStatus>({
    api: "SYNO.Core.SyslogClient.Status",
    version: STATUS_VER,
    method: "get",
  });
}
