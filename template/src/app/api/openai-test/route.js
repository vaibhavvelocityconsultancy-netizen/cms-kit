import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TEST_MODEL || "gpt-4.1-mini";

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "OPENAI_API_KEY is not set",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: "Reply with exactly: OpenAI API working",
        max_output_tokens: 20,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: data?.error?.message || "OpenAI request failed",
        },
        { status: response.status },
      );
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.map((content) => content.text)
        ?.filter(Boolean)
        ?.join("\n") ||
      "";

    return NextResponse.json({
      ok: true,
      model,
      text,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "OpenAI request failed",
      },
      { status: 500 },
    );
  }
}
