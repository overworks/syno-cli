#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Command } from "commander";
import { SynoApiError, SynoHttpError } from "@overworks/syno-core";
import { activeProfile } from "./client-from-config.js";
import { sessionExpiryHint } from "./session-hint.js";
import { authCommand } from "./commands/auth/index.js";
import { apiCommand } from "./commands/api/list.js";
import { fileCommand } from "./commands/file/index.js";
import { downloadCommand } from "./commands/download/index.js";
import { systemCommand } from "./commands/system/index.js";
import { surveillanceCommand } from "./commands/surveillance/index.js";
import { photoCommand } from "./commands/photo/index.js";
import { audioCommand } from "./commands/audio/index.js";
import { logCommand } from "./commands/log/index.js";
import { completionCommand } from "./commands/completion.js";
import { runInteractive } from "./interactive.js";

// Read the version from package.json at runtime so it always matches the
// published version. `dist/index.js` sits next to package.json both in the
// repo (packages/cli/) and in the installed package, so `../package.json`
// resolves in dev (tsx on src/) and after build alike.
const { version } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("syno")
    .description("CLI for the Synology DSM Web API")
    .version(version)
    .action(async () => {
      await runInteractive();
    });

  program.addCommand(authCommand());
  program.addCommand(apiCommand());
  program.addCommand(fileCommand());
  program.addCommand(downloadCommand());
  program.addCommand(systemCommand());
  program.addCommand(surveillanceCommand());
  program.addCommand(photoCommand());
  program.addCommand(audioCommand());
  program.addCommand(logCommand());
  program.addCommand(completionCommand());

  await program.parseAsync(process.argv);
}

function describeCause(err: Error): string | undefined {
  const cause = (err as { cause?: unknown }).cause;
  if (!(cause instanceof Error)) return undefined;
  const code = (cause as NodeJS.ErrnoException).code;
  return code ? `${code}: ${cause.message}` : cause.message;
}

main().catch((err: unknown) => {
  if (err instanceof SynoApiError) {
    process.stderr.write(`${err.message}\n`);
    const hint = sessionExpiryHint(err, activeProfile());
    if (hint) process.stderr.write(`${hint}\n`);
    process.exit(1);
  }
  if (err instanceof Error) {
    process.stderr.write(`${err.message}\n`);
    // SynoHttpError already folds its cause into the message; for anything
    // else (e.g. a bare `fetch failed`), the cause carries the useful detail.
    const cause = err instanceof SynoHttpError ? undefined : describeCause(err);
    if (cause) process.stderr.write(`  caused by: ${cause}\n`);
    process.exit(1);
  }
  process.stderr.write(`Unknown error: ${String(err)}\n`);
  process.exit(1);
});
