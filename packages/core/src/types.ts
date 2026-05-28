export interface SynoSuccess<T> {
  success: true;
  data: T;
}

export interface SynoFailure {
  success: false;
  error: {
    code: number;
    errors?: unknown;
  };
}

export type SynoResponse<T> = SynoSuccess<T> | SynoFailure;

export interface SynoApiInfoEntry {
  path: string;
  minVersion: number;
  maxVersion: number;
  requestFormat?: string;
}

export type SynoApiInfoMap = Record<string, SynoApiInfoEntry>;

export interface SynoRequest {
  api: string;
  version: number;
  method: string;
  /**
   * Query/body parameters. Strings/numbers/booleans are stringified as-is;
   * arrays and objects are JSON.stringify'd (Synology accepts both forms).
   * `undefined` and `null` are dropped.
   */
  params?: Record<string, unknown>;
}
