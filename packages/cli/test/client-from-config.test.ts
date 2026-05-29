import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clientFromConfig } from "../src/client-from-config.js";
import { upsertProfile, type SynoProfile } from "../src/config.js";

const sample = (overrides: Partial<SynoProfile> = {}): SynoProfile => ({
  host: "https://nas.example:5001",
  account: "admin",
  sid: "sid-home",
  savedAt: "2026-05-29T00:00:00.000Z",
  ...overrides,
});

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "syno-cli-test-"));
  process.env["XDG_CONFIG_HOME"] = workDir;
});

afterEach(async () => {
  delete process.env["XDG_CONFIG_HOME"];
  await rm(workDir, { recursive: true, force: true });
});

describe("clientFromConfig — no config", () => {
  it("throws when neither --host nor a stored profile is available", async () => {
    await expect(clientFromConfig()).rejects.toThrow(/No host configured/);
  });

  it("returns an unauthenticated client when only --host is given", async () => {
    const { client, configured, profile } = await clientFromConfig({ host: "https://peek:5001" });
    expect(client.baseUrl).toBe("https://peek:5001");
    expect(client.getSid()).toBeUndefined();
    expect(configured).toBe(false);
    expect(profile).toBeUndefined();
  });
});

describe("clientFromConfig — with config", () => {
  it("uses the current profile when no opts are given", async () => {
    await upsertProfile("default", sample());
    const { client, configured, profile } = await clientFromConfig();
    expect(client.baseUrl).toBe("https://nas.example:5001");
    expect(client.getSid()).toBe("sid-home");
    expect(configured).toBe(true);
    expect(profile?.name).toBe("default");
  });

  it("uses the named profile when --profile is given", async () => {
    await upsertProfile("home", sample());
    await upsertProfile("work", sample({ host: "https://nas.work:5001", sid: "sid-work" }));
    const { client, profile } = await clientFromConfig({ profile: "work" });
    expect(client.baseUrl).toBe("https://nas.work:5001");
    expect(client.getSid()).toBe("sid-work");
    expect(profile?.name).toBe("work");
  });

  it("throws when --profile points at a non-existent profile", async () => {
    await upsertProfile("default", sample());
    await expect(clientFromConfig({ profile: "ghost" })).rejects.toThrow(
      /Profile "ghost" not found/,
    );
  });

  it("lets --host override the URL while keeping the current profile's sid", async () => {
    await upsertProfile("default", sample());
    const { client, profile } = await clientFromConfig({ host: "https://alt:5001" });
    expect(client.baseUrl).toBe("https://alt:5001");
    expect(client.getSid()).toBe("sid-home");
    expect(profile?.name).toBe("default");
  });

  it("lets --host override the URL while keeping the named profile's sid", async () => {
    await upsertProfile("home", sample());
    await upsertProfile("work", sample({ host: "https://nas.work:5001", sid: "sid-work" }));
    const { client, profile } = await clientFromConfig({ profile: "work", host: "https://alt:5001" });
    expect(client.baseUrl).toBe("https://alt:5001");
    expect(client.getSid()).toBe("sid-work");
    expect(profile?.name).toBe("work");
  });
});
