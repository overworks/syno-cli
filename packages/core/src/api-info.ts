import type { SynoClient } from "./client.js";
import type { SynoApiInfoMap } from "./types.js";

export async function queryApiInfo(client: SynoClient, query: string = "all"): Promise<SynoApiInfoMap> {
  const data = await client.request<SynoApiInfoMap>({
    api: "SYNO.API.Info",
    version: 1,
    method: "query",
    params: { query },
  });
  if (query === "all") client.setApiInfoCache(data);
  return data;
}
