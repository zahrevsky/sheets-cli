# batchUpdate coverage matrix

Legend: builder | unit test | CLI command | integration

| Request | Builder | Unit | CLI |
|---------|---------|------|-----|
| updateCells | yes | yes | set range, append, update |
| appendCells | yes | yes | append |
| insertDimension | yes | yes | rows insert |
| updateSheetProperties | yes | yes | sheet hide/show/rename |
| addSheet | yes | yes | sheet add |
| deleteSheet | yes | yes | sheet delete |
| duplicateSheet | yes | yes | sheet duplicate |
| addConditionalFormatRule | yes | yes | format conditional add |
| updateConditionalFormatRule | yes | yes | format conditional update |
| deleteConditionalFormatRule | yes | yes | format conditional delete |
| mergeCells | yes | yes | merge |
| unmergeCells | yes | yes | unmerge |
| updateBorders | yes | yes | format borders |
| findReplace | yes | yes | find-replace |
| sortRange | yes | yes | sort |
| setDataValidation | yes | yes | validate set |
| addProtectedRange | yes | yes | protect add |
| deleteProtectedRange | yes | yes | protect delete |
| repeatCell | yes | yes | batch raw |
| copyPaste | yes | yes | batch raw |
| pasteData | yes | yes | paste |
| autoResizeDimensions | yes | yes | autoresize |
| addNamedRange | yes | yes | named-range add |
| deleteNamedRange | yes | yes | named-range delete |
| All other kinds | batch raw | registry test | batch raw |

Use `sheets-cli batch raw --requests '<json>'` for any subrequest not listed with a dedicated command.
