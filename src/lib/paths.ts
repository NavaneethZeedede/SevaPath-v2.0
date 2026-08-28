import path from "path";
import fs from "fs";

// Vercel's serverless filesystem is read-only except /tmp. Locally we use ./data.
export const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "sevapath-data")
  : path.join(process.cwd(), "data");

if (typeof window === "undefined" && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
