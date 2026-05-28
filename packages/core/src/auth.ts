import type { SynoClient } from "./client.js";

export interface LoginParams {
  account: string;
  passwd: string;
  otpCode?: string;
  session?: string;
}

export interface LoginResult {
  sid: string;
  did?: string;
}

export async function login(client: SynoClient, params: LoginParams): Promise<LoginResult> {
  const data = await client.request<LoginResult>({
    api: "SYNO.API.Auth",
    version: 6,
    method: "login",
    params: {
      account: params.account,
      passwd: params.passwd,
      session: params.session ?? "syno-cli",
      format: "sid",
      otp_code: params.otpCode,
    },
  });
  client.setSid(data.sid);
  return data;
}

export async function logout(client: SynoClient, session: string = "syno-cli"): Promise<void> {
  if (!client.getSid()) return;
  await client.request<Record<string, never>>({
    api: "SYNO.API.Auth",
    version: 6,
    method: "logout",
    params: { session },
  });
  client.setSid(undefined);
}
