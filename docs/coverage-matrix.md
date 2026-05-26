# batchUpdate coverage matrix

Legend: **CLI** = dedicated command; **request** = `sheets-cli request run --kind …`; **batch-raw** = arbitrary JSON array.

| Request | Builder | Unit test | CLI |
|---------|---------|------|-----|
| updateCells | yes | yes | `set range`, `append`, `update`, `batch --ops` |
| appendCells | yes | yes | `append`, `batch --ops` |
| insertDimension | yes | yes | `dimension insert` |
| deleteDimension | yes | yes | `dimension delete` |
| updateSheetProperties | yes | yes | `sheet hide` / `show` |
| addSheet | yes | yes | `sheet add` |
| deleteSheet | yes | yes | `sheet delete` |
| duplicateSheet | yes | yes | `sheet duplicate` |
| addConditionalFormatRule | yes | yes | `format conditional-add` |
| deleteConditionalFormatRule | yes | yes | `format conditional-delete` |
| mergeCells | yes | yes | `merge` |
| unmergeCells | yes | yes | `unmerge` |
| updateBorders | yes | partial | `borders` |
| findReplace | yes | yes | `find-replace` |
| sortRange | yes | partial | `sort` |
| setDataValidation | yes | partial | `validate set` |
| addProtectedRange | yes | partial | `protect add` |
| deleteProtectedRange | yes | partial | `protect delete` |
| repeatCell | yes | partial | `request` / `batch-raw` |
| copyPaste | yes | partial | `request` / `batch-raw` |
| pasteData | yes | partial | `paste` |
| autoResizeDimensions | yes | partial | `autoresize` |
| addNamedRange | yes | partial | `named-range add` |
| deleteNamedRange | yes | partial | `named-range delete` |
| All other kinds (see `request list`) | partial | registry | `request run` or `batch-raw` |

## batch --ops

Operations `append`, `updateRow`, `updateKey`, `setRange` are planned into a single `spreadsheets.batchUpdate` call (one or more HTTP chunks if limits require). You can also include `{ "op": "request", "request": { … } }` for raw subrequests in the same batch.

Dry-run returns `requests` with the planned subrequests without calling the API.
