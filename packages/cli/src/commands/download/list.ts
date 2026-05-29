import { Command } from "commander";
import { listTasks } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface DownloadListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  limit?: string;
  offset?: string;
}

function bytes(n: number | undefined): string {
  if (!n && n !== 0) return "";
  const units = ["B", "K", "M", "G", "T"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

function pct(downloaded: number | undefined, total: number): string {
  if (!total || downloaded === undefined) return "";
  return `${((downloaded / total) * 100).toFixed(1)}%`;
}

export function downloadListCommand(): Command {
  return new Command("list")
    .description("List Download Station tasks")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .option("--limit <n>", "Max tasks per page")
    .option("--offset <n>", "Offset for paging")
    .action(async (opts: DownloadListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listTasks(client, {
        limit: opts.limit ? Number(opts.limit) : undefined,
        offset: opts.offset ? Number(opts.offset) : undefined,
        additional: ["transfer"],
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        page.tasks.map((t) => ({
          id: t.id,
          status: t.status,
          progress: pct(t.additional?.transfer?.size_downloaded, t.size),
          size: bytes(t.size),
          down: `${bytes(t.additional?.transfer?.speed_download)}/s`,
          up: `${bytes(t.additional?.transfer?.speed_upload)}/s`,
          title: t.title,
        })),
        ["id", "status", "progress", "size", "down", "up", "title"],
      );
    });
}
