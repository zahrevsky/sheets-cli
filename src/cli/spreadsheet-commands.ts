import type { Command } from "commander";
import type { sheets_v4 } from "googleapis";
import { getAuthClient } from "../auth";
import { error, exitCode, success } from "../output";
import { listSheets } from "../sheets";
import { listSpreadsheetsInDrive } from "../sheets/drive-spreadsheets";
import type { Result } from "../types";

type CliDeps = {
  resolveSpreadsheet: (cmd: string, id?: string) => string | null;
  getSheets: (cmd: string) => Promise<sheets_v4.Sheets | null>;
  output: (res: Result) => void;
  handleApiError: (cmd: string, err: unknown, spreadsheetId?: string) => Result;
  parsePositiveIntOption: (
    cmd: string,
    flag: string,
    raw: string
  ) => number | null;
  defaultSpreadsheetId: string;
};

export function registerSpreadsheetCommands(
  program: Command,
  deps: CliDeps
): void {
  const spreadsheet = program
    .command("spreadsheet")
    .description(
      "Spreadsheet files (Drive) and tabs inside a file (Sheets API)"
    );

  spreadsheet
    .command("list")
    .description("List your Google Spreadsheet files on Drive")
    .option("--name <query>", "Filter by name (substring)")
    .option("--limit <n>", "Max results per page (1–1000)", "100")
    .option("--page-token <token>", "Drive API page token for next page")
    .action(async (opts) => {
      const cmd = "spreadsheet list";
      const authClient = await getAuthClient();
      if (!authClient) {
        deps.output(
          error(
            cmd,
            "AUTH_ERROR",
            "Not authenticated. Run 'sheets-cli auth login' first."
          )
        );
        return process.exit(20);
      }

      const limit = deps.parsePositiveIntOption(cmd, "--limit", opts.limit);
      if (limit === null) {
        return process.exit(10);
      }

      try {
        const result = await listSpreadsheetsInDrive(authClient, {
          nameQuery: opts.name,
          limit,
          pageToken: opts.pageToken,
        });
        deps.output(
          success(
            cmd,
            {
              query: opts.name ?? null,
              ...result,
            },
            {}
          )
        );
        process.exit(0);
      } catch (err) {
        const res = deps.handleApiError(cmd, err);
        deps.output(res);
        process.exit(exitCode(res));
      }
    });

  spreadsheet
    .command("find")
    .description("Search spreadsheet files by name (substring match)")
    .requiredOption("--name <query>", "Name to search for")
    .option("--limit <n>", "Max results", "10")
    .action(async (opts) => {
      const cmd = "spreadsheet find";
      const authClient = await getAuthClient();
      if (!authClient) {
        deps.output(
          error(
            cmd,
            "AUTH_ERROR",
            "Not authenticated. Run 'sheets-cli auth login' first."
          )
        );
        return process.exit(20);
      }

      const limit = deps.parsePositiveIntOption(cmd, "--limit", opts.limit);
      if (limit === null) {
        return process.exit(10);
      }

      try {
        const result = await listSpreadsheetsInDrive(authClient, {
          nameQuery: opts.name,
          limit,
        });
        deps.output(
          success(cmd, {
            query: opts.name,
            count: result.count,
            spreadsheets: result.spreadsheets,
            nextPageToken: result.nextPageToken,
          })
        );
        process.exit(0);
      } catch (err) {
        const res = deps.handleApiError(cmd, err);
        deps.output(res);
        process.exit(exitCode(res));
      }
    });

  spreadsheet
    .command("tabs")
    .description("List sheet tabs inside one spreadsheet")
    .option(
      "--spreadsheet <id>",
      "Spreadsheet ID or URL",
      deps.defaultSpreadsheetId
    )
    .action(async (opts) => {
      const cmd = "spreadsheet tabs";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }

      try {
        const tabs = await listSheets(client, spreadsheetId);
        deps.output(success(cmd, { tabs }, { spreadsheetId }));
        process.exit(0);
      } catch (err) {
        const res = deps.handleApiError(cmd, err, spreadsheetId);
        deps.output(res);
        process.exit(exitCode(res));
      }
    });
}
