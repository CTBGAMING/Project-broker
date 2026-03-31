
/**
 * AI Analyzer - Supabase Edge Function (Node)
 * - POST { image_url: string, category: string }
 * - Calls OpenAI to generate a text description and a rough cost estimate
 * Requires env var: OPENAI_API_KEY
 */

import fetch from 'node-fetch';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export default async function handler(req) {
  try {
    const body = await req.json();
    const imageUrl = body.image_url;
    const category = body.category || 'general repair';

    if(!imageUrl) return new Response(JSON.stringify({ error: 'image_url required' }), { status: 400 });

    // Build prompt for OpenAI
    const prompt = `You are an expert tradesperson. A customer uploads an image at ${imageUrl} and requests an estimate for ${category}. Respond with: 1) short description of the issue, 2) likely causes, 3) a rough ballpark cost estimate in ZAR (low-high), and 4) recommended next steps. Keep it concise.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // or whichever model you prefer
        messages: [{ role: 'system', content: 'You are an expert tradesperson and estimator.' }, { role: 'user', content: prompt }],
        max_tokens: 400,
        temperature: 0.2
      })
    });

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || JSON.stringify(data);
    return new Response(JSON.stringify({ result: text }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
