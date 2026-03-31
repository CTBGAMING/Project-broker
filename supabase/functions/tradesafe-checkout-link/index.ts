// supabase/functions/tradesafe-checkout-link/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TRADESAFE_FN_URL = `${SUPABASE_URL}/functions/v1/tradesafe-client`;

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return new Response("Missing invoice_id", { status: 400 });
    }

    // ------------------------------------
    // LOAD INVOICE
    // ------------------------------------
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (!invoice) throw new Error("Invoice not found");

    if (!invoice.tradesafe_transaction_id) {
      throw new Error("TradeSafe transaction not created");
    }

    // ------------------------------------
    // REQUEST CHECKOUT LINK
    // ------------------------------------
    const mutation = `
      mutation checkoutLink($id: ID!) {
        checkoutLink(transactionId: $id)
      }
    `;

    const variables = {
      id: invoice.tradesafe_transaction_id,
    };

    const tsRes = await fetch(TRADESAFE_FN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const tsData = await tsRes.json();
    const checkoutLink = tsData?.checkoutLink;

    if (!checkoutLink) {
      throw new Error("Failed to generate checkout link");
    }

    // ------------------------------------
    // UPDATE INVOICE STATUS
    // ------------------------------------
    await supabase
      .from("invoices")
      .update({ status: "payment_link_created" })
      .eq("id", invoice_id);

    return new Response(
      JSON.stringify({ checkout_url: checkoutLink }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
