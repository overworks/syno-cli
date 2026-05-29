import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Command } from "commander";
import { getCover } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";

interface CoverOptions {
  host?: string;
  profile?: string;
  output?: string;
  force?: boolean;
}

export function audioCoverCommand(): Command {
  return new Command("cover")
    .description("Save a song's cover art ('-' for stdout)")
    .argument("<songId>", "Song ID")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("-o, --output <local>", "Local destination path ('-' for stdout)", "cover.jpg")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (songId: string, opts: CoverOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await getCover(client, { songId });
      if (!res.body) throw new Error("Empty response body");
      const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);

      const dest = opts.output ?? "cover.jpg";
      if (dest === "-") {
        await pipeline(nodeStream, process.stdout);
        return;
      }
      await pipeline(nodeStream, createWriteStream(dest, { flags: opts.force ? "w" : "wx" }));
      process.stderr.write(`Saved to ${dest}\n`);
    });
}
