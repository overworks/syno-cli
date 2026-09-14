import { Command } from "commander";
import { getCover } from "@overworks/syno-audio";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, saveResponse, withConnectionOptions } from "../shared.js";

interface CoverOptions extends ConnectionOptions {
  output?: string;
  force?: boolean;
}

export function audioCoverCommand(): Command {
  return withConnectionOptions(new Command("cover"))
    .description("Save a song's cover art ('-' for stdout)")
    .argument("<songId>", "Song ID")
    .option("-o, --output <local>", "Local destination path ('-' for stdout)", "cover.jpg")
    .option("-f, --force", "Overwrite local file if it exists")
    .action(async (songId: string, opts: CoverOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await getCover(client, { songId });
      await saveResponse(res, opts.output ?? "cover.jpg", { force: opts.force });
    });
}
