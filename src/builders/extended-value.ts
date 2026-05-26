import type { ValueInputOption } from "../types";

export type CellValueInput = string | number | boolean | null;

export function toExtendedValue(
  value: unknown,
  mode: ValueInputOption
): { userEnteredValue: Record<string, unknown> } {
  if (value === null || value === undefined) {
    return { userEnteredValue: { stringValue: "" } };
  }
  if (typeof value === "number") {
    return { userEnteredValue: { numberValue: value } };
  }
  if (typeof value === "boolean") {
    return { userEnteredValue: { boolValue: value } };
  }
  const s = String(value);
  if (mode === "RAW") {
    return { userEnteredValue: { stringValue: s } };
  }
  if (s.startsWith("=")) {
    return { userEnteredValue: { formulaValue: s } };
  }
  return { userEnteredValue: { stringValue: s } };
}

export function rowFromValues(
  values: unknown[],
  mode: ValueInputOption
): { values: ReturnType<typeof toExtendedValue>[] } {
  return {
    values: values.map((v) => toExtendedValue(v, mode)),
  };
}
