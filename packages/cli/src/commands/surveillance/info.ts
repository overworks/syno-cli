import { Command } from "commander";
import { getInfo } from "@overworks/syno-surveillance";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface SurveillanceInfoOptions {
  host?: string;
  profile?: string;
  json?: boolean;
}

export function surveillanceInfoCommand(): Command {
  return new Command("info")
    .description("Show Surveillance Station version and capacity")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: SurveillanceInfoOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const info = await getInfo(client);
      if (opts.json) {
        printJson(info);
        return;
      }
      const v = info.version;
      const rows = [
        { field: "version", value: v ? [v.major, v.minor, v.build].filter((n) => n !== undefined).join(".") : "" },
        { field: "cameras", value: info.cameraNumber === undefined ? "" : String(info.cameraNumber) },
        { field: "max cameras", value: info.maxCameraSupport === undefined ? "" : String(info.maxCameraSupport) },
      ].filter((r) => r.value !== "");
      printTable(rows, ["field", "value"]);
    });
}
