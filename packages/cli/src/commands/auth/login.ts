import { Command } from "commander";
import { SynoApiError, SynoClient, login } from "@overworks/syno-core";
import { getProfile, upsertProfile } from "../../config.js";
import { resolveProfileName } from "../../client-from-config.js";
import { promptLine, promptPassword, readLineFromStdin } from "../../prompt.js";

interface LoginOptions {
  profile?: string;
  host?: string;
  account?: string;
  password?: string;
  passwordStdin?: boolean;
  otp?: string;
}

const CODE_OTP_REQUIRED = 403;

async function ask(value: string | undefined, question: string, flag: string): Promise<string> {
  if (value !== undefined && value !== "") return value;
  if (!process.stdin.isTTY) {
    throw new Error(`${flag} is required when stdin is not a terminal.`);
  }
  const answer = await promptLine(question);
  if (!answer) throw new Error(`${flag} is required.`);
  return answer;
}

export function authLoginCommand(): Command {
  return new Command("login")
    .description("Authenticate against a Synology DSM and store the session locally")
    .option("--profile <name>", 'Profile name to store the session under (default: $SYNO_PROFILE or "default")')
    .option("--host <url>", "DSM base URL, e.g. https://nas.example:5001 (default: the profile's stored host)")
    .option("--account <name>", "Account name (default: the profile's stored account)")
    .option("--password <pw>", "Account password (omit to prompt; visible in shell history and `ps`)")
    .option("--password-stdin", "Read the password from the first line of stdin")
    .option("--otp <code>", "2-step verification code (prompted if the DSM asks for one)")
    .action(async (opts: LoginOptions) => {
      const profileName = resolveProfileName(opts.profile) ?? "default";
      const existing = (await getProfile(profileName))?.profile;

      const host = await ask(opts.host ?? existing?.host, "DSM URL: ", "--host");
      const account = await ask(opts.account ?? existing?.account, "Account: ", "--account");

      let password: string;
      if (opts.password !== undefined) password = opts.password;
      else if (opts.passwordStdin) password = await readLineFromStdin();
      else if (process.env["SYNO_PASSWORD"]) password = process.env["SYNO_PASSWORD"];
      else password = await promptPassword(`Password for ${account}@${host}: `);

      // Validates the URL up front (throws a clear error on a scheme-less host).
      const client = new SynoClient({ baseUrl: host });

      let otpCode = opts.otp;
      let result;
      try {
        result = await login(client, { account, passwd: password, otpCode });
      } catch (err) {
        const otpNeeded =
          err instanceof SynoApiError && err.code === CODE_OTP_REQUIRED && !otpCode && process.stdin.isTTY;
        if (!otpNeeded) throw err;
        otpCode = await promptLine("2-step verification code: ");
        result = await login(client, { account, passwd: password, otpCode });
      }

      await upsertProfile(profileName, {
        host: client.baseUrl,
        account,
        sid: result.sid,
        savedAt: new Date().toISOString(),
      });
      process.stdout.write(`Logged in as ${account} on ${client.baseUrl} (profile: ${profileName})\n`);
    });
}
