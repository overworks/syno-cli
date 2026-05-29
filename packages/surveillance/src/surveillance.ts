import type { SynoClient } from "@overworks/syno-core";
import type {
  CameraListPage,
  GetSnapshotOptions,
  ListCamerasOptions,
  ListRecordingsOptions,
  RecordingListPage,
  SurveillanceInfo,
} from "./types.js";

// Surveillance Station API versions are volatile across DSM/SS releases —
// especially Camera. Keep them here so they're easy to bump after checking
// `syno api list --query Surveillance` (maxVersion) on a live DSM.
const INFO_VER = 1;
const CAMERA_VER = 9;
const SNAPSHOT_VER = 1;
const RECORDING_VER = 6;

/** Surveillance Station version + capacity summary. */
export async function getInfo(client: SynoClient): Promise<SurveillanceInfo> {
  return client.request<SurveillanceInfo>({
    api: "SYNO.SurveillanceStation.Info",
    version: INFO_VER,
    method: "GetInfo",
  });
}

/** List configured cameras. */
export async function listCameras(
  client: SynoClient,
  opts: ListCamerasOptions = {},
): Promise<CameraListPage> {
  return client.request<CameraListPage>({
    api: "SYNO.SurveillanceStation.Camera",
    version: CAMERA_VER,
    method: "List",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      basic: opts.basic,
      streamInfo: opts.streamInfo,
    },
  });
}

/**
 * Grab a JPEG snapshot from a camera. Returns the raw `Response` — the caller
 * streams `res.body` to disk and consumes it exactly once (binary endpoint,
 * not a JSON envelope).
 */
export async function getSnapshot(
  client: SynoClient,
  opts: GetSnapshotOptions,
): Promise<Response> {
  return client.requestRaw({
    api: "SYNO.SurveillanceStation.Camera",
    version: SNAPSHOT_VER,
    method: "GetSnapshot",
    params: {
      cameraId: opts.cameraId,
      profileType: opts.profileType,
    },
  });
}

/** List recordings, optionally filtered by camera and time range. */
export async function listRecordings(
  client: SynoClient,
  opts: ListRecordingsOptions = {},
): Promise<RecordingListPage> {
  const cameraIds =
    opts.cameraIds === undefined
      ? undefined
      : (Array.isArray(opts.cameraIds) ? opts.cameraIds : [opts.cameraIds]).join(",");
  return client.request<RecordingListPage>({
    api: "SYNO.SurveillanceStation.Recording",
    version: RECORDING_VER,
    method: "List",
    params: {
      offset: opts.offset,
      limit: opts.limit,
      cameraIds,
      fromTime: opts.fromTime,
      toTime: opts.toTime,
    },
  });
}
