
Deploying the functions (example using Supabase Edge Functions):
1. Install supabase CLI and login.
2. From supabase/functions directory, run: supabase functions deploy email_digest --no-verify-jwt
3. Set environment variables for the function in Supabase or your hosting: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SENDGRID_API_KEY, SENDGRID_FROM
4. Add a cron (e.g., via GitHub Actions or Supabase scheduled functions) to call the function twice daily.
For ai_analyzer, set OPENAI_API_KEY and deploy similarly. The function expects a POST body: { "image_url": "...", "category": "Plumbing" }
