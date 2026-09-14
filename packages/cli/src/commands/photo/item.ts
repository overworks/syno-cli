import { Command } from "commander";
import { download, listItems } from "@overworks/syno-photo";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";
import { bytes } from "../../format.js";
import { type ConnectionOptions, intArg, saveResponse, withConnectionOptions, withJsonOption } from "../shared.js";

interface ItemListOptions extends ConnectionOptions {
  json?: boolean;
  album?: number;
  folder?: number;
  type?: "photo" | "video" | "live";
  limit?: number;
}

interface DownloadOptions extends ConnectionOptions {
  output?: string;
  force?: boolean;
}

export function photoListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List items (photos/videos), optionally within an album or folder")
    .option("--album <id>", "List items in this album", intArg("--album"))
    .option("--folder <id>", "List items in this folder", intArg("--folder"))
    .option("--type <kind>", "Filter by type: photo | video | live")
    .option("--limit <n>", "Max items to return", intArg("--limit"))
    .action(async (opts: ItemListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listItems(client, {
        albumId: opts.album,
        folderId: opts.folder,
        type: opts.type,
        limit: opts.limit,
      });
      if (opts.json) return printJson(page);
      printTable(
        page.items.map((it) => ({
          id: it.id ?? "",
          type: it.type ?? "",
          filename: it.filename ?? "",
          size: bytes(it.filesize),
        })),
        ["id", "type", "filename", "size"],
      );
    });
}

export function photoDownloadCommand(): Command {
  return withConnectionOptions(new Command("download"))
    .description("Download an item to local disk ('-' for stdout)")
    .argument("<itemId>", "Photo/video item ID", intArg("itemId"))
    .option("-o, --output <local>", "Local destination path (default: item-<id>, '-' for stdout)")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (itemId: number, opts: DownloadOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await download(client, { itemId });
      await saveResponse(res, opts.output ?? `item-${itemId}`, { force: opts.force });
    });
}
