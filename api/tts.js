// api/tts.js — Vercel serverless function
// Converted from netlify/functions/tts.js
import OpenAI from "openai";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is missing." });

    const openai = new OpenAI({ apiKey });
    const { text } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.status(200).send(buffer);

  } catch (err) {
    console.error("TTS error:", err);
    return res.status(500).json({ error: "Failed to generate speech" });
  }
}
