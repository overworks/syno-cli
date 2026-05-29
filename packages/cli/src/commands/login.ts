import { Command } from "commander";
import { SynoClient, login } from "@overworks/syno-core";
import { saveConfig } from "../config.js";
import { promptLine, promptPassword } from "../prompt.js";

interface LoginOptions {
  host?: string;
  account?: string;
  password?: string;
  otp?: string;
}

export function loginCommand(): Command {
  return new Command("login")
    .description("Authenticate against a Synology DSM and store the session locally")
    .option("--host <url>", "DSM base URL, e.g. https://nas.example:5001")
    .option("--account <name>", "Account name")
    .option("--password <pw>", "Account password (omit to prompt)")
    .option("--otp <code>", "2-step verification code")
    .action(async (opts: LoginOptions) => {
      const host = opts.host ?? (await promptLine("DSM URL: "));
      const account = opts.account ?? (await promptLine("Account: "));
      const password = opts.password ?? (await promptPassword("Password: "));

      const client = new SynoClient({ baseUrl: host });
      const result = await login(client, {
        account,
        passwd: password,
        otpCode: opts.otp,
      });

      await saveConfig({
        host,
        account,
        sid: result.sid,
        savedAt: new Date().toISOString(),
      });
      process.stdout.write(`Logged in as ${account} on ${host}\n`);
    });
}
