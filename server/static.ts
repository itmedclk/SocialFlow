import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error("Static folder missing:", distPath);
    return;
  }

  app.use(express.static(distPath));

  // EXPRESS 5 FIX — DO NOT USE "*"
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
