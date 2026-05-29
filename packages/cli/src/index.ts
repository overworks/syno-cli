#!/usr/bin/env node
import { Command } from "commander";
import { SynoApiError } from "@syno-cli/core";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { apiCommand } from "./commands/api/list.js";
import { fileCommand } from "./commands/file/index.js";
import { downloadCommand } from "./commands/download/index.js";
import { runInteractive } from "./interactive.js";

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("syno")
    .description("CLI for the Synology DSM Web API")
    .version("0.0.0")
    .action(async () => {
      await runInteractive();
    });

  program.addCommand(loginCommand());
  program.addCommand(logoutCommand());
  program.addCommand(apiCommand());
  program.addCommand(fileCommand());
  program.addCommand(downloadCommand());

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  if (err instanceof SynoApiError) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
  if (err instanceof Error) {
    process.stderr.write(`${err.message}\n`);
    process.exit(1);
  }
  process.stderr.write(`Unknown error: ${String(err)}\n`);
  process.exit(1);
});
