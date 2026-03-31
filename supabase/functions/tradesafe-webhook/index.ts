// supabase/functions/tradesafe-webhook/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);


// -----------------------------
// Email helper (SendGrid)
// Env required: SENDGRID_API_KEY, SENDGRID_FROM
// -----------------------------
async function sendInvoiceEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const from = Deno.env.get("SENDGRID_FROM");

  if (!apiKey || !from) {
    console.warn("SendGrid env vars missing; skipping invoice email.");
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: opts.to }] }],
      from: { email: from, name: "Project Broker" },
      subject: opts.subject,
      content: [{ type: "text/html", value: opts.html }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("SendGrid failed:", res.status, body);
  }
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const payload = await req.json();

    /**
     * Expected TradeSafe payload shape (simplified):
     * {
     *   id: string,
     *   reference: string,
     *   state: string
     * }
     */

    const transactionId = payload?.id;
    const state = payload?.state;

    if (!transactionId || !state) {
      return new Response("Invalid payload", { status: 400 });
    }

    // ----------------------------------------
    // FIND INVOICE BY TRANSACTION ID
    // ----------------------------------------
    const { data: invoice } = await supabase
      .from("invoices")
      .select("*")
      .eq("tradesafe_transaction_id", transactionId)
      .single();

    if (!invoice) {
      // Unknown transaction — acknowledge anyway
      return new Response("OK", { status: 200 });
    }

    // ----------------------------------------
    // HANDLE STATES
    // ----------------------------------------
    switch (state) {
      case "FUNDS_RECEIVED": {
        // Mark invoice + project paid/escrowed
        await supabase
          .from("invoices")
          .update({ status: "paid" })
          .eq("id", invoice.id);

        await supabase
          .from("projects")
          .update({ payment_status: "escrowed" })
          .eq("id", invoice.project_id);

        // -----------------------------
        // Send automated invoice email
        // -----------------------------
        try {
          // Fetch customer email + project name for the email
          let customerEmail = invoice.customer_email as string | null;

          if (!customerEmail && invoice.customer_id) {
            const { data: customer } = await supabase
              .from("profiles")
              .select("email, full_name")
              .eq("id", invoice.customer_id)
              .single();
            customerEmail = customer?.email || null;
          }

          const { data: project } = await supabase
            .from("projects")
            .select("project_name, category, project_type")
            .eq("id", invoice.project_id)
            .single();

          if (customerEmail) {
            const base = Number(invoice.base_amount || 0);
            const commission = Number(invoice.commission_amount || 0);
            const inspectionFee = Number(invoice.inspection_fee || 0);
            const emergencyFee = Number(invoice.emergency_fee || 0);
            const inspectorFee = Number(invoice.inspector_fee || 0);
            const total = Number(invoice.total_amount ?? invoice.amount ?? 0);

            const projectName = project?.project_name || "Your Project";
            const category = (project?.category || project?.project_type || "Project").toString();

            const html = `
              <div style="font-family:Arial,sans-serif; line-height:1.5; color:#0f172a">
                <h2 style="margin:0 0 8px">Invoice paid - ${projectName}</h2>
                <p style="margin:0 0 16px; color:#334155">
                  Thank you for your payment. Below is your invoice summary (commission included).
                </p>

                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:16px; max-width:520px">
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                    <span>Category</span><b>${category}</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                    <span>Contractor / Planner amount (base)</span><b>R${base.toFixed(2)}</b>
                  </div>
                  <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                    <span>Platform commission</span><b>R${commission.toFixed(2)}</b>
                  </div>
                  ${(inspectionFee || inspectorFee) ? `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                      <span>Inspector fee</span><b>R${(inspectionFee || inspectorFee).toFixed(2)}</b>
                    </div>` : ``}
                  ${emergencyFee ? `
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                      <span>Emergency fee</span><b>R${emergencyFee.toFixed(2)}</b>
                    </div>` : ``}

                  <div style="border-top:1px solid #e2e8f0; padding-top:10px; display:flex; justify-content:space-between">
                    <span><b>Total paid</b></span><span><b>R${total.toFixed(2)}</b></span>
                  </div>
                </div>

                <p style="margin:16px 0 0; color:#475569; font-size:12px">
                  Invoice ID: ${invoice.id}
                </p>
              </div>
            `;

            await sendInvoiceEmail({
              to: customerEmail,
              subject: `Project Broker Invoice - ${projectName}`,
              html,
            });
          }
        } catch (e) {
          console.error("Invoice email failed (non-fatal):", e);
        }

        break;
      }

      case "FUNDS_RELEASED":
        await supabase
          .from("invoices")
          .update({ status: "released" })
          .eq("id", invoice.id);

        await supabase
          .from("projects")
          .update({ payment_status: "released" })
          .eq("id", invoice.project_id);
        break;

      default:
        // Other states are ignored for now
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("TradeSafe webhook error:", err);
    return new Response("Server error", { status: 500 });
  }
});
