import { Command } from "commander";
import { listAlbums } from "@overworks/syno-photo";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface AlbumListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  limit?: string;
}

function albumListCommand(): Command {
  return new Command("list")
    .description("List albums (Personal Space)")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--limit <n>", "Max albums to return")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: AlbumListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listAlbums(client, { limit: opts.limit ? Number(opts.limit) : undefined });
      if (opts.json) {
        printJson(page);
        return;
      }
      const albums = page.list ?? page.albums ?? [];
      printTable(
        albums.map((a) => ({
          id: a.id ?? "",
          name: a.name ?? "",
          items: a.item_count ?? "",
          shared: a.shared ? "yes" : "",
        })),
        ["id", "name", "items", "shared"],
      );
    });
}

export function photoAlbumCommand(): Command {
  return new Command("album")
    .description("Synology Photos albums")
    .addCommand(albumListCommand());
}
