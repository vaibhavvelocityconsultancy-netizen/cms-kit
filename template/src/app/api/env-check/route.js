// app/api/debug-auth/route.ts

import { requireAuth } from "@/src/app/lib/withPermission";

export async function GET() {
  try {
    const session = await requireAuth();
    return Response.json({
      session,
      authenticated: true,
    });
  } catch (error) {
    return Response.json(
      {
        authenticated: false,
        error: error.message,
      },
      { status: 401 },
    );
  }
}
