import { Command } from "commander";
import { list, listShares } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface FileListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  limit?: string;
  offset?: string;
}

function toBytes(size: number | undefined): string {
  if (size === undefined) return "";
  const units = ["B", "K", "M", "G", "T"];
  let v = size;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

function toIso(mtime: number | undefined): string {
  if (!mtime) return "";
  return new Date(mtime * 1000).toISOString().replace("T", " ").slice(0, 19);
}

export function fileListCommand(): Command {
  return new Command("list")
    .description("List shared folders (no arg) or the contents of a directory")
    .argument("[path]", "Remote folder path; omit to list shares")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--json", "Emit JSON instead of a table")
    .option("--limit <n>", "Max entries per page")
    .option("--offset <n>", "Offset for paging")
    .action(async (path: string | undefined, opts: FileListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const limit = opts.limit ? Number(opts.limit) : undefined;
      const offset = opts.offset ? Number(opts.offset) : undefined;
      const additional = ["size", "time", "owner", "type"];

      if (!path) {
        const page = await listShares(client, { limit, offset, additional });
        if (opts.json) {
          printJson(page);
          return;
        }
        printTable(
          page.shares.map((s) => ({
            name: s.name,
            path: s.path,
            owner: s.additional?.owner?.user ?? "",
          })),
          ["name", "path", "owner"],
        );
        return;
      }

      const page = await list(client, path, { limit, offset, additional });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        page.files.map((f) => ({
          name: f.name,
          type: f.isdir ? "dir" : "file",
          size: toBytes(f.additional?.size),
          mtime: toIso(f.additional?.time?.mtime),
          owner: f.additional?.owner?.user ?? "",
        })),
        ["name", "type", "size", "mtime", "owner"],
      );
    });
}
