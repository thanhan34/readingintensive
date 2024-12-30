import { NextResponse } from "next/server";
import { createApi } from "unsplash-js";
import nodeFetch from "node-fetch";

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY!,
  fetch: nodeFetch as unknown as typeof fetch,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 4,
      orientation: "landscape",
    });

    if (!result.response) {
      throw new Error("No images found");
    }

    const urls = result.response.results.map((photo) => ({
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || query,
      credit: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    }));

    return NextResponse.json({
      urls,
    });
  } catch (error) {
    console.error("Unsplash API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}
