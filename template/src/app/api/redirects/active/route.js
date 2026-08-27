import { prisma } from "@/src/app/lib/prisma";

export async function GET() {
  try {
    const redirects = await prisma.redirect.findMany({
      where: { isActive: true },
      select: {
        sourceUrl: true,
        destinationUrl: true,
        statusCode: true,
        id: true,
      },
    });

    return Response.json({ success: true, data: redirects });
  } catch (error) {
    console.error("Error fetching redirects:", error);
    return Response.json(
      { success: false, error: "Failed to fetch redirects" },
      { status: 500 }
    );
  }
}
