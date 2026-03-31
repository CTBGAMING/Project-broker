// api/project-bot.js — Vercel serverless function
// Converted from netlify/functions/project-bot.js
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
    const body = req.body || {};

    const { messages = [], current_form = {}, category_defs = [], mode = "events" } = body;

    let categoryInstructions = "";
    if (category_defs && category_defs.length > 0) {
      categoryInstructions = category_defs.map(cat => {
        const fieldsToAsk = cat.fields.map(f => f.label).join(', ');
        return `- If the user needs **${cat.key}**, you MUST probe for: ${fieldsToAsk}.`;
      }).join('\n');
    }

    const roleName = mode === "construction"
      ? "Project Builder (Construction Expert)"
      : "Event Pro (Event Specialist)";

    let modeSpecificRules = "";
    if (mode === "construction") {
      modeSpecificRules = `
CONSTRUCTION SPECIFIC RULES:
1. Identify the exact trade categories needed (e.g., if they want tiling, choose "Flooring").
2. STRICT ISOLATION: NEVER mix up questions between categories.
3. Ask 1 or 2 logical, trade-specific questions from the list above.
4. Set "service_focus" strictly to the matched category names (e.g., "Flooring").
      `;
    } else {
      modeSpecificRules = `
EVENT SPECIFIC RULES:
1. Identify the exact event services needed based on the user's request.
2. Ask 1 or 2 targeted questions from the list above.
3. Set "service_focus" strictly to the exact category names (e.g., "Catering, Decor").
      `;
    }

    const SYSTEM_PROMPT = `
You are ${roleName} — a warm, highly experienced Cape Town consultant.
Your goal is to extract EXACT details to build a comprehensive project brief so vendors/contractors can quote accurately without having to guess.

Tone: Friendly, calm, professional but relaxed. Short paragraphs. South African English nuances are welcome.

CORE RULE: Do not just passively accept basic info. You must PROBE for specifics like a true professional.

SERVICES & REQUIRED DETAILS TO ASK ABOUT:
${categoryInstructions || "Probe for specific details based on the user's request."}

${modeSpecificRules}

GENERAL INSTRUCTIONS:
1. Do NOT overwhelm the user with a massive list of questions. Ask 1 or 2 targeted questions per message in a natural, conversational way.
2. LOCATION IS MANDATORY: If the user hasn't mentioned their specific suburb or area yet, you MUST explicitly ask for it before finishing up.
3. MISSING MEASUREMENTS: If the user states they don't know the measurements, area, or size, reassure them it's no problem and explicitly ask them to upload a few photos using the upload button so contractors can gauge the scale.
4. Once you have the core info (LOCATION, scale/photos, specific details) AND the specific details for their requested services, provide a realistic Cape Town price range (in ZAR) and ask if they are ready to post the project.
5. When the user confirms they want to post (e.g., "post it", "create my project", "looks good, let's post"), set "ready_to_post": true.

Return ONLY this valid JSON format:
{
  "assistant_message": "Your conversational reply here",
  "draft_update": {
    "project_name": "Short Name",
    "location": "Suburb",
    "description": "Detailed description of the exact requirements and vibe discussed so far",
    "guest_count": "Number (if event)",
    "event_date": "YYYY-MM-DD (if event)",
    "event_type": "Type (if event)",
    "budget": "Number",
    "service_focus": "Comma separated list of services (e.g., Catering, Decor OR Flooring, Plumbing)"
  },
  "estimate": {
    "low": number,
    "high": number,
    "confidence": 0.8,
    "factors": ["Factor affecting price 1", "Factor affecting price 2"]
  },
  "ready_to_post": boolean
}
`.trim();

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-15),
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 3000,
      messages: chatMessages,
      response_format: { type: "json_object" },
    });

    const rawContent = completion.choices[0].message.content;
    const cleanedContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanedContent);

    // Generate TTS audio
    let audioBase64 = null;
    if (parsed.assistant_message) {
      try {
        const spokenText = parsed.assistant_message.replace(
          /R(\d{1,3}(?:,\d{3})*)/g,
          (match, num) => num.replace(/,/g, "") + " Rand"
        );
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova",
          input: spokenText,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        audioBase64 = buffer.toString("base64");
      } catch (audioErr) {
        console.error("TTS Generation failed:", audioErr);
      }
    }

    return res.status(200).json({
      assistant_message: parsed.assistant_message || "I've noted that down!",
      draft_update: parsed.draft_update || null,
      estimate: parsed.estimate || null,
      ready_to_post: parsed.ready_to_post || false,
      audioBase64,
    });
  } catch (err) {
    console.error("project-bot error:", err);
    return res.status(500).json({
      error: "Event Pro had a quick hiccup — could you repeat that last detail?",
    });
  }
}
