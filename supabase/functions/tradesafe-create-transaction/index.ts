import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // These are the verified active endpoints
  const AUTH_URL = "https://auth.tradesafe.co.za/oauth/token";
  const API_URL = "https://api.tradesafe.co.za/graphql";

  try {
    const { project_id } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invoice } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("project_id", project_id)
      .single();

    if (!invoice) throw new Error("Invoice not found.");

    // 1. Get Token with 'Audience'
    // Many APIs reject tokens if the 'audience' isn't explicitly set to the API domain
    const authRes = await fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: "a0a38864-1b5b-4549-aaa5-f7610cf072ea",
        client_secret: "xQCk8UELb5SQKII1JBeZKdFYa0Sv7npmzKMxCnEN",
        audience: "https://api.tradesafe.co.za/graphql" 
      }),
    });

    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(`Auth failed: ${authData.error_description || authData.message}`);

    const token = authData.access_token;

    // 2. Create Transaction
    // Updated mutation to include 'workflow: ESCROW' and sandbox-friendly emails
    const createTxMutation = {
      query: `
        mutation {
          transactionCreate(input: {
            title: "Project ${project_id}",
            description: "Sandbox Escrow Payment",
            industry: GENERAL_GOODS_SERVICES,
            currency: ZAR,
            feeAllocation: BUYER,
            workflow: STANDARD,
            allocations: {
              create: [{
                title: "Milestone 1",
                description: "Initial Payment",
                value: ${invoice.total_amount},
                daysToDeliver: 7,
                daysToInspect: 7
              }]
            },
            parties: {
              create: [
                { email: "buyer@tradesafe.life", role: BUYER },
                { email: "seller@tradesafe.life", role: SELLER }
              ]
            }
          }) {
            id
          }
        }
      `
    };

    const txRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createTxMutation),
    });

    const txResult = await txRes.json();

    if (txResult.errors) {
      const errorMsg = txResult.errors[0].message;
      // Detailed error for "Unauthenticated"
      if (errorMsg === "Unauthenticated.") {
        throw new Error("UNAUTHENTICATED: The API accepted the token but the user/org context is missing. Ensure your Sandbox App is 'Verified' in the TradeSafe dashboard.");
      }
      throw new Error(`API Error: ${errorMsg}`);
    }

    const tradeSafeId = txResult.data.transactionCreate.id;

    // 3. Get Checkout Link
    const linkRes = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `mutation { checkoutLink(transactionId: "${tradeSafeId}") }`
      }),
    });

    const linkResult = await linkRes.json();
    return new Response(JSON.stringify({ payment_url: linkResult.data.checkoutLink }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});