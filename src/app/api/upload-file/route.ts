import { NextRequest, NextResponse } from "next/server";
import { uploadImageToGemini } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log('Attempting to upload file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const fileUri = await uploadImageToGemini(file);
    
    console.log('Upload successful, fileUri:', fileUri);
    return NextResponse.json({ fileUri });
  } catch (error) {
    console.error("Detailed error uploading file:", {
      error: error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
