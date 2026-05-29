import { Command } from "commander";
import { SynoApiError, SynoClient, logout } from "@overworks/syno-core";
import { deleteConfig, listProfiles, loadConfig, removeProfile, type SynoProfile } from "../../config.js";

interface LogoutOptions {
  profile?: string;
  all?: boolean;
}

async function tryRemoteLogout(profile: SynoProfile): Promise<void> {
  try {
    const client = new SynoClient({ baseUrl: profile.host, sid: profile.sid });
    await logout(client);
  } catch (err) {
    if (err instanceof SynoApiError && err.isSessionExpired) return;
    throw err;
  }
}

export function authLogoutCommand(): Command {
  return new Command("logout")
    .description("Invalidate the stored session(s) and remove the local profile(s)")
    .option("--profile <name>", "Profile to log out (default: current)")
    .option("--all", "Log out every stored profile and remove the local config")
    .action(async (opts: LogoutOptions) => {
      if (opts.all) {
        const profiles = await listProfiles();
        for (const { profile } of profiles) {
          try {
            await tryRemoteLogout(profile);
          } catch {
            // best-effort
          }
        }
        await deleteConfig();
        process.stdout.write(`Logged out ${profiles.length} profile(s).\n`);
        return;
      }

      const cfg = await loadConfig();
      if (!cfg) {
        process.stdout.write("No profiles configured.\n");
        return;
      }
      const target = opts.profile ?? cfg.current;
      const profile = cfg.profiles[target];
      if (!profile) {
        throw new Error(`Profile "${target}" not found.`);
      }
      try {
        await tryRemoteLogout(profile);
      } catch {
        // best-effort: still drop the local record
      }
      await removeProfile(target);
      process.stdout.write(`Logged out profile "${target}".\n`);
    });
}
