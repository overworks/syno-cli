import type { SynoClient } from "@overworks/syno-core";
import type { StorageInfo, SystemInfo, Utilization } from "./types.js";

/** Box identity + health: model, firmware, uptime, temperature. */
export async function getSystemInfo(client: SynoClient): Promise<SystemInfo> {
  return client.request<SystemInfo>({
    api: "SYNO.Core.System",
    version: 1,
    method: "info",
  });
}

/** Real-time CPU / memory / network / disk utilization snapshot. */
export async function getUtilization(client: SynoClient): Promise<Utilization> {
  return client.request<Utilization>({
    api: "SYNO.Core.System.Utilization",
    version: 1,
    method: "get",
  });
}

/** Volumes, disks, and storage pools with capacity + health. */
export async function getStorageInfo(client: SynoClient): Promise<StorageInfo> {
  return client.request<StorageInfo>({
    api: "SYNO.Storage.CGI.Storage",
    version: 1,
    method: "load_info",
  });
}
