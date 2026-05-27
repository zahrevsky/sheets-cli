import type { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

export type SpreadsheetFile = {
  id: string;
  name: string;
  url: string | null;
  modified: string | null;
  origin: "my_drive" | "shared_drive" | "shared_with_me";
  driveId: string | null;
  owners: { displayName: string | null; email: string | null }[];
  parentIds: string[];
};

export type ListSpreadsheetsResult = {
  spreadsheets: SpreadsheetFile[];
  count: number;
  nextPageToken: string | null;
};

const SPREADSHEET_MIME = "application/vnd.google-apps.spreadsheet";

function escapeDriveQueryLiteral(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export function buildSpreadsheetsListQuery(nameQuery?: string): string {
  const parts = [`mimeType='${SPREADSHEET_MIME}'`, "trashed=false"];
  const trimmed = nameQuery?.trim();
  if (trimmed) {
    parts.push(`name contains '${escapeDriveQueryLiteral(trimmed)}'`);
  }
  return parts.join(" and ");
}

export async function listSpreadsheetsInDrive(
  auth: OAuth2Client,
  opts: {
    nameQuery?: string;
    limit?: number;
    pageToken?: string;
  } = {}
): Promise<ListSpreadsheetsResult> {
  const drive = google.drive({ version: "v3", auth });
  const pageSize = Math.min(Math.max(opts.limit ?? 100, 1), 1000);

  const res = await drive.files.list({
    q: buildSpreadsheetsListQuery(opts.nameQuery),
    fields:
      "nextPageToken, files(id, name, webViewLink, modifiedTime, driveId, ownedByMe, owners(displayName,emailAddress), parents)",
    pageSize,
    pageToken: opts.pageToken,
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = res.data.files ?? [];
  return {
    spreadsheets: files
      .filter((f): f is typeof f & { id: string; name: string } =>
        Boolean(f.id && f.name)
      )
      .map((f) => ({
        id: f.id,
        name: f.name,
        url: f.webViewLink ?? null,
        modified: f.modifiedTime ?? null,
        origin: (() => {
          if (f.driveId) {
            return "shared_drive";
          }
          if (f.ownedByMe) {
            return "my_drive";
          }
          return "shared_with_me";
        })(),
        driveId: f.driveId ?? null,
        owners:
          f.owners?.map((o) => ({
            displayName: o.displayName ?? null,
            email: o.emailAddress ?? null,
          })) ?? [],
        parentIds: f.parents ?? [],
      })),
    count: files.length,
    nextPageToken: res.data.nextPageToken ?? null,
  };
}
