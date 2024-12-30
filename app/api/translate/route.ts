import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");

  if (!text) {
    return NextResponse.json({ error: "Text parameter is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: 'en',
          target: 'vi',
          format: 'text'
        })
      }
    );

    if (!response.ok) {
      throw new Error("Translation API error");
    }

    const data = await response.json();
    const translation = data.data?.translations?.[0]?.translatedText || "No translation found";

    return NextResponse.json({
      text: translation,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
