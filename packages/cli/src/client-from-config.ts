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
  // Profile selection precedence: --profile > $SYNO_PROFILE > config `current`.
  const envProfile = process.env["SYNO_PROFILE"]?.trim();
  const selected = opts.profile ?? (envProfile ? envProfile : undefined);

  if (selected) {
    const found = await getProfile(selected);
    if (!found) {
      throw new Error(
        `Profile "${selected}" not found. Run \`syno auth list\` to see configured profiles.`,
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
