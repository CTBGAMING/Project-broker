import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }

  const formData = await req.formData();
  const data: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value.toString();
  }

  // --------------------------------------------------
  // BASIC VALIDATION
  // --------------------------------------------------
  if (data.payment_status !== "COMPLETE") {
    return new Response("Payment not complete", { status: 200 });
  }

  const paymentId = data.m_payment_id.replace(/[<>]/g, "");
  const amount = Number(data.amount_gross);

  if (!paymentId || amount !== 50) {
    return new Response("Invalid payment", { status: 400 });
  }

  // --------------------------------------------------
  // SUPABASE CLIENT (SERVICE ROLE)
  // --------------------------------------------------
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --------------------------------------------------
  // LOAD PAYMENT RECORD
  // --------------------------------------------------
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, project_id, status")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return new Response("Payment not found", { status: 404 });
  }

  if (payment.status === "completed") {
    return new Response("Already processed", { status: 200 });
  }

  // --------------------------------------------------
  // MARK PAYMENT COMPLETED
  // --------------------------------------------------
  await supabase
    .from("payments")
    .update({
      status: "completed",
      gateway_ref: data.pf_payment_id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  // --------------------------------------------------
  // PUBLISH PROJECT
  // --------------------------------------------------
  await supabase
    .from("projects")
    .update({ status: "open" })
    .eq("id", payment.project_id);

  return new Response("OK", { status: 200 });
});
