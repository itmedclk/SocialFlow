import path from "path";
import express, { type Express } from "express";

export function serveStatic(app: Express) {
  const publicDir = path.join(process.cwd(), "dist/public");

  app.use(express.static(publicDir));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
