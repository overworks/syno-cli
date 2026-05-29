import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { Command } from "commander";
import { getSnapshot, listCameras } from "@overworks/syno-surveillance";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface CameraListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  limit?: string;
}

interface SnapshotOptions {
  host?: string;
  profile?: string;
  output?: string;
  force?: boolean;
  profileType?: string;
}

function cameraListCommand(): Command {
  return new Command("list")
    .description("List configured cameras")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--limit <n>", "Max cameras to return")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: CameraListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listCameras(client, {
        limit: opts.limit ? Number(opts.limit) : undefined,
        basic: true,
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        (page.cameras ?? []).map((c) => ({
          id: c.id ?? "",
          name: c.newName ?? c.name ?? "",
          ip: c.ip ?? "",
          model: c.model ?? "",
          status: c.status ?? "",
        })),
        ["id", "name", "ip", "model", "status"],
      );
    });
}

function cameraSnapshotCommand(): Command {
  return new Command("snapshot")
    .description("Save a JPEG snapshot from a camera (default: stdout with -o -)")
    .argument("<cameraId>", "Camera ID")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("-o, --output <local>", "Local destination path ('-' for stdout)", "snapshot.jpg")
    .option("-f, --force", "Overwrite local file if it exists")
    .option("--profile-type <n>", "Stream/profile: 0 high, 1 balanced, 2 low")
    .action(async (cameraId: string, opts: SnapshotOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await getSnapshot(client, {
        cameraId: Number(cameraId),
        profileType: opts.profileType ? Number(opts.profileType) : undefined,
      });
      if (!res.body) throw new Error("Empty response body");
      const nodeStream = Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]);

      const dest = opts.output ?? "snapshot.jpg";
      if (dest === "-") {
        await pipeline(nodeStream, process.stdout);
        return;
      }
      await pipeline(nodeStream, createWriteStream(dest, { flags: opts.force ? "w" : "wx" }));
      process.stderr.write(`Saved to ${dest}\n`);
    });
}

export function surveillanceCameraCommand(): Command {
  return new Command("camera")
    .description("Surveillance Station cameras")
    .addCommand(cameraListCommand())
    .addCommand(cameraSnapshotCommand());
}
