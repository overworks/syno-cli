import { Command } from "commander";
import { logListCommand } from "./list.js";
import { logStatusCommand } from "./status.js";

export function logCommand(): Command {
  return new Command("log")
    .description("Query the DSM system log (SYNO.Core.SyslogClient.*)")
    .addCommand(logListCommand())
    .addCommand(logStatusCommand());
}
