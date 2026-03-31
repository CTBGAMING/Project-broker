
/**
 * Email Digest - Supabase Edge Function (Node)
 * - Queries Supabase for recent ads created since last run
 * - Groups by contractor skills and emails contractors a digest
 * Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY, SENDGRID_FROM
 */

import fetch from 'node-fetch';
import sgMail from '@sendgrid/mail';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM = process.env.SENDGRID_FROM || 'no-reply@projectbroker.example';

sgMail.setApiKey(SENDGRID_API_KEY);

export default async function handler(req) {
  // Fetch recent ads (last 24 hours)
  const since = new Date(Date.now() - 1000*60*60*24).toISOString();
  const adsRes = await fetch(`${SUPABASE_URL}/rest/v1/ads?created_at=gt.${since}`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  const ads = await adsRes.json();
  if(!ads || ads.length===0) return new Response('No new ads', { status: 200 });

  // For demo: email a single admin address with ad summaries
  const html = ads.map(a => `<li><strong>${a.category}</strong> - ${a.description || ''} (Project: ${a.project_id})</li>`).join('');
  const msg = {
    to: SENDGRID_FROM,
    from: SENDGRID_FROM,
    subject: `Project Broker - New ads digest (${ads.length})`,
    html: `<p>New ads in the last 24 hours</p><ul>${html}</ul>`
  };
  await sgMail.send(msg);

  return new Response('Digest sent', { status: 200 });
}
