/**
 * `SYNO.Core.System` (method `info`). General box identity + health.
 *
 * DSM versions vary in which keys they return, so most fields are optional.
 * Temperatures are in °C; `up_time` is a human string like `"10:21:34:56"`
 * (days:hours:minutes:seconds).
 */
export interface SystemInfo {
  model?: string;
  serial?: string;
  firmware_ver?: string;
  firmware_date?: string;
  /** Uptime as `"DD:HH:MM:SS"`. */
  up_time?: string;
  /** Current system temperature in °C. */
  temperature?: number;
  /** True when the box reports the temperature as too high. */
  temperature_warn?: boolean;
  sys_temp?: number;
  cpu_series?: string;
  cpu_vendor?: string;
  cpu_family?: string;
  cpu_cores?: string;
  cpu_clock_speed?: number;
  /** RAM size in MB. */
  ram_size?: number;
  enabled_ntp?: boolean;
  ntp_server?: string;
  time?: string;
  time_zone?: string;
  time_zone_desc?: string;
  usb_dev?: unknown[];
  sata_dev?: unknown[];
}

/** CPU load percentages (whole numbers, e.g. `12` = 12%). */
export interface CpuLoad {
  device?: string;
  user_load?: number;
  system_load?: number;
  other_load?: number;
  "1min_load"?: number;
  "5min_load"?: number;
  "15min_load"?: number;
}

/** Memory figures in KB, usage percentages as whole numbers. */
export interface MemoryUsage {
  device?: string;
  /** Real memory usage percentage. */
  real_usage?: number;
  /** Swap usage percentage. */
  swap_usage?: number;
  memory_size?: number;
  total_real?: number;
  avail_real?: number;
  total_swap?: number;
  avail_swap?: number;
  buffer?: number;
  cached?: number;
  si_disk?: number;
  so_disk?: number;
}

/** Per-interface throughput in bytes/s. `device: "total"` is the aggregate. */
export interface NetworkInterface {
  device: string;
  rx: number;
  tx: number;
}

export interface DiskUtilizationEntry {
  device: string;
  display_name?: string;
  type?: string;
  read_access?: number;
  write_access?: number;
  read_byte?: number;
  write_byte?: number;
  /** Disk utilization percentage. */
  utilization?: number;
}

export interface DiskUtilization {
  disk?: DiskUtilizationEntry[];
  total?: DiskUtilizationEntry;
}

export interface SpaceUtilization {
  volume?: DiskUtilizationEntry[];
  total?: DiskUtilizationEntry;
}

/**
 * `SYNO.Core.System.Utilization` (method `get`). Real-time resource usage —
 * a point-in-time snapshot, not an average.
 */
export interface Utilization {
  cpu?: CpuLoad;
  memory?: MemoryUsage;
  network?: NetworkInterface[];
  disk?: DiskUtilization;
  space?: SpaceUtilization;
  /** Unix epoch seconds when the sample was taken. */
  time?: number;
}

/**
 * One volume from `SYNO.Storage.CGI.Storage`. Byte counts arrive as numeric
 * **strings** (they exceed 2^53), so they're typed as `string`.
 */
export interface Volume {
  id?: string;
  display_name?: string;
  /** RAID type, e.g. `"raid_1"`, `"shr"`. */
  device_type?: string;
  fs_type?: string;
  /** `"normal"`, `"degrade"`, `"crashed"`, … */
  status?: string;
  deploy_path?: string;
  size?: {
    total?: string;
    used?: string;
    free_inode?: string;
    total_inode?: string;
  };
}

/** One physical disk from `SYNO.Storage.CGI.Storage`. */
export interface Disk {
  id?: string;
  name?: string;
  device?: string;
  model?: string;
  /** SMART overall status, e.g. `"normal"`. */
  smart_status?: string;
  /** Disk status, e.g. `"normal"`. */
  status?: string;
  /** Temperature in °C. */
  temp?: number;
  /** Total capacity in bytes, as a numeric string. */
  size_total?: string;
  disk_type?: string;
  used_by?: string;
  serial?: string;
  firm?: string;
}

export interface StoragePool {
  id?: string;
  device_type?: string;
  status?: string;
  size?: {
    total?: string;
    used?: string;
  };
}

/**
 * `SYNO.Storage.CGI.Storage` (method `load_info`). Field set varies widely by
 * DSM version, so everything here is optional/permissive.
 */
export interface StorageInfo {
  volumes?: Volume[];
  disks?: Disk[];
  storagePools?: StoragePool[];
  hddCnt?: number;
  hotSpareCnt?: number;
}
