import { Command } from "commander";
import { surveillanceInfoCommand } from "./info.js";
import { surveillanceCameraCommand } from "./camera.js";
import { surveillanceRecordingCommand } from "./recording.js";

export function surveillanceCommand(): Command {
  return new Command("surveillance")
    .description("Inspect Surveillance Station (SYNO.SurveillanceStation.*)")
    .addCommand(surveillanceInfoCommand())
    .addCommand(surveillanceCameraCommand())
    .addCommand(surveillanceRecordingCommand());
}
