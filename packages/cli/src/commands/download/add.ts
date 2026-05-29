import { Command } from "commander";
import { createTask } from "@overworks/syno-ds";
import { clientFromConfig } from "../../client-from-config.js";

interface AddOptions {
  host?: string;
  profile?: string;
  destination?: string;
  username?: string;
  password?: string;
  unzipPassword?: string;
}

export function downloadAddCommand(): Command {
  return new Command("add")
    .description("Queue one or more downloads (magnet, http, ftp, …)")
    .argument("<uri...>", "URIs / magnet links to add")
    .option("--profile <name>", "Auth profile to use (default: current)")
    .option("--host <url>", "Override the DSM URL for this call only")
    .option("--destination <path>", "Shared-folder-relative path (e.g. home/downloads)")
    .option("--username <name>", "Auth username for HTTP/FTP sources")
    .option("--password <pw>", "Auth password for HTTP/FTP sources")
    .option("--unzip-password <pw>", "Password for protected archives")
    .action(async (uri: string[], opts: AddOptions) => {
      const { client } = await clientFromConfig({ host: opts.host, profile: opts.profile });
      const res = await createTask(client, {
        uri,
        destination: opts.destination,
        username: opts.username,
        password: opts.password,
        unzipPassword: opts.unzipPassword,
      });
      const ids = res.task_id ?? [];
      if (ids.length === 0) {
        process.stdout.write(`Queued ${uri.length} task(s)\n`);
      } else {
        for (const id of ids) process.stdout.write(`Queued ${id}\n`);
      }
    });
}
