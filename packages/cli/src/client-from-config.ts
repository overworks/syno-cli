import { SynoClient } from "@overworks/syno-core";
import { loadConfig } from "./config.js";

export async function clientFromConfig(hostOverride?: string): Promise<{
  client: SynoClient;
  configured: boolean;
}> {
  const cfg = await loadConfig();
  const host = hostOverride ?? cfg?.host;
  if (!host) {
    throw new Error(
      "No host configured. Run `syno login --host <url>` first, or pass --host.",
    );
  }
  return {
    client: new SynoClient({ baseUrl: host, sid: cfg?.sid }),
    configured: Boolean(cfg),
  };
}
