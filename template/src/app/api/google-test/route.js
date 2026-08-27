import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const modelName = process.env.GOOGLE_TEST_MODEL || "gemini-2.0-flash";

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
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(
      "Reply with exactly: Google API working",
    );

    return NextResponse.json({
      ok: true,
      model: modelName,
      text: result.response.text(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Google API request failed",
      },
      { status: 500 },
    );
  }
}
