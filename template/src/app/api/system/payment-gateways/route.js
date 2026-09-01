import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const configPath = path.resolve(process.cwd(), "cmskit.config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return Response.json({ gateways: config.paymentGateways ?? [] });
  } catch {
    return Response.json({ gateways: [] });
  }
}
