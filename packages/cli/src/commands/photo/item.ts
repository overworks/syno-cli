import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Command } from "commander";
import { download, listItems } from "@overworks/syno-photo";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface ItemListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  album?: string;
  folder?: string;
  type?: "photo" | "video" | "live";
  limit?: string;
}

interface DownloadOptions {
  host?: string;
  profile?: string;
  output?: string;
  force?: boolean;
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

export function photoListCommand(): Command {
  return new Command("list")
    .description("List items (photos/videos), optionally within an album or folder")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--album <id>", "List items in this album")
    .option("--folder <id>", "List items in this folder")
    .option("--type <kind>", "Filter by type: photo | video | live")
    .option("--limit <n>", "Max items to return")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: ItemListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listItems(client, {
        albumId: opts.album ? Number(opts.album) : undefined,
        folderId: opts.folder ? Number(opts.folder) : undefined,
        type: opts.type,
        limit: opts.limit ? Number(opts.limit) : undefined,
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      const items = page.items ?? page.list ?? [];
      printTable(
        items.map((it) => ({
          id: it.id ?? "",
          type: it.type ?? it.item_type ?? "",
          filename: it.filename ?? "",
          size: bytes(it.filesize),
        })),
        ["id", "type", "filename", "size"],
      );
    });
}

export function photoDownloadCommand(): Command {
  return new Command("download")
    .description("Download an item to local disk ('-' for stdout)")
    .argument("<itemId>", "Photo/video item ID")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("-o, --output <local>", "Local destination path ('-' for stdout)")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (itemId: string, opts: DownloadOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await download(client, { itemId: Number(itemId) });
      if (!res.body) throw new Error("Empty response body");
      const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);

      const dest = opts.output ?? `item-${itemId}`;
      if (dest === "-") {
        await pipeline(nodeStream, process.stdout);
        return;
      }
      await pipeline(nodeStream, createWriteStream(dest, { flags: opts.force ? "w" : "wx" }));
      process.stderr.write(`Saved to ${dest}\n`);
    });
}
