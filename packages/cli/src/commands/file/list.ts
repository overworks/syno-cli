import { Command } from "commander";
import { list, listShares } from "@overworks/syno-file";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, intArg, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";
import { bytes, unixToIso } from "../../format.js";

interface FileListOptions extends ConnectionOptions {
  json?: boolean;
  limit?: number;
  offset?: number;
}

export function fileListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List shared folders (no arg) or the contents of a directory")
    .argument("[path]", "Remote folder path; omit to list shares")
    .option("--limit <n>", "Max entries per page", intArg("--limit"))
    .option("--offset <n>", "Offset for paging", intArg("--offset"))
    .action(async (path: string | undefined, opts: FileListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const limit = opts.limit;
      const offset = opts.offset;
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
          size: bytes(f.additional?.size),
          mtime: unixToIso(f.additional?.time?.mtime),
          owner: f.additional?.owner?.user ?? "",
        })),
        ["name", "type", "size", "mtime", "owner"],
      );
    });
}
