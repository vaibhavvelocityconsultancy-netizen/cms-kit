import fs from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    const configPath = path.resolve(process.cwd(), "cmskit.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return Response.json({ modules: config.modules ?? [] });
  } catch {
    return Response.json({ modules: [] });
  }
}