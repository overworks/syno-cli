import type { SynoApiError } from "@overworks/syno-core";

/**
 * A one-line, copy-pasteable re-login hint for a session-expiry error
 * (codes 105/106/107/119). We never auto-re-authenticate — the password
 * isn't kept in memory — so the user gets the exact command to run.
 *
 * Returns `undefined` for any non-session error, so callers can append it
 * unconditionally.
 */
export function sessionExpiryHint(
  err: SynoApiError,
  profileName: string | undefined,
): string | undefined {
  if (!err.isSessionExpired) return undefined;
  const cmd = profileName
    ? `syno auth login --profile ${profileName}`
    : "syno auth login";
  return `Session expired or invalid (code ${err.code}). Re-authenticate with: ${cmd}`;
}
