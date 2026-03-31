
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function safeObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}
function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normalizeMode(v) {
  const t = safeStr(v).toLowerCase();
  return t === "construction" ? "construction" : "events";
}
function modeLabel(mode) {
  return mode === "construction" ? "construction/services" : "events";
}
function buildCategorySummary(defs = []) {
  return (Array.isArray(defs) ? defs : [])
    .map((c) => {
      const key = safeStr(c?.key || c?.name);
      const fields = Array.isArray(c?.fields)
        ? c.fields
            .map((f) => `${safeStr(f?.name)}${f?.type ? `(${safeStr(f.type)})` : ""}`)
            .filter(Boolean)
            .join(", ")
        : "";
      return `- ${key}${fields ? `: ${fields}` : ""}`;
    })
    .filter(Boolean)
    .join("\n");
}
function buildUploadsSummary(uploads = []) {
  return (Array.isArray(uploads) ? uploads : [])
    .filter((u) => u && u.file_url)
    .slice(0, 12)
    .map((u) => `- ${u.media_type || "image"}: ${u.file_url}`)
    .join("\n");
}
function eventQuestionGuide() {
  return [
    "Always qualify the event with: event type, date/flexibility, suburb/city, guest count, venue type, and which services are needed.",
    "Before a firm estimate, ask about timing: setup start, guest arrival, event end, and whether breakdown/cleanup is needed.",
    "Ask service-specific follow-ups only for the services that are enabled or clearly mentioned.",
    "For Catering: service style, adults vs children, dietary restrictions, crockery/cutlery/staffing.",
    "For Decor: theme/style, colours, tables/chairs/linen, backdrop/flowers/balloons/signage, setup only or setup + breakdown.",
    "For DJ / Entertainment: entertainment type, hours, sound/mics/lighting needs, formalities or speeches.",
    "For Photography / Videography: hours, deliverables, must-capture moments.",
    "For Venue or Logistics: indoor/outdoor, weather backup, access times, stairs/lift/loading, power, parking, venue restrictions, noise cutoff."
  ].join("\n");
}
function constructionQuestionGuide() {
  return [
    "Always qualify the job with: trade/category, suburb/city, desired outcome or problem, urgency/timeline, and property type.",
    "Before a firmer estimate, ask about quantity/size/measurements, site access, occupancy, and whether materials are customer-supplied or contractor-supplied.",
    "Ask trade-specific follow-ups only for the trades that are enabled or clearly mentioned.",
    "For Plumbing: leak/blockage/install/replace, affected fixtures, hot/cold water, visible damage, shutoff access.",
    "For Electrical: fault/install/upgrade, number of points/fixtures, DB board or breaker issues, certificate of compliance needed, power downtime allowed.",
    "For Painting: interior/exterior, number of rooms/walls, prep/cracks/peeling, colour changes, ceilings/trim included.",
    "For Tiling/Flooring: area size, tile type/size, remove old finish, substrate condition, waterproofing/levelling needed.",
    "For Roofing/Waterproofing: roof type, leak points, height/access, storm damage, gutters/flashing, urgency.",
    "For Carpentry/Custom work: what is being built, approximate dimensions, finish/material preference, install location, bespoke/custom complexity."
  ].join("\n");
}
function buildSystemPrompt(mode, categoryDefs) {
  const defs = buildCategorySummary(categoryDefs) || "(none supplied)";
  const modeSpecific = mode === "construction" ? constructionQuestionGuide() : eventQuestionGuide();

  return `
You are Project Broker Assistant for ${modeLabel(mode)} in South Africa.

Your job:
1. Have a natural conversation.
2. Ask enough smart follow-up questions so professionals can quote accurately.
3. Give an expected price range in South African Rand once you have enough detail.
4. Ask whether the customer wants to go ahead and create/post the project.

Style rules:
- Sound warm, practical, and concise.
- Acknowledge what the user said in one short sentence.
- Ask EXACTLY ONE best next question each turn.
- Do not dump a long questionnaire unless the user explicitly asks for a checklist.
- Never ask for budget first. If the user volunteers a budget, store it quietly.
- Never use USD or "$". Use "R".
- Do not repeat a question if the answer already appears in the current form or chat history.
- If a photo would materially improve pricing accuracy, request it.

Mode-specific guidance:
${modeSpecific}

Available categories/services:
${defs}

Strict output requirements:
Return ONLY valid JSON with this exact shape:
{
  "assistant_message": string,
  "draft_update": object,
  "estimate": { "low": number, "high": number, "confidence": number|null, "factors": string[] } | null,
  "ready_to_post": boolean,
  "photo_request": { "ask": boolean, "reason": string, "shots": string[] },
  "missing_fields": string[]
}

Draft update rules:
- For construction, prefer keys: project_name, location, categories.
- For events, prefer keys: event_name, event_type, event_date, guest_count, location, budget, description, services.
- Preserve existing nested service/category data when possible and only add/overwrite fields you learned confidently.
- If you mention an estimate in assistant_message, it must match the estimate object.
- Set ready_to_post=true only when the customer has enough detail for a professional to quote and they clearly said yes/proceed/post/create.
`.trim();
}
function inferReadyToPost(userText, parsedReady) {
  if (parsedReady) return true;
  const t = safeStr(userText).toLowerCase();
  return [
    "go ahead", "post it", "post now", "create project", "create my project", "publish it",
    "yes post", "yes create", "please proceed", "make it live"
  ].some((x) => t.includes(x));
}
function deepMerge(base, patch) {
  if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
  const out = { ...safeObj(base) };
  for (const [k, v] of Object.entries(safeObj(patch))) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMerge(out[k], v);
    } else if (v !== null && v !== undefined && v !== "") {
      out[k] = v;
    }
  }
  return out;
}
function sanitizeEstimate(estimateIn) {
  const estimateObj = safeObj(estimateIn);
  const low = safeNum(estimateObj.low);
  const high = safeNum(estimateObj.high);
  if (low == null || high == null) return null;
  const conf = estimateObj.confidence == null ? null : safeNum(estimateObj.confidence);
  return {
    low: Math.max(0, Math.round(low)),
    high: Math.max(Math.round(low), Math.round(high)),
    confidence: conf == null ? null : Math.max(0, Math.min(1, conf)),
    factors: Array.isArray(estimateObj.factors)
      ? estimateObj.factors.map((x) => safeStr(x)).filter(Boolean).slice(0, 8)
      : [],
  };
}
function eventDraft(currentForm, draftUpdate) {
  const next = { ...safeObj(currentForm) };
  for (const key of ["event_name", "event_type", "event_date", "guest_count", "location", "budget", "description"]) {
    if (draftUpdate[key] !== null && draftUpdate[key] !== undefined && draftUpdate[key] !== "") next[key] = draftUpdate[key];
  }
  next.services = deepMerge(currentForm.services, draftUpdate.services);
  if (!next.event_name && draftUpdate.project_name) next.event_name = draftUpdate.project_name;
  if (!next.project_name) next.project_name = next.event_name || draftUpdate.project_name || currentForm.project_name || "";
  const selected = Object.entries(safeObj(next.services)).filter(([,v]) => safeObj(v).enabled);
  if (!selected.length && Array.isArray(draftUpdate?.service_focus)) {
    for (const name of draftUpdate.service_focus) next.services[name] = { ...(next.services?.[name] || {}), enabled: true };
  }
  return next;
}
function constructionDraft(currentForm, draftUpdate) {
  const next = { ...safeObj(currentForm) };
  if (draftUpdate.project_name !== null && draftUpdate.project_name !== undefined && draftUpdate.project_name !== "") next.project_name = draftUpdate.project_name;
  if (draftUpdate.location !== null && draftUpdate.location !== undefined && draftUpdate.location !== "") next.location = draftUpdate.location;
  next.categories = deepMerge(currentForm.categories, draftUpdate.categories);
  return next;
}

app.post("/api/project-bot", async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "OPENAI_API_KEY is missing." });

    const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
    const openai = new OpenAI({ apiKey });

    const body = req.body || {};
    const mode = normalizeMode(body.mode);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const currentForm = safeObj(body.current_form);
    const categoryDefs = Array.isArray(body.category_defs) ? body.category_defs : [];
    const uploads = Array.isArray(body.uploads) ? body.uploads : [];

    const system = buildSystemPrompt(mode, categoryDefs);
    const context = `Current form:\n${JSON.stringify(currentForm)}\n\nUploaded media:\n${buildUploadsSummary(uploads) || "(none)"}`;

    const chatMessages = [
      { role: "system", content: system },
      { role: "user", content: context },
      ...messages.filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string").slice(-20),
    ];

    const completion = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.25,
      messages: chatMessages,
      response_format: { type: "json_object" },
    });

    let parsed = {};
    try {
      parsed = JSON.parse(completion.choices?.[0]?.message?.content || "{}");
    } catch {
      parsed = {};
    }

    const draftIn = safeObj(parsed.draft_update);
    const draftUpdate = mode === "construction" ? constructionDraft(currentForm, draftIn) : eventDraft(currentForm, draftIn);
    const estimate = sanitizeEstimate(parsed.estimate);
    const userText = messages.length ? safeStr(messages[messages.length - 1]?.content) : "";

    const response = {
      assistant_message: safeStr(parsed.assistant_message || "Got it. Tell me a little more so I can price this properly."),
      draft_update: draftUpdate,
      estimate,
      ready_to_post: inferReadyToPost(userText, Boolean(parsed.ready_to_post)),
      photo_request: {
        ask: Boolean(parsed?.photo_request?.ask),
        reason: safeStr(parsed?.photo_request?.reason),
        shots: Array.isArray(parsed?.photo_request?.shots) ? parsed.photo_request.shots.map((x) => safeStr(x)).filter(Boolean).slice(0, 6) : [],
      },
      missing_fields: Array.isArray(parsed?.missing_fields) ? parsed.missing_fields.map((x) => safeStr(x)).filter(Boolean).slice(0, 12) : [],
    };

    return res.json(response);
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Project bot failed",
      hint: "Check server logs for API key, model access, or quota issues.",
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
