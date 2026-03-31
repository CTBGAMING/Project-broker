import OpenAI from "openai";

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  },
  body: JSON.stringify(body),
});

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getOutputText(resp) {
  try {
    const content = resp?.output?.[0]?.content || [];
    const firstText = content.find((c) => c?.type === "output_text")?.text;
    return typeof firstText === "string" ? firstText : "";
  } catch {
    return "";
  }
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return json(200, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return json(500, { error: "OPENAI_API_KEY is missing in Netlify env vars." });

    const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const openai = new OpenAI({ apiKey });

    const body = event.body ? JSON.parse(event.body) : {};
    const text = safeStr(body.text || "");
    const images = Array.isArray(body.images) ? body.images.map((u) => safeStr(u)).filter(Boolean).slice(0, 6) : [];

    const system = `
You are "Project Broker Estimator".

NON-NEGOTIABLE RULES:
- NEVER ask the customer for a budget or budget range.
- If a budget is mentioned by the user, you may reference it, but do not ask follow-up budget questions.
- NEVER use USD or "$". All money must be in South African Rand (ZAR) using "R".
- Provide a realistic estimate RANGE as soon as possible.

Output requirements:
- Provide a concise human-friendly summary.
- Provide a structured breakdown with:
  - total_low, total_high (integers, ZAR)
  - confidence (0.0–1.0 or null)
  - assumptions (3–6 bullets)
  - factors (3–6 bullets that drive price)
  - questions (0–2 short questions ONLY if absolutely needed)
Do not invent measurements or materials if missing; list assumptions instead.
`.trim();

    // Strict schema so the model can’t drift into random formatting
    const schema = {
      name: "pb_consultant_estimate",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          reply: { type: "string" },
          estimate: {
            type: "object",
            additionalProperties: false,
            properties: {
              total_low: { type: "number" },
              total_high: { type: "number" },
              confidence: { anyOf: [{ type: "number" }, { type: "null" }] },
              assumptions: { type: "array", items: { type: "string" } },
              factors: { type: "array", items: { type: "string" } },
              questions: { type: "array", items: { type: "string" } },
            },
            required: ["total_low", "total_high", "confidence", "assumptions", "factors", "questions"],
          },
        },
        required: ["reply", "estimate"],
      },
    };

    const input = [
      { role: "system", content: [{ type: "input_text", text: system }] },
      {
        role: "user",
        content: [
          { type: "input_text", text: text || "Please provide an estimate." },
          ...images.map((url) => ({ type: "input_image", image_url: url })),
        ],
      },
    ];

    const resp = await openai.responses.create({
      model: MODEL,
      input,
      temperature: 0.2,
      text: {
        format: {
          type: "json_schema",
          json_schema: schema,
        },
      },
    });

    const raw = getOutputText(resp) || "{}";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json(200, {
        reply: "I had trouble formatting the estimate. Please try again with a short description and 1–2 photos.",
        estimate: {
          total_low: 0,
          total_high: 0,
          confidence: null,
          assumptions: [],
          factors: [],
          questions: [],
        },
      });
    }

    // Shape + enforce ZAR + no USD symbols
    const low = safeNum(parsed?.estimate?.total_low) ?? 0;
    const high = safeNum(parsed?.estimate?.total_high) ?? 0;

    const safe = {
      reply: safeStr(parsed?.reply || ""),
      estimate: {
        total_low: Math.max(0, Math.round(low)),
        total_high: Math.max(Math.round(low), Math.round(high)),
        confidence:
          parsed?.estimate?.confidence == null
            ? null
            : Math.min(1, Math.max(0, Number(parsed.estimate.confidence))),
        assumptions: Array.isArray(parsed?.estimate?.assumptions)
          ? parsed.estimate.assumptions.map(safeStr).filter(Boolean).slice(0, 10)
          : [],
        factors: Array.isArray(parsed?.estimate?.factors)
          ? parsed.estimate.factors.map(safeStr).filter(Boolean).slice(0, 10)
          : [],
        questions: Array.isArray(parsed?.estimate?.questions)
          ? parsed.estimate.questions.map(safeStr).filter(Boolean).slice(0, 2)
          : [],
      },
    };

    // Belt + braces: strip USD/$ if it ever appears
    safe.reply = safe.reply.replace(/\bUSD\b/gi, "ZAR").replace(/\$/g, "R");
    safe.estimate.assumptions = safe.estimate.assumptions.map((s) => s.replace(/\bUSD\b/gi, "ZAR").replace(/\$/g, "R"));
    safe.estimate.factors = safe.estimate.factors.map((s) => s.replace(/\bUSD\b/gi, "ZAR").replace(/\$/g, "R"));
    safe.estimate.questions = safe.estimate.questions.map((s) => s.replace(/\bUSD\b/gi, "ZAR").replace(/\$/g, "R"));

    return json(200, safe);
  } catch (err) {
    return json(500, { error: err?.message || "Consultant failed" });
  }
}