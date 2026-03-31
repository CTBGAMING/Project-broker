// server/server.cjs
const express = require('express');
const cors = require('cors');
const { config } = require('dotenv');
const OpenAI = require('openai');

config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// -------------------------------------------------------------------
// 1. PROJECT BUILDER CHATBOT ENDPOINT (Synced Audio + Strict Categories)
// -------------------------------------------------------------------
app.post('/api/project-bot', async (req, res) => {
  try {
    const { messages = [], current_form = {}, category_defs = [], mode = "events" } = req.body;

    let categoryInstructions = "";
    if (category_defs && category_defs.length > 0) {
      categoryInstructions = category_defs.map(cat => {
        const fieldsToAsk = cat.fields.map(f => f.label).join(', ');
        return `- If the user needs **${cat.key}**, you MUST probe for: ${fieldsToAsk}.`;
      }).join('\n');
    }

    const roleName = mode === "construction" ? "Project Builder (Construction Expert)" : "Event Pro (Event Specialist)";

    // Strictly isolate the logic based on the mode so the AI doesn't mix them up
    let modeSpecificRules = "";
    if (mode === "construction") {
      modeSpecificRules = `
CONSTRUCTION SPECIFIC RULES:
1. Identify the exact trade categories needed (e.g., if they want tiling, choose "Flooring").
2. STRICT ISOLATION: NEVER mix up questions between categories. For example, NEVER ask about "coats" (Painting) for a tiling/flooring job. NEVER ask about wall prep unless they explicitly requested a painter.
3. Ask 1 or 2 logical, trade-specific questions from the list above.
4. Set "service_focus" strictly to the matched category names (e.g., "Flooring").
      `;
    } else {
      modeSpecificRules = `
EVENT SPECIFIC RULES:
1. Identify the exact event services needed based on the user's request.
2. Ask 1 or 2 targeted questions from the list above (e.g., "For the catering, will you need Halaal or vegan options?").
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
`;

    const chatMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-15)
    ];

    // 1. Generate Text
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7, 
      max_tokens: 3000, 
      messages: chatMessages,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0].message.content;
    const cleanedContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedContent);

    // 2. Instantly generate audio for the assistant's message BEFORE sending to frontend
    let audioBase64 = null;
    if (parsed.assistant_message) {
      try {
        // Fix the "Rand" pronunciation for the AI
        const spokenText = parsed.assistant_message.replace(/R(\d{1,3}(?:,\d{3})*)/g, (match, num) => {
          return num.replace(/,/g, '') + " Rand";
        });

        const mp3 = await openai.audio.speech.create({
          model: "tts-1", // tts-1 is optimized for ultra-low latency
          voice: "nova",
          input: spokenText,
        });
        
        const buffer = Buffer.from(await mp3.arrayBuffer());
        audioBase64 = buffer.toString('base64'); // Encode MP3 as text string
      } catch (audioErr) {
        console.error("Inline TTS Generation failed:", audioErr);
      }
    }

    // 3. Send Text + Audio together
    res.json({
      assistant_message: parsed.assistant_message || "I've noted that down!",
      draft_update: parsed.draft_update || null,
      estimate: parsed.estimate || null,
      ready_to_post: parsed.ready_to_post || false,
      audioBase64: audioBase64 // The new synchronized audio payload
    });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "Event Pro had a quick hiccup — could you repeat that last detail?" });
  }
});

// -------------------------------------------------------------------
// 2. TEXT-TO-SPEECH (TTS) ENDPOINT (Kept for standalone requests like uploads)
// -------------------------------------------------------------------
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova", 
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length
    });
    res.send(buffer);
  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AI Server running on http://localhost:${PORT}/api/project-bot`);
});