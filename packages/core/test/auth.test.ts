import { describe, expect, it, vi } from "vitest";
import { SynoClient, login, logout } from "../src/index.js";

describe("auth.login", () => {
  it("hits auth.cgi with format=sid and stores the returned sid on the client", async () => {
    const fetchImpl = vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      expect(url.pathname).toBe("/webapi/auth.cgi");
      // Credentials travel in a POST body, never in the URL.
      expect(url.search).toBe("");
      expect(init?.method).toBe("POST");
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("api")).toBe("SYNO.API.Auth");
      expect(body.get("method")).toBe("login");
      expect(body.get("format")).toBe("sid");
      expect(body.get("account")).toBe("admin");
      expect(body.get("passwd")).toBe("hunter2");
      expect(body.has("otp_code")).toBe(false);
      return new Response(
        JSON.stringify({ success: true, data: { sid: "sid-xyz", did: "did-1" } }),
        { status: 200 },
      );
    });

    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    const result = await login(client, { account: "admin", passwd: "hunter2" });

    expect(result.sid).toBe("sid-xyz");
    expect(client.getSid()).toBe("sid-xyz");
  });

  it("sends otp_code when provided", async () => {
    const fetchImpl = vi.fn(async (_input: string, init?: RequestInit) => {
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("otp_code")).toBe("123456");
      return new Response(JSON.stringify({ success: true, data: { sid: "s" } }), { status: 200 });
    });
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await login(client, { account: "a", passwd: "p", otpCode: "123456" });
  });

  it("login surfaces auth-specific error messages", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: { code: 400 } }), { status: 200 }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await expect(login(client, { account: "x", passwd: "y" })).rejects.toMatchObject({
      code: 400,
      api: "SYNO.API.Auth",
      message: expect.stringContaining("No such account or incorrect password"),
    });
  });
});

describe("auth.logout", () => {
  it("no-ops when there is no sid", async () => {
    const fetchImpl = vi.fn();
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", fetch: fetchImpl });
    await logout(client);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("keeps the sid when the DSM rejects the logout", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: false, error: { code: 106 } }), { status: 200 }),
    );
    const client = new SynoClient({ baseUrl: "https://nas.example:5001", sid: "sid-1", fetch: fetchImpl });
    await expect(logout(client)).rejects.toMatchObject({ code: 106 });
    expect(client.getSid()).toBe("sid-1");
  });

  it("clears the sid on success", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ success: true, data: {} }), { status: 200 }),
    );
    const client = new SynoClient({
      baseUrl: "https://nas.example:5001",
      sid: "sid-1",
      fetch: fetchImpl,
    });
    await logout(client);
    expect(client.getSid()).toBeUndefined();
  });
});
