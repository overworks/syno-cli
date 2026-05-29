import { Command } from "commander";
import { getStorageInfo } from "@overworks/syno-system";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";
import { bytes, pctOf } from "./format.js";

interface SystemStorageOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  disks?: boolean;
}

export function systemStorageCommand(): Command {
  return new Command("storage")
    .description("Show volumes and disks (capacity, health)")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--disks", "List physical disks instead of volumes")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: SystemStorageOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const info = await getStorageInfo(client);
      if (opts.json) {
        printJson(info);
        return;
      }
      if (opts.disks) {
        printTable(
          (info.disks ?? []).map((d) => ({
            name: d.name ?? d.id ?? "",
            model: d.model ?? "",
            size: bytes(d.size_total),
            temp: d.temp === undefined ? "" : `${d.temp}°C`,
            status: d.status ?? "",
            smart: d.smart_status ?? "",
          })),
          ["name", "model", "size", "temp", "status", "smart"],
        );
        return;
      }
      printTable(
        (info.volumes ?? []).map((v) => ({
          volume: v.display_name ?? v.id ?? "",
          fs: v.fs_type ?? "",
          raid: v.device_type ?? "",
          used: bytes(v.size?.used),
          total: bytes(v.size?.total),
          usage: pctOf(v.size?.used, v.size?.total),
          status: v.status ?? "",
        })),
        ["volume", "fs", "raid", "used", "total", "usage", "status"],
      );
    });
}
