export { SynoClient } from "./client.js";
export type { SynoClientOptions, FetchLike } from "./client.js";
export { SynoApiError, describeSynoErrorCode } from "./errors.js";
export { login, logout } from "./auth.js";
export type { LoginParams, LoginResult } from "./auth.js";
export { queryApiInfo } from "./api-info.js";
export type {
  SynoSuccess,
  SynoFailure,
  SynoResponse,
  SynoApiInfoEntry,
  SynoApiInfoMap,
  SynoRequest,
} from "./types.js";
