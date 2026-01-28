import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.join(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(`Missing build folder: ${distPath}`);
  }

  app.use("/", express.static(distPath));

  // Express v5 requires regex instead of "*"
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
