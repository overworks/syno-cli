import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  configPath,
  listProfiles,
  loadConfig,
  removeProfile,
  setCurrent,
  upsertProfile,
  type SynoProfile,
} from "../src/config.js";

const sample = (overrides: Partial<SynoProfile> = {}): SynoProfile => ({
  host: "https://nas.example:5001",
  account: "admin",
  sid: "sid-0001",
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

describe("upsertProfile", () => {
  it("creates the config and sets current on first profile", async () => {
    await upsertProfile("default", sample());
    const cfg = await loadConfig();
    expect(cfg).toEqual({
      current: "default",
      profiles: { default: sample() },
    });
  });

  it("preserves the current pointer when adding another profile", async () => {
    await upsertProfile("default", sample());
    await upsertProfile("work", sample({ host: "https://nas.work:5001" }));
    const cfg = await loadConfig();
    expect(cfg?.current).toBe("default");
    expect(Object.keys(cfg!.profiles).sort()).toEqual(["default", "work"]);
  });

  it("writes the file with mode 0600", async () => {
    await upsertProfile("default", sample());
    const stats = await stat(configPath());
    expect(stats.mode & 0o777).toBe(0o600);
  });
});

describe("removeProfile", () => {
  it("moves current to the alphabetically-first remaining profile when current is removed", async () => {
    await upsertProfile("home", sample());
    await upsertProfile("work", sample({ account: "ops" }));
    await setCurrent("work");
    await removeProfile("work");
    const cfg = await loadConfig();
    expect(cfg?.current).toBe("home");
  });

  it("deletes the entire config file when the last profile is removed", async () => {
    await upsertProfile("default", sample());
    await removeProfile("default");
    await expect(stat(configPath())).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("is a no-op when the name does not exist", async () => {
    await upsertProfile("default", sample());
    await removeProfile("ghost");
    const cfg = await loadConfig();
    expect(Object.keys(cfg!.profiles)).toEqual(["default"]);
  });
});

describe("setCurrent", () => {
  it("throws when the target profile does not exist", async () => {
    await upsertProfile("default", sample());
    await expect(setCurrent("ghost")).rejects.toThrow(/not found/);
  });

  it("throws when no config exists", async () => {
    await expect(setCurrent("default")).rejects.toThrow(/No profiles configured/);
  });
});

describe("listProfiles", () => {
  it("returns an empty array when no config exists", async () => {
    const list = await listProfiles();
    expect(list).toEqual([]);
  });

  it("sorts alphabetically and marks the current", async () => {
    await upsertProfile("work", sample());
    await upsertProfile("home", sample());
    await setCurrent("home");
    const list = await listProfiles();
    expect(list.map((p) => ({ name: p.name, isCurrent: p.isCurrent }))).toEqual([
      { name: "home", isCurrent: true },
      { name: "work", isCurrent: false },
    ]);
  });
});

describe("loadConfig", () => {
  it("rejects malformed config (missing profiles key)", async () => {
    await upsertProfile("default", sample());
    const path = configPath();
    await rm(path);
    const { writeFile, mkdir, chmod } = await import("node:fs/promises");
    await mkdir(join(workDir, "syno-cli"), { recursive: true, mode: 0o700 });
    await writeFile(path, JSON.stringify({ host: "https://x", account: "a", sid: "s", savedAt: "t" }), {
      encoding: "utf8",
      mode: 0o600,
    });
    await chmod(path, 0o600);
    await expect(loadConfig()).rejects.toThrow(/malformed/);
  });

  it("returns undefined when the file does not exist", async () => {
    const cfg = await loadConfig();
    expect(cfg).toBeUndefined();
  });

  // make sure ReadFile import works against the file we just wrote
  it("round-trips through writeConfig", async () => {
    await upsertProfile("default", sample());
    const raw = await readFile(configPath(), "utf8");
    expect(JSON.parse(raw)).toMatchObject({ current: "default" });
  });
});
