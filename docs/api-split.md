# API split: write vs read

## Write path

All mutations use `spreadsheets.batchUpdate` via [`src/api/batch-executor.ts`](../src/api/batch-executor.ts) and [`src/builders/`](../src/builders/).

Legacy `spreadsheets.values.append`, `values.update`, and `values.batchUpdate` are no longer used in the MVP write flows.

## Read path

Reads use `spreadsheets.values.get` and `spreadsheets.values.batchGet` ([`src/sheets/read-batch.ts`](../src/sheets/read-batch.ts)).

`batchUpdate` cannot read cell values.

## Agents

Use shell + JSON stdout. See [agent-contract.md](agent-contract.md). No MCP server.
