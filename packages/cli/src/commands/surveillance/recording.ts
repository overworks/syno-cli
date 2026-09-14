import { Command } from "commander";
import { listRecordings } from "@overworks/syno-surveillance";
import { clientFromConfig } from "../../client-from-config.js";
import { type ConnectionOptions, intArg, withConnectionOptions, withJsonOption } from "../shared.js";
import { printJson, printTable } from "../../output.js";
import { bytes, unixToIso } from "../../format.js";

interface RecordingListOptions extends ConnectionOptions {
  json?: boolean;
  camera?: string;
  limit?: number;
}

function recordingListCommand(): Command {
  return withConnectionOptions(withJsonOption(new Command("list")))
    .description("List recordings")
    .option("--camera <ids>", "Filter by camera ID(s), comma-separated")
    .option("--limit <n>", "Max recordings to return", intArg("--limit"))
    .action(async (opts: RecordingListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listRecordings(client, {
        cameraIds: opts.camera ? opts.camera.split(",").map((id) => intArg("--camera")(id.trim())) : undefined,
        limit: opts.limit,
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        (page.recordings ?? []).map((r) => ({
          id: r.id ?? "",
          camera: r.cameraId ?? "",
          start: unixToIso(r.startTime),
          stop: unixToIso(r.stopTime),
          size: bytes(r.fileSize),
        })),
        ["id", "camera", "start", "stop", "size"],
      );
    });
}

export function surveillanceRecordingCommand(): Command {
  return new Command("recording")
    .description("Surveillance Station recordings")
    .addCommand(recordingListCommand());
}
