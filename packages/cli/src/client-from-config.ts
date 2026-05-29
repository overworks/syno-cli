import { SynoClient } from "@overworks/syno-core";
import { getProfile, loadConfig, type SynoProfile } from "./config.js";

export interface ClientFromConfigOptions {
  host?: string;
  profile?: string;
}

export async function clientFromConfig(opts: ClientFromConfigOptions = {}): Promise<{
  client: SynoClient;
  configured: boolean;
  profile?: { name: string; profile: SynoProfile };
}> {
  if (opts.profile) {
    const found = await getProfile(opts.profile);
    if (!found) {
      throw new Error(
        `Profile "${opts.profile}" not found. Run \`syno auth list\` to see configured profiles.`,
      );
    }
    const host = opts.host ?? found.profile.host;
    return {
      client: new SynoClient({ baseUrl: host, sid: found.profile.sid }),
      configured: true,
      profile: found,
    };
  }

  const cfg = await loadConfig();
  const current = cfg ? { name: cfg.current, profile: cfg.profiles[cfg.current] } : undefined;
  const host = opts.host ?? current?.profile?.host;
  if (!host) {
    throw new Error(
      "No host configured. Run `syno auth login --host <url>` first, or pass --host.",
    );
  }
  return {
    client: new SynoClient({ baseUrl: host, sid: current?.profile?.sid }),
    configured: Boolean(cfg),
    profile: current?.profile ? { name: current.name, profile: current.profile } : undefined,
  };
}
