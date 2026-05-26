import type { Command } from "commander";
import type { sheets_v4 } from "googleapis";
import {
  BATCH_UPDATE_REQUEST_KINDS,
  type BatchUpdateRequestKind,
} from "../api/request-types";
import { exitCode, success } from "../output";
import { executeSpreadsheetRequests } from "../sheets/execute-requests";
import type { Result } from "../types";

type CliDeps = {
  resolveSpreadsheet: (cmd: string, id?: string) => string | null;
  getSheets: (cmd: string) => Promise<sheets_v4.Sheets | null>;
  output: (res: Result) => void;
  handleApiError: (cmd: string, err: unknown, spreadsheetId: string) => Result;
  parseJsonObject: (
    cmd: string,
    flag: string,
    raw: string
  ) => Record<string, unknown> | null;
};

export function isBatchUpdateRequestKind(
  value: string
): value is BatchUpdateRequestKind {
  return (BATCH_UPDATE_REQUEST_KINDS as readonly string[]).includes(value);
}

export function buildRequestFromKind(
  kind: BatchUpdateRequestKind,
  body: Record<string, unknown>
): sheets_v4.Schema$Request {
  return { [kind]: body } as sheets_v4.Schema$Request;
}

export function registerRequestCommands(
  program: Command,
  deps: CliDeps,
  defaultSpreadsheetId: string
): void {
  const requestCmd = program
    .command("request")
    .description("Run spreadsheets.batchUpdate subrequests by kind");

  requestCmd
    .command("list")
    .description("List supported batchUpdate request kinds")
    .action(() => {
      const cmd = "request list";
      deps.output(
        success(cmd, {
          kinds: [...BATCH_UPDATE_REQUEST_KINDS],
          count: BATCH_UPDATE_REQUEST_KINDS.length,
          hint: "Use `request run --kind <kind> --body '<json>'` for any kind",
        })
      );
      process.exit(0);
    });

  requestCmd
    .command("run")
    .description("Execute one batchUpdate subrequest")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption(
      "--kind <kind>",
      "Request kind (e.g. mergeCells, sortRange)"
    )
    .requiredOption("--body <json>", "JSON body for that request kind")
    .option("--dry-run", "Preview without applying")
    .action(async (opts) => {
      const cmd = "request run";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const kind = String(opts.kind);
      if (!isBatchUpdateRequestKind(kind)) {
        deps.output({
          ok: false,
          cmd,
          error: {
            code: "VALIDATION_ERROR",
            message: `Unknown request kind "${kind}". Run \`sheets-cli request list\`.`,
          },
        });
        return process.exit(10);
      }
      const body = deps.parseJsonObject(cmd, "--body", opts.body);
      if (!body) {
        return process.exit(10);
      }
      const request = buildRequestFromKind(kind, body);
      try {
        const result = await executeSpreadsheetRequests(
          client,
          spreadsheetId,
          [request],
          Boolean(opts.dryRun)
        );
        deps.output(success(cmd, { kind, ...result }, { spreadsheetId }));
        process.exit(0);
      } catch (err) {
        const res = deps.handleApiError(cmd, err, spreadsheetId);
        deps.output(res);
        process.exit(exitCode(res));
      }
    });
}
