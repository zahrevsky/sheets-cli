import type { Command } from "commander";
import type { sheets_v4 } from "googleapis";
import { defaultSheetResolver } from "../api/sheet-resolver";
import {
  buildDeleteDimensionRequest,
  buildInsertDimensionRequest,
  buildSortRangeRequest,
} from "../builders/dimensions";
import { buildUpdateBordersRequest } from "../builders/formatting";
import { parseA1RangeToGrid } from "../builders/grid-range";
import {
  buildAddNamedRangeRequest,
  buildAddProtectedRangeRequest,
  buildAutoResizeDimensionsRequest,
  buildDeleteNamedRangeRequest,
  buildDeleteProtectedRangeRequest,
  buildPasteDataRequest,
  buildSetDataValidationRequest,
} from "../builders/misc";
import { exitCode, success } from "../output";
import { executeSpreadsheetRequests } from "../sheets/execute-requests";
import type { Result } from "../types";

type CliDeps = {
  resolveSpreadsheet: (cmd: string, id?: string) => string | null;
  getSheets: (cmd: string) => Promise<sheets_v4.Sheets | null>;
  output: (res: Result) => void;
  handleApiError: (
    cmd: string,
    err: unknown,
    spreadsheetId: string,
    sheet?: string
  ) => Result;
  resolveSheetId: (
    cmd: string,
    client: sheets_v4.Sheets,
    spreadsheetId: string,
    sheetName: string
  ) => Promise<number | null>;
  parseJsonObject: (
    cmd: string,
    flag: string,
    raw: string
  ) => Record<string, unknown> | null;
  parseIntOption: (cmd: string, flag: string, raw: string) => number | null;
  error: (cmd: string, code: "VALIDATION_ERROR", message: string) => Result;
};

async function runRequests(
  deps: CliDeps,
  cmd: string,
  spreadsheetId: string,
  client: sheets_v4.Sheets,
  requests: sheets_v4.Schema$Request[],
  dryRun: boolean,
  sheet?: string
): Promise<void> {
  try {
    const result = await executeSpreadsheetRequests(
      client,
      spreadsheetId,
      requests,
      dryRun
    );
    defaultSheetResolver.invalidate(spreadsheetId);
    deps.output(success(cmd, result, { spreadsheetId, sheet }));
    process.exit(0);
  } catch (err) {
    const res = deps.handleApiError(cmd, err, spreadsheetId, sheet);
    deps.output(res);
    process.exit(exitCode(res));
  }
}

export function registerExtendedCommands(
  program: Command,
  deps: CliDeps,
  defaultSpreadsheetId: string
): void {
  const dimension = program
    .command("dimension")
    .description("Insert or delete rows/columns");

  dimension
    .command("insert")
    .description("Insert rows or columns")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--sheet <name>", "Sheet name")
    .requiredOption("--dimension <dim>", "ROWS or COLUMNS")
    .requiredOption("--start <n>", "Start index (0-based)")
    .requiredOption("--end <n>", "End index (exclusive)")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "dimension insert";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        opts.sheet
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const dim = String(opts.dimension).toUpperCase();
      if (dim !== "ROWS" && dim !== "COLUMNS") {
        deps.output(
          deps.error(
            cmd,
            "VALIDATION_ERROR",
            "--dimension must be ROWS or COLUMNS"
          )
        );
        return process.exit(10);
      }
      const startIndex = deps.parseIntOption(cmd, "--start", opts.start);
      const endIndex = deps.parseIntOption(cmd, "--end", opts.end);
      if (startIndex === null || endIndex === null) {
        return process.exit(10);
      }
      const requests = [
        buildInsertDimensionRequest({
          sheetId,
          dimension: dim,
          startIndex,
          endIndex,
        }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        opts.sheet
      );
    });

  dimension
    .command("delete")
    .description("Delete rows or columns")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--sheet <name>", "Sheet name")
    .requiredOption("--dimension <dim>", "ROWS or COLUMNS")
    .requiredOption("--start <n>", "Start index (0-based)")
    .requiredOption("--end <n>", "End index (exclusive)")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "dimension delete";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        opts.sheet
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const dim = String(opts.dimension).toUpperCase();
      if (dim !== "ROWS" && dim !== "COLUMNS") {
        deps.output(
          deps.error(
            cmd,
            "VALIDATION_ERROR",
            "--dimension must be ROWS or COLUMNS"
          )
        );
        return process.exit(10);
      }
      const startIndex = deps.parseIntOption(cmd, "--start", opts.start);
      const endIndex = deps.parseIntOption(cmd, "--end", opts.end);
      if (startIndex === null || endIndex === null) {
        return process.exit(10);
      }
      const requests = [
        buildDeleteDimensionRequest({
          sheetId,
          dimension: dim,
          startIndex,
          endIndex,
        }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        opts.sheet
      );
    });

  program
    .command("sort")
    .description("Sort a range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--range <range>", "A1 range with sheet name")
    .requiredOption("--specs <json>", "JSON array of sortSpecs")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "sort";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetName = opts.range.includes("!")
        ? opts.range.split("!")[0]?.replace(/^'|'$/g, "").replaceAll("''", "'")
        : null;
      if (!sheetName) {
        deps.output(
          deps.error(cmd, "VALIDATION_ERROR", "Range must include sheet name")
        );
        return process.exit(10);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        sheetName
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      let specs: sheets_v4.Schema$SortSpec[];
      try {
        const parsed: unknown = JSON.parse(opts.specs);
        if (!Array.isArray(parsed)) {
          throw new Error("not array");
        }
        specs = parsed as sheets_v4.Schema$SortSpec[];
      } catch {
        deps.output(
          deps.error(cmd, "VALIDATION_ERROR", "Invalid JSON array for --specs")
        );
        return process.exit(10);
      }
      const grid = parseA1RangeToGrid(opts.range, sheetId);
      const requests = [
        buildSortRangeRequest({ range: grid, sortSpecs: specs }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        sheetName
      );
    });

  const validate = program
    .command("validate")
    .description("Data validation rules");

  validate
    .command("set")
    .description("Set data validation on a range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--range <range>", "A1 range with sheet name")
    .requiredOption("--rule <json>", "DataValidationRule JSON")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "validate set";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetName = opts.range.includes("!")
        ? opts.range.split("!")[0]?.replace(/^'|'$/g, "").replaceAll("''", "'")
        : null;
      if (!sheetName) {
        deps.output(
          deps.error(cmd, "VALIDATION_ERROR", "Range must include sheet name")
        );
        return process.exit(10);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        sheetName
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const ruleBody = deps.parseJsonObject(cmd, "--rule", opts.rule);
      if (!ruleBody) {
        return process.exit(10);
      }
      const grid = parseA1RangeToGrid(opts.range, sheetId);
      const requests = [
        buildSetDataValidationRequest({
          range: grid,
          rule: ruleBody as sheets_v4.Schema$DataValidationRule,
        }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        sheetName
      );
    });

  const protect = program.command("protect").description("Protected ranges");

  protect
    .command("add")
    .description("Add a protected range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--body <json>", "ProtectedRange JSON")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "protect add";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const body = deps.parseJsonObject(cmd, "--body", opts.body);
      if (!body) {
        return process.exit(10);
      }
      const requests = [
        buildAddProtectedRangeRequest(body as sheets_v4.Schema$ProtectedRange),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun)
      );
    });

  protect
    .command("delete")
    .description("Delete a protected range by id")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--id <n>", "Protected range id")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "protect delete";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const id = deps.parseIntOption(cmd, "--id", opts.id);
      if (id === null) {
        return process.exit(10);
      }
      const requests = [buildDeleteProtectedRangeRequest(id)];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun)
      );
    });

  const namedRange = program.command("named-range").description("Named ranges");

  namedRange
    .command("add")
    .description("Add a named range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--body <json>", "NamedRange JSON")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "named-range add";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const body = deps.parseJsonObject(cmd, "--body", opts.body);
      if (!body) {
        return process.exit(10);
      }
      const requests = [
        buildAddNamedRangeRequest(body as sheets_v4.Schema$NamedRange),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun)
      );
    });

  namedRange
    .command("delete")
    .description("Delete a named range by id")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--id <id>", "Named range id")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "named-range delete";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const requests = [buildDeleteNamedRangeRequest(String(opts.id))];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun)
      );
    });

  program
    .command("paste")
    .description("Paste data into a range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--range <range>", "A1 range with sheet name")
    .requiredOption("--data <text>", "Paste payload")
    .option("--type <type>", "Paste type", "PASTE_NORMAL")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "paste";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetName = opts.range.includes("!")
        ? opts.range.split("!")[0]?.replace(/^'|'$/g, "").replaceAll("''", "'")
        : null;
      if (!sheetName) {
        deps.output(
          deps.error(cmd, "VALIDATION_ERROR", "Range must include sheet name")
        );
        return process.exit(10);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        sheetName
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const grid = parseA1RangeToGrid(opts.range, sheetId);
      const requests = [
        buildPasteDataRequest({
          coordinate: {
            sheetId,
            rowIndex: grid.startRowIndex ?? 0,
            columnIndex: grid.startColumnIndex ?? 0,
          },
          data: opts.data,
          type: opts.type,
        }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        sheetName
      );
    });

  program
    .command("autoresize")
    .description("Auto-resize rows or columns")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--sheet <name>", "Sheet name")
    .requiredOption("--dimension <dim>", "ROWS or COLUMNS")
    .requiredOption("--start <n>", "Start index (0-based)")
    .requiredOption("--end <n>", "End index (exclusive)")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "autoresize";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        opts.sheet
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const dim = String(opts.dimension).toUpperCase();
      if (dim !== "ROWS" && dim !== "COLUMNS") {
        deps.output(
          deps.error(
            cmd,
            "VALIDATION_ERROR",
            "--dimension must be ROWS or COLUMNS"
          )
        );
        return process.exit(10);
      }
      const startIndex = deps.parseIntOption(cmd, "--start", opts.start);
      const endIndex = deps.parseIntOption(cmd, "--end", opts.end);
      if (startIndex === null || endIndex === null) {
        return process.exit(10);
      }
      const requests = [
        buildAutoResizeDimensionsRequest({
          sheetId,
          dimension: dim,
          startIndex,
          endIndex,
        }),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        opts.sheet
      );
    });

  program
    .command("borders")
    .description("Update borders on a range")
    .option("--spreadsheet <id>", "Spreadsheet ID or URL", defaultSpreadsheetId)
    .requiredOption("--range <range>", "A1 range with sheet name")
    .option("--top <json>", "Top border JSON")
    .option("--bottom <json>", "Bottom border JSON")
    .option("--left <json>", "Left border JSON")
    .option("--right <json>", "Right border JSON")
    .option("--dry-run", "Preview requests")
    .action(async (opts) => {
      const cmd = "borders";
      const spreadsheetId = deps.resolveSpreadsheet(cmd, opts.spreadsheet);
      if (!spreadsheetId) {
        return process.exit(10);
      }
      const client = await deps.getSheets(cmd);
      if (!client) {
        return process.exit(20);
      }
      const sheetName = opts.range.includes("!")
        ? opts.range.split("!")[0]?.replace(/^'|'$/g, "").replaceAll("''", "'")
        : null;
      if (!sheetName) {
        deps.output(
          deps.error(cmd, "VALIDATION_ERROR", "Range must include sheet name")
        );
        return process.exit(10);
      }
      const sheetId = await deps.resolveSheetId(
        cmd,
        client,
        spreadsheetId,
        sheetName
      );
      if (sheetId === null) {
        return process.exit(10);
      }
      const grid = parseA1RangeToGrid(opts.range, sheetId);
      const parseBorder = (raw?: string) => {
        if (!raw) {
          return;
        }
        return deps.parseJsonObject(
          cmd,
          "border",
          raw
        ) as sheets_v4.Schema$Border | null;
      };
      const top = parseBorder(opts.top);
      const bottom = parseBorder(opts.bottom);
      const left = parseBorder(opts.left);
      const right = parseBorder(opts.right);
      if (
        (opts.top && top === null) ||
        (opts.bottom && bottom === null) ||
        (opts.left && left === null) ||
        (opts.right && right === null)
      ) {
        return process.exit(10);
      }
      const requests = [
        buildUpdateBordersRequest(
          grid,
          top ?? undefined,
          bottom ?? undefined,
          left ?? undefined,
          right ?? undefined
        ),
      ];
      await runRequests(
        deps,
        cmd,
        spreadsheetId,
        client,
        requests,
        Boolean(opts.dryRun),
        sheetName
      );
    });
}
