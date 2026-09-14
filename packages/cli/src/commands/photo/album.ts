import { Command } from "commander";
import { listAlbums } from "@overworks/syno-photo";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, intArg, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";

interface AlbumListOptions extends ConnectionOptions {
  json?: boolean;
  limit?: number;
}

function albumListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List albums (Personal Space)")
    .option("--limit <n>", "Max albums to return", intArg("--limit"))
    .action(async (opts: AlbumListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listAlbums(client, { limit: opts.limit });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        page.albums.map((a) => ({
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
