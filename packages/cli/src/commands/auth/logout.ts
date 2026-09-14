import { Command } from "commander";
import { SynoApiError, SynoClient, logout } from "@overworks/syno-core";
import { deleteConfig, listProfiles, loadConfig, removeProfile, type SynoProfile } from "../../config.js";
import { resolveProfileName } from "../../client-from-config.js";

interface LogoutOptions {
  profile?: string;
  all?: boolean;
}

/**
 * Invalidate the sid on the DSM. An already-expired session counts as
 * success; anything else is reported (not thrown) so the caller can still
 * drop the local record while telling the user the sid may still be live.
 */
async function tryRemoteLogout(name: string, profile: SynoProfile): Promise<void> {
  try {
    const client = new SynoClient({ baseUrl: profile.host, sid: profile.sid });
    await logout(client);
  } catch (err) {
    if (err instanceof SynoApiError && err.isSessionExpired) return;
    const reason = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      `warning: could not invalidate the session for profile "${name}" on the DSM (${reason}); the local record is removed anyway.\n`,
    );
  }
}

export function authLogoutCommand(): Command {
  return new Command("logout")
    .description("Invalidate the stored session(s) and remove the local profile(s)")
    .option("--profile <name>", "Profile to log out (default: $SYNO_PROFILE or current)")
    .option("--all", "Log out every stored profile and remove the local config")
    .action(async (opts: LogoutOptions) => {
      if (opts.all) {
        if (opts.profile) throw new Error("--all and --profile are mutually exclusive.");
        const profiles = await listProfiles();
        for (const { name, profile } of profiles) {
          await tryRemoteLogout(name, profile);
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
      const target = resolveProfileName(opts.profile) ?? cfg.current;
      const profile = cfg.profiles[target];
      if (!profile) {
        throw new Error(`Profile "${target}" not found.`);
      }
      await tryRemoteLogout(target, profile);
      await removeProfile(target);
      process.stdout.write(`Logged out profile "${target}".\n`);
    });
}
