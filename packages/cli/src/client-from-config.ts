import { SynoClient } from "@overworks/syno-core";
import { getProfile, loadConfig, type SynoProfile } from "./config.js";

export interface ClientFromConfigOptions {
  host?: string;
  profile?: string;
}

/**
 * Name of the profile resolved by the most recent {@link clientFromConfig}
 * call (or `undefined` if it ran against a bare `--host`). The CLI is a
 * single-shot process, so the error boundary in `index.ts` reads this to make
 * a session-expiry hint name the right profile.
 */
let activeProfileName: string | undefined;

export function activeProfile(): string | undefined {
  return activeProfileName;
}

/**
 * Profile selection precedence shared by every command: an explicit
 * `--profile` wins, then `$SYNO_PROFILE`, else `undefined` (= config `current`).
 */
export function resolveProfileName(explicit?: string): string | undefined {
  if (explicit) return explicit;
  const env = process.env["SYNO_PROFILE"]?.trim();
  return env ? env : undefined;
}

export async function clientFromConfig(opts: ClientFromConfigOptions = {}): Promise<{
  client: SynoClient;
  configured: boolean;
  profile?: { name: string; profile: SynoProfile };
}> {
  const selected = resolveProfileName(opts.profile);

  if (selected) {
    const found = await getProfile(selected);
    if (!found) {
      throw new Error(
        `Profile "${selected}" not found. Run \`syno auth list\` to see configured profiles.`,
      );
    }
    activeProfileName = found.name;
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
  activeProfileName = current?.profile ? current.name : undefined;
  return {
    client: new SynoClient({ baseUrl: host, sid: current?.profile?.sid }),
    configured: Boolean(cfg),
    profile: current?.profile ? { name: current.name, profile: current.profile } : undefined,
  };
}
