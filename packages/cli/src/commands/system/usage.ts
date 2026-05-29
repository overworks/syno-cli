import { Command } from "commander";
import { getUtilization } from "@overworks/syno-system";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";
import { bytes } from "./format.js";

interface SystemUsageOptions {
  host?: string;
  profile?: string;
  json?: boolean;
}

function sum(...vals: Array<number | undefined>): number | undefined {
  const present = vals.filter((v): v is number => typeof v === "number");
  if (present.length === 0) return undefined;
  return present.reduce((a, b) => a + b, 0);
}

function pct(n: number | undefined): string {
  return n === undefined ? "" : `${n}%`;
}

export function systemUsageCommand(): Command {
  return new Command("usage")
    .description("Show real-time CPU, memory, network, and disk utilization")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: SystemUsageOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const u = await getUtilization(client);
      if (opts.json) {
        printJson(u);
        return;
      }
      const net = u.network?.find((n) => n.device === "total");
      const rows = [
        {
          metric: "cpu",
          value: pct(sum(u.cpu?.user_load, u.cpu?.system_load, u.cpu?.other_load)),
        },
        { metric: "memory", value: pct(u.memory?.real_usage) },
        { metric: "swap", value: pct(u.memory?.swap_usage) },
        { metric: "disk", value: pct(u.disk?.total?.utilization) },
        { metric: "net rx", value: net ? `${bytes(net.rx)}/s` : "" },
        { metric: "net tx", value: net ? `${bytes(net.tx)}/s` : "" },
      ].filter((r) => r.value !== "");
      printTable(rows, ["metric", "value"]);
    });
}
