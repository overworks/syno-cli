import { Command } from "commander";
import { listRecordings } from "@overworks/syno-surveillance";
import { clientFromConfig } from "../../client-from-config.js";
import { printJson, printTable } from "../../output.js";

interface RecordingListOptions {
  host?: string;
  profile?: string;
  json?: boolean;
  camera?: string;
  limit?: string;
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

function ts(sec: number | undefined): string {
  if (!sec) return "";
  return new Date(sec * 1000).toISOString().replace("T", " ").slice(0, 19);
}

function recordingListCommand(): Command {
  return new Command("list")
    .description("List recordings")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--camera <ids>", "Filter by camera ID(s), comma-separated")
    .option("--limit <n>", "Max recordings to return")
    .option("--json", "Emit JSON instead of a table")
    .action(async (opts: RecordingListOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const page = await listRecordings(client, {
        cameraIds: opts.camera ? opts.camera.split(",").map((s) => Number(s.trim())) : undefined,
        limit: opts.limit ? Number(opts.limit) : undefined,
      });
      if (opts.json) {
        printJson(page);
        return;
      }
      printTable(
        (page.recordings ?? []).map((r) => ({
          id: r.id ?? "",
          camera: r.cameraId ?? "",
          start: ts(r.startTime),
          stop: ts(r.stopTime),
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
