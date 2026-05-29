import { Command } from "commander";
import { SynoApiError, logout } from "@overworks/syno-core";
import { clientFromConfig } from "../client-from-config.js";
import { deleteConfig } from "../config.js";

export function logoutCommand(): Command {
  return new Command("logout")
    .description("Invalidate the stored session and remove the local config")
    .action(async () => {
      try {
        const { client } = await clientFromConfig();
        await logout(client);
      } catch (err) {
        if (err instanceof SynoApiError && err.isSessionExpired) {
          // session already gone — fall through to delete config
        } else if (!(err instanceof Error) || !err.message.includes("No host configured")) {
          throw err;
        }
      }
      await deleteConfig();
      process.stdout.write("Logged out.\n");
    });
}
