/**
 * `SYNO.SurveillanceStation.Info` (method `GetInfo`). Surveillance Station
 * version + capacity summary. Field set varies by SS release, so most fields
 * are optional.
 */
export interface SurveillanceInfo {
  /** Surveillance Station version string, e.g. `"9.1.2-1234"`. */
  version?: { major?: number; minor?: number; build?: number };
  cameraNumber?: number;
  /** Licensed camera count. */
  maxCameraSupport?: number;
  /** True when the package runs on the DSM you're logged into. */
  isLicenseEnough?: number;
  userPriv?: number;
  [key: string]: unknown;
}

/** One camera from `SYNO.SurveillanceStation.Camera` (method `List`). */
export interface Camera {
  id?: number;
  /** Display name. Newer SS returns `newName`; older returns `name`. */
  newName?: string;
  name?: string;
  ip?: string;
  port?: number;
  model?: string;
  vendor?: string;
  /** Connection status (enum varies; `1` is commonly "normal/recording"). */
  status?: number;
  enabled?: boolean;
  recStatus?: number;
  [key: string]: unknown;
}

export interface CameraListPage {
  cameras?: Camera[];
  total?: number;
}

export interface ListCamerasOptions {
  offset?: number;
  limit?: number;
  /** Return only basic fields (lighter payload). */
  basic?: boolean;
  /** Include stream info in the response. */
  streamInfo?: boolean;
}

export interface GetSnapshotOptions {
  /** Camera ID to snapshot. */
  cameraId: number;
  /**
   * Stream/profile to grab. `0` = high quality, `1` = balanced, `2` = low.
   * Optional; SS picks a default when omitted.
   */
  profileType?: number;
}

/** One recording from `SYNO.SurveillanceStation.Recording` (method `List`). */
export interface Recording {
  id?: number;
  cameraId?: number;
  /** Start time (unix epoch seconds). */
  startTime?: number;
  /** Stop time (unix epoch seconds). */
  stopTime?: number;
  /** File size in bytes. */
  fileSize?: number;
  filePath?: string;
  status?: number;
  [key: string]: unknown;
}

export interface RecordingListPage {
  recordings?: Recording[];
  total?: number;
}

export interface ListRecordingsOptions {
  offset?: number;
  limit?: number;
  /** Filter by camera IDs. */
  cameraIds?: number | number[];
  /** Range start (unix epoch seconds). */
  fromTime?: number;
  /** Range end (unix epoch seconds). */
  toTime?: number;
}
