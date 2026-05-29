import { Command } from "commander";
import { getSystemInfo } from "@overworks/syno-system";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface SystemInfoOptions {
  host?: string;
  profile?: string;
  json?: boolean;
}

export function systemInfoCommand(): Command {
  return new Command("info")
    .description("Show model, firmware, uptime, and temperature")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: SystemInfoOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const info = await getSystemInfo(client);
      if (opts.json) {
        printJson(info);
        return;
      }
      const rows = [
        { field: "model", value: info.model ?? "" },
        { field: "serial", value: info.serial ?? "" },
        { field: "firmware", value: [info.firmware_ver, info.firmware_date].filter(Boolean).join(" ") },
        { field: "uptime", value: info.up_time ?? "" },
        {
          field: "temperature",
          value:
            info.temperature === undefined
              ? ""
              : `${info.temperature}°C${info.temperature_warn ? " (WARN)" : ""}`,
        },
        { field: "cpu", value: [info.cpu_series, info.cpu_cores ? `${info.cpu_cores} cores` : ""].filter(Boolean).join(", ") },
        { field: "ram", value: info.ram_size ? `${info.ram_size} MB` : "" },
        { field: "time", value: info.time ?? "" },
        { field: "time_zone", value: info.time_zone_desc ?? info.time_zone ?? "" },
      ].filter((r) => r.value !== "");
      printTable(rows, ["field", "value"]);
    });
}
