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

export function describeSynoErrorCode(code: number, api: string): string {
  if (api === "SYNO.API.Auth" && AUTH_MESSAGES[code]) return AUTH_MESSAGES[code]!;
  return COMMON_MESSAGES[code] ?? `Synology API error code ${code}`;
}

export class SynoApiError extends Error {
  readonly code: number;
  readonly api: string;
  readonly method: string;

  constructor(args: { code: number; api: string; method: string; cause?: unknown }) {
    super(`${args.api}.${args.method} failed (code ${args.code}): ${describeSynoErrorCode(args.code, args.api)}`);
    this.name = "SynoApiError";
    this.code = args.code;
    this.api = args.api;
    this.method = args.method;
    if (args.cause !== undefined) (this as { cause?: unknown }).cause = args.cause;
  }

  get isSessionExpired(): boolean {
    return this.code === 105 || this.code === 106 || this.code === 107 || this.code === 119;
  }
}
