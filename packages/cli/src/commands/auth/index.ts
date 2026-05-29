import { Command } from "commander";
import { authLoginCommand } from "./login.js";
import { authLogoutCommand } from "./logout.js";
import { authListCommand } from "./list.js";
import { authShowCommand } from "./show.js";
import { authUseCommand } from "./use.js";
import { authRmCommand } from "./rm.js";

export function authCommand(): Command {
  return new Command("auth")
    .description("Manage authentication profiles (SYNO.API.Auth)")
    .addCommand(authLoginCommand())
    .addCommand(authLogoutCommand())
    .addCommand(authListCommand())
    .addCommand(authShowCommand())
    .addCommand(authUseCommand())
    .addCommand(authRmCommand());
}
