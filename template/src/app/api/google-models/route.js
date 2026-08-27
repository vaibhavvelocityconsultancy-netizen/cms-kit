import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "GOOGLE_API_KEY or GEMINI_API_KEY is not set",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { cache: "no-store" },
    );
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: data?.error?.message || "Failed to fetch Google models",
        },
        { status: response.status },
      );
    }

    const models = (data.models || [])
      .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
      .map((model) => ({
        name: model.name?.replace("models/", ""),
        displayName: model.displayName,
        supportedGenerationMethods: model.supportedGenerationMethods,
      }));

    return NextResponse.json({
      ok: true,
      models,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to fetch Google models",
      },
      { status: 500 },
    );
  }
}
