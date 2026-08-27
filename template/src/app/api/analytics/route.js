// app/api/admin/analytics/route.js
// import {
//   getAnalyticsSettings,
//   updateAnalyticsSettings,
// } from "@/src/app/lib/services/analytics.service";

import {
  getAnalyticsSettings,
  updateAnalyticsSettings,
} from "../../lib/services/seo/analytics.service";

export async function GET() {
  const data = await getAnalyticsSettings();

  return Response.json({
    success: true,
    data,
  });
}

export async function PUT(req) {
  const body = await req.json();

  const data = await updateAnalyticsSettings(body);

  return Response.json({
    success: true,
    message: "Analytics settings updated successfully.",
    data,
  });
}
