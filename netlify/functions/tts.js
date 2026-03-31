// netlify/functions/tts.js
import OpenAI from "openai";

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders() };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: "OPENAI_API_KEY is missing." }) };

    const openai = new OpenAI({ apiKey });
    const { text } = JSON.parse(event.body || "{}");

    if (!text) {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "Text is required" }) };
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error("TTS error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Failed to generate speech" }),
    };
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
