import { google } from "googleapis";
import type { Campaign, Post } from "@shared/schema";
import { storage } from "../storage";

const DEFAULT_SHEET_NAME = "Posts";

async function getTargetSheetName(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
): Promise<string> {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = spreadsheet.data.sheets || [];
  const sheetTitles = existingSheets
    .map((sheet) => sheet.properties?.title)
    .filter((title): title is string => Boolean(title));

  if (sheetTitles.includes(DEFAULT_SHEET_NAME)) {
    return DEFAULT_SHEET_NAME;
  }

  if (sheetTitles.length > 0) {
    return sheetTitles[0];
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: DEFAULT_SHEET_NAME,
            },
          },
        },
      ],
    },
  });

  return DEFAULT_SHEET_NAME;
}

export async function appendPostToSheet(
  post: Post,
  campaign: Campaign,
  captionOverride?: string | null,
): Promise<void> {
  if (!campaign.userId) {
    throw new Error("Campaign userId is required for Google Sheets logging");
  }

  const settings = await storage.getUserSettings(campaign.userId);
  if (!settings?.googleRefreshToken) {
    throw new Error("Google account is not connected");
  }
  if (!settings.googleClientId || !settings.googleClientSecret) {
    throw new Error("Google OAuth client credentials are missing");
  }
  if (!settings.googleSpreadsheetId) {
    throw new Error("Google Spreadsheet ID is missing");
  }

  const redirectUri =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "https://social-flow-v-1.replit.app/api/google/oauth/callback";

  const auth = new google.auth.OAuth2(
    settings.googleClientId,
    settings.googleClientSecret,
    redirectUri,
  );
  auth.setCredentials({ refresh_token: settings.googleRefreshToken });

  const sheets = google.sheets({ version: "v4", auth });

  const caption = captionOverride || post.generatedCaption || "";
  const row = [
    new Date().toISOString(),
    post.id?.toString() || "",
    campaign.name || "",
    post.sourceTitle || "",
    post.sourceUrl || "",
    caption,
    post.imageUrl || "",
    post.imageCredit || "",
  ];

  const targetSheet = await getTargetSheetName(
    sheets,
    settings.googleSpreadsheetId,
  );

  await sheets.spreadsheets.values.append({
    spreadsheetId: settings.googleSpreadsheetId,
    range: `${targetSheet}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
}
