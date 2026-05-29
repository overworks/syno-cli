import { describe, expect, it } from "vitest";
import { SynoApiError } from "@overworks/syno-core";
import { sessionExpiryHint } from "../src/session-hint.js";

const err = (code: number) =>
  new SynoApiError({ code, api: "SYNO.FileStation.List", method: "list" });

describe("sessionExpiryHint", () => {
  it.each([105, 106, 107, 119])("names the active profile for session code %i", (code) => {
    const hint = sessionExpiryHint(err(code), "work");
    expect(hint).toContain("syno auth login --profile work");
    expect(hint).toContain(`code ${code}`);
  });

  it("omits --profile when no profile is active (bare --host)", () => {
    const hint = sessionExpiryHint(err(106), undefined);
    expect(hint).toBe(
      "Session expired or invalid (code 106). Re-authenticate with: syno auth login",
    );
  });

  it("returns undefined for non-session errors", () => {
    expect(sessionExpiryHint(err(101), "work")).toBeUndefined();
    expect(sessionExpiryHint(err(408), "work")).toBeUndefined();
  });
});
