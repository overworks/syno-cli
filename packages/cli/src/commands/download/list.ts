import { Command } from "commander";
import { listTasks } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, intArg, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";
import { bytes, pctOf } from "../../format.js";

interface DownloadListOptions extends ConnectionOptions {
  json?: boolean;
  limit?: number;
  offset?: number;
}

export function downloadListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List Download Station tasks")
    .option("--limit <n>", "Max tasks per page", intArg("--limit"))
    .option("--offset <n>", "Offset for paging", intArg("--offset"))
    .action(async (opts: DownloadListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listTasks(client, {
        limit: opts.limit,
        offset: opts.offset,
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
          progress: pctOf(t.additional?.transfer?.size_downloaded, t.size),
          size: bytes(t.size),
          down: `${bytes(t.additional?.transfer?.speed_download)}/s`,
          up: `${bytes(t.additional?.transfer?.speed_upload)}/s`,
          title: t.title,
        })),
        ["id", "status", "progress", "size", "down", "up", "title"],
      );
    });
}
