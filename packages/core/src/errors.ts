const COMMON_MESSAGES: Record<number, string> = {
  100: "Unknown error",
  101: "Invalid parameter",
  102: "The requested API does not exist",
  103: "The requested method does not exist",
  104: "The requested version does not support the functionality",
  105: "The logged-in session does not have permission",
  106: "Session timeout",
  107: "Session interrupted by duplicate login",
  119: "SID not found",
};

const AUTH_MESSAGES: Record<number, string> = {
  400: "No such account or incorrect password",
  401: "Account disabled",
  402: "Permission denied",
  403: "2-step verification code required",
  404: "Failed to authenticate 2-step verification code",
  406: "Enforce to authenticate with 2-step verification code",
  407: "Blocked IP source",
  408: "Expired password cannot be changed",
  409: "Expired password",
  410: "Password must be changed",
};

const FILE_STATION_MESSAGES: Record<number, string> = {
  400: "Invalid parameter of file operation",
  401: "Unknown error of file operation",
  402: "System is too busy",
  403: "Invalid user does this file operation",
  404: "Invalid group does this file operation",
  405: "Invalid user and group does this file operation",
  406: "Can't get user/group information from the account server",
  407: "Operation not permitted",
  408: "No such file or directory",
  409: "Non-supported file system",
  410: "Failed to connect internet-based file system (e.g. CIFS)",
  411: "Read-only file system",
  412: "Filename too long in the non-encrypted file system",
  413: "Filename too long in the encrypted file system",
  414: "File already exists",
  415: "Disk quota exceeded",
  416: "No space left on device",
  417: "Input/output error",
  418: "Illegal name or path",
  419: "Illegal file name",
  420: "Illegal file name on FAT file system",
  421: "Device or resource busy",
  599: "No such task of the file operation",
};

const DOWNLOAD_STATION_MESSAGES: Record<number, string> = {
  400: "File upload failed",
  401: "Max number of tasks reached",
  402: "Destination denied",
  403: "Destination does not exist",
  404: "Invalid task id",
  405: "Invalid task action",
  406: "No default destination",
  407: "Set destination failed",
  408: "File does not exist",
};

const SERVICE_MESSAGES: Array<[prefix: string, table: Record<number, string>]> = [
  ["SYNO.API.Auth", AUTH_MESSAGES],
  ["SYNO.FileStation.", FILE_STATION_MESSAGES],
  ["SYNO.DownloadStation.", DOWNLOAD_STATION_MESSAGES],
];

export function describeSynoErrorCode(code: number, api: string): string {
  for (const [prefix, table] of SERVICE_MESSAGES) {
    if (api.startsWith(prefix) && table[code]) return table[code]!;
  }
  return COMMON_MESSAGES[code] ?? `Synology API error code ${code}`;
}

/** A Synology API-level failure: the DSM answered with `success: false`. */
export class SynoApiError extends Error {
  readonly code: number;
  readonly api: string;
  readonly method: string;

  constructor(args: { code: number; api: string; method: string; cause?: unknown }) {
    super(
      `${args.api}.${args.method} failed (code ${args.code}): ${describeSynoErrorCode(args.code, args.api)}`,
      args.cause !== undefined ? { cause: args.cause } : undefined,
    );
    this.name = "SynoApiError";
    this.code = args.code;
    this.api = args.api;
    this.method = args.method;
  }

  get isSessionExpired(): boolean {
    return this.code === 105 || this.code === 106 || this.code === 107 || this.code === 119;
  }
}

/**
 * A transport-level failure: a non-2xx HTTP status, or a 2xx response whose
 * body is not the expected JSON envelope. `status` is the HTTP status code —
 * it is deliberately kept apart from Synology's own error codes, which share
 * the 4xx number range but mean something completely different.
 */
export class SynoHttpError extends Error {
  readonly status: number;
  readonly api: string;
  readonly method: string;

  constructor(args: { status: number; api: string; method: string; detail?: string; cause?: unknown }) {
    const detail = args.detail ? `: ${args.detail}` : "";
    super(
      `${args.api}.${args.method} failed (HTTP ${args.status})${detail}`,
      args.cause !== undefined ? { cause: args.cause } : undefined,
    );
    this.name = "SynoHttpError";
    this.status = args.status;
    this.api = args.api;
    this.method = args.method;
  }
}
