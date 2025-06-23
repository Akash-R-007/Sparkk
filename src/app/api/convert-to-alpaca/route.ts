import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Text splitter (simple)
function splitText(text: string, chunkSize = 1024, chunkOverlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const { file_url } = await req.json();

    if (!file_url) {
      return NextResponse.json({ error: "file_url is required" }, { status: 400 });
    }

    const res = await fetch(file_url);
    const content = await res.text();

    const chunks = splitText(content);

    // ✅ Specify stable model version with correct name
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro", // <- this exists in the stable v1 API
    });

    const results: string[] = [];

    for (const chunk of chunks) {
      const result = await model.generateContent(chunk);
      const response = await result.response;
      results.push(response.text());
    }

    return NextResponse.json({ alpaca_format: results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
