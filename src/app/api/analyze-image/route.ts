import { NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { fileUri, mimeType } = await request.json();

    if (!fileUri || !mimeType) {
      return NextResponse.json(
        { error: "Missing fileUri or mimeType" },
        { status: 400 }
      );
    }

    const result = await analyzeImage(fileUri, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
