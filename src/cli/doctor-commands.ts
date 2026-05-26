import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import {
  defaultGoogleapisSheetsV4Path,
  diffRequestKindRegistries,
  extractBatchUpdateRequestKindsFromDts,
} from "../api/googleapis-request-kinds";
import { BATCH_UPDATE_REQUEST_KINDS } from "../api/request-types";
import { success } from "../output";
import type { Result } from "../types";

type CliDeps = {
  output: (res: Result) => void;
};

export function registerDoctorCommands(program: Command, deps: CliDeps): void {
  const doctor = program
    .command("doctor")
    .description("Diagnostics for local setup and API coupling");

  doctor
    .command("api")
    .description(
      "Verify batchUpdate request kinds match installed googleapis types"
    )
    .action(() => {
      const cmd = "doctor api";
      const dtsPath = defaultGoogleapisSheetsV4Path();
      const fromGoogle = extractBatchUpdateRequestKindsFromDts(dtsPath);
      const { missing, extra } = diffRequestKindRegistries(
        BATCH_UPDATE_REQUEST_KINDS,
        fromGoogle
      );
      const pkg = JSON.parse(
        readFileSync(join(import.meta.dir, "../../package.json"), "utf8")
      ) as { dependencies?: { googleapis?: string } };
      const ok = missing.length === 0 && extra.length === 0;
      deps.output(
        success(
          cmd,
          {
            ok,
            googleapisVersion: pkg.dependencies?.googleapis ?? "unknown",
            googleapisTypesPath: dtsPath,
            registryCount: BATCH_UPDATE_REQUEST_KINDS.length,
            googleapisCount: fromGoogle.length,
            missing,
            extra,
            hint: ok
              ? "Registry matches googleapis Schema$Request"
              : "Run: bun scripts/generate-request-kinds.ts",
          },
          {}
        )
      );
      process.exit(ok ? 0 : 10);
    });
}
