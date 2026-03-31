import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 1️⃣ Check existing token
    const { data: profile } = await supabase
      .from("profiles")
      .select("tradesafe_token, full_name, email")
      .eq("id", user_id)
      .single();

    if (profile?.tradesafe_token) {
      return new Response(
        JSON.stringify({ token: profile.tradesafe_token }),
        { headers: corsHeaders }
      );
    }

    // 2️⃣ Create token on TradeSafe (SIMPLIFIED MVP)
    const response = await fetch(
      `${Deno.env.get("TRADESAFE_API_URL")}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("TRADESAFE_API_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation tokenCreate($email: Email) {
              tokenCreate(input: {
                user: { email: $email }
              }) {
                data { id }
              }
            }
          `,
          variables: {
            email: profile.email,
          },
        }),
      }
    );

    const json = await response.json();
    const token = json?.data?.tokenCreate?.data?.[0]?.id;

    if (!token) {
      throw new Error("TradeSafe token creation failed");
    }

    // 3️⃣ Save token
    await supabase
      .from("profiles")
      .update({ tradesafe_token: token })
      .eq("id", user_id);

    return new Response(
      JSON.stringify({ token }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
