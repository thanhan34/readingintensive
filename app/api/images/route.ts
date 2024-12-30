import { NextResponse } from "next/server";
import { createApi } from "unsplash-js";
import nodeFetch from "node-fetch";

// Initialize the Unsplash API client
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  fetch: nodeFetch as unknown as typeof fetch,
});

export async function GET(request: Request) {
  console.log("Received image search request");
  
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      console.warn("Missing query parameter");
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      );
    }

    if (!process.env.UNSPLASH_ACCESS_KEY) {
      console.error("Unsplash API key is not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    console.log(`Searching Unsplash for: ${query}`);
    
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 4,
      orientation: "landscape",
      orderBy: "relevant",
    });

    if (!result.response) {
      console.warn(`No response from Unsplash for query: ${query}`);
      return NextResponse.json(
        { error: "No images found" },
        { status: 404 }
      );
    }

    if (result.response.results.length === 0) {
      console.warn(`No images found for query: ${query}`);
      return NextResponse.json(
        { error: "No images found for the given query" },
        { status: 404 }
      );
    }

    const urls = result.response.results.map((photo) => ({
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || query,
      credit: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
      blur_hash: photo.blur_hash,
      width: photo.width,
      height: photo.height,
    }));

    console.log(`Successfully found ${urls.length} images for query: ${query}`);

    return NextResponse.json({
      urls,
      total: result.response.total,
      total_pages: result.response.total_pages,
    });
  } catch (error) {
    console.error("Unexpected error in image search:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
