import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are DocMind AI, a document question-answering assistant. Answer questions based on the provided document content. If the answer cannot be found in the document, clearly state "No relevant information found in the document." Be concise and accurate, citing specific content from the document.`;

function getClient() {
  return new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

function findRelevantChunks(question: string, chunks: string[]): string[] {
  const keywords = question
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  if (keywords.length === 0) return chunks.slice(0, 5);

  const scored = chunks.map((chunk) => {
    const lower = chunk.toLowerCase();
    const score = keywords.reduce((sum, kw) => {
      const regex = new RegExp(kw, "gi");
      const matches = lower.match(regex);
      return sum + (matches ? matches.length : 0);
    }, 0);
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((s) => s.chunk);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, chunks } = body as {
      question: string;
      chunks: string[];
    };

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: "Document chunks are required" },
        { status: 400 }
      );
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const relevantChunks = findRelevantChunks(question, chunks);

    const context = relevantChunks
      .map((chunk, i) => `[Chunk ${i + 1}]\n${chunk}`)
      .join("\n\n");

    const client = getClient();
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Here are the relevant document excerpts:\n\n${context}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const answer =
      completion.choices[0]?.message?.content ?? "Unable to generate a response";

    return NextResponse.json({
      answer,
      relevantChunks,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `DeepSeek API error: ${error.message}` },
        { status: error.status || 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
