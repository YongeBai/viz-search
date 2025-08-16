import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasApiKey: !!process.env.GOOGLE_AI_API_KEY,
    keyLength: process.env.GOOGLE_AI_API_KEY?.length || 0,
    keyPrefix: process.env.GOOGLE_AI_API_KEY?.substring(0, 6) + "...",
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}
