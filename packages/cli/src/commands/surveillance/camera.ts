import { Command } from "commander";
import { getSnapshot, listCameras } from "@overworks/syno-surveillance";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";
import { type ConnectionOptions, intArg, saveResponse, withConnectionOptions, withJsonOption } from "../shared.js";

interface CameraListOptions extends ConnectionOptions {
  json?: boolean;
  limit?: number;
}

interface SnapshotOptions extends ConnectionOptions {
  output?: string;
  force?: boolean;
  profileType?: number;
}

function cameraListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List configured cameras")
    .option("--limit <n>", "Max cameras to return", intArg("--limit"))
    .action(async (opts: CameraListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listCameras(client, { limit: opts.limit, basic: true });
      if (opts.json) return printJson(page);
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
  return withConnectionOptions(new Command("snapshot"))
    .description("Save a JPEG snapshot from a camera")
    .argument("<cameraId>", "Camera ID", intArg("cameraId"))
    .option("-o, --output <local>", "Local destination path ('-' for stdout)", "snapshot.jpg")
    .option("-f, --force", "Overwrite local file if it exists")
    .option("--profile-type <n>", "Stream/profile: 0 high, 1 balanced, 2 low", intArg("--profile-type"))
    .action(async (cameraId: number, opts: SnapshotOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await getSnapshot(client, { cameraId, profileType: opts.profileType });
      await saveResponse(res, opts.output ?? "snapshot.jpg", { force: opts.force });
    });
}

export function surveillanceCameraCommand(): Command {
  return new Command("camera")
    .description("Surveillance Station cameras")
    .addCommand(cameraListCommand())
    .addCommand(cameraSnapshotCommand());
}
