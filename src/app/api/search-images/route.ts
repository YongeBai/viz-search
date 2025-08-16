import { NextRequest, NextResponse } from "next/server";
import { searchImages } from "@/lib/gemini";
import { ProcessedImage } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { query, images }: { query: string; images: ProcessedImage[] } = await request.json();

    if (!query || !images) {
      return NextResponse.json(
        { error: "Missing query or images" },
        { status: 400 }
      );
    }

    const result = await searchImages(query, images);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error searching images:", error);
    return NextResponse.json(
      { error: "Failed to search images" },
      { status: 500 }
    );
  }
}
