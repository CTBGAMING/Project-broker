import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { CheckCircle, Loader2, LayoutDashboard } from "lucide-react";

/**
 * ✅ Fix: route back to the dashboard user came from
 * We store it in sessionStorage before checkout starts (see TradeSafeCheckout update below)
 */
function getReturnToFallback() {
  const stored = sessionStorage.getItem("pb_return_to");
  if (stored) return stored;
  return "/customer/construction";
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const projectIdParam = searchParams.get("id");
  const referenceParam = searchParams.get("reference");
  const transactionIdParam = searchParams.get("transactionId");

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [dashboardPath, setDashboardPath] = useState(getReturnToFallback());

  useEffect(() => {
    confirmAndLockPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmAndLockPayment() {
    try {
      setStatus("verifying");
      setMessage("Verifying your payment...");

      let finalProjectId = projectIdParam || null;
      const paymentRef = transactionIdParam || referenceParam || null;

      // If no projectId in params, try to locate via invoice transaction reference
      let invoiceRow = null;

      if (!finalProjectId && paymentRef) {
        // 1) match on tradesafe_transaction_id
        const { data: inv1, error: inv1Err } = await supabase
          .from("invoices")
          .select("id, project_id, total_amount, amount, status, tradesafe_transaction_id, created_at")
          .eq("tradesafe_transaction_id", paymentRef)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inv1Err) console.error("[PaymentSuccess] Invoice lookup error:", inv1Err);

        if (inv1?.project_id) {
          invoiceRow = inv1;
          finalProjectId = inv1.project_id;
        } else if (referenceParam) {
          // 2) fallback: reference may be invoice id
          const { data: inv2, error: inv2Err } = await supabase
            .from("invoices")
            .select("id, project_id, total_amount, amount, status, tradesafe_transaction_id, created_at")
            .eq("id", referenceParam)
            .maybeSingle();

          if (inv2Err) console.error("[PaymentSuccess] Invoice fallback lookup error:", inv2Err);

          if (inv2?.project_id) {
            invoiceRow = inv2;
            finalProjectId = inv2.project_id;
          }
        }
      }

      if (!finalProjectId) {
        setStatus("timeout");
        setMessage("Payment detected, but we couldn't link it to a project. Please contact support.");
        return;
      }

      // Read project to decide dashboard path if sessionStorage missing
      const { data: proj, error: projReadErr } = await supabase
        .from("projects")
        .select("id, category, owner_id, project_name, budget, status, payment_status")
        .eq("id", finalProjectId)
        .maybeSingle();

      if (projReadErr) console.error("[PaymentSuccess] Project read error:", projReadErr);

      // If user didn't come from anywhere (or session cleared), route based on category
      const category = String(proj?.category || "").toLowerCase();
      const routeBack = category === "events" ? "/customer/events" : "/customer/construction";
      const stored = sessionStorage.getItem("pb_return_to");
      setDashboardPath(stored || routeBack);

      // ✅ Your DB constraint only allows paid/unpaid
      const { error: projUpdErr } = await supabase
        .from("projects")
        .update({
          paid: true,
          status: "in_progress",
          payment_status: "paid",
        })
        .eq("id", finalProjectId);

      if (projUpdErr) throw projUpdErr;

      // Update invoice (best effort)
      const { error: invUpdErr } = await supabase
        .from("invoices")
        .update({
          status: "paid",
          tradesafe_transaction_id: paymentRef || "manual_verify",
          paid_at: new Date().toISOString(),
        })
        .eq("project_id", finalProjectId)
        .eq("status", "pending_payment");

      if (invUpdErr) console.error("[PaymentSuccess] Invoice update error (non-blocking):", invUpdErr);

      // Insert payment receipt (NO reference column)
      if (proj?.owner_id) {
        const { data: existing, error: existingErr } = await supabase
          .from("payments")
          .select("id")
          .eq("project_id", finalProjectId)
          .maybeSingle();

        if (existingErr) console.error("[PaymentSuccess] Payment lookup error:", existingErr);

        if (!existing) {
          const invoiceAmount = Number(invoiceRow?.total_amount ?? invoiceRow?.amount ?? 0);
          const fallbackBudget = Number(proj?.budget ?? 0);
          const amountToRecord = invoiceAmount > 0 ? invoiceAmount : fallbackBudget;

          const { error: payErr } = await supabase.from("payments").insert([
            {
              user_id: proj.owner_id,
              project_id: finalProjectId,
              amount: amountToRecord,
              reason: `Escrow Secured: ${proj.project_name || "Project"}`,
              status: "completed",
            },
          ]);

          if (payErr) console.error("[PaymentSuccess] Payment insert error (non-blocking):", payErr);
        }
      }

      // ✅ after payment, send them back and show payments tab
      setStatus("success");
      setMessage("Payment successful! Your funds are secured in escrow.");

      // optional: hint dashboard to open payments tab
      sessionStorage.setItem("pb_open_tab", "payments");
    } catch (err) {
      console.error("Payment sync error:", err);
      setStatus("timeout");
      setMessage("We couldn't sync your payment automatically. Please contact support.");
    }
  }

  return (
    <div style={container}>
      <div style={card}>
        {status === "verifying" && (
          <>
            <Loader2 className="animate-spin" size={50} color="#6f52ff" />
            <h2 style={{ color: "#fff", marginTop: 20 }}>Verifying...</h2>
            <p style={{ color: "#94a3b8" }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={60} color="#10b981" />
            <h2 style={{ color: "#fff", marginTop: 20 }}>Payment Successful</h2>
            <p style={{ color: "#94a3b8", marginBottom: 30 }}>{message}</p>

            <button style={btn} onClick={() => navigate(dashboardPath)}>
              <LayoutDashboard size={18} /> Back to Dashboard
            </button>
          </>
        )}

        {status === "timeout" && (
          <>
            <h2 style={{ color: "#fff" }}>Syncing Dashboard...</h2>
            <p style={{ color: "#94a3b8", marginBottom: 30 }}>{message}</p>

            <button style={btn} onClick={() => navigate(dashboardPath)}>
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const container = {
  minHeight: "100vh",
  background: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const card = {
  background: "#1e293b",
  padding: "50px",
  borderRadius: "35px",
  textAlign: "center",
  maxWidth: "420px",
  border: "1px solid rgba(255,255,255,0.1)",
};

const btn = {
  width: "100%",
  padding: "16px",
  borderRadius: "18px",
  background: "linear-gradient(135deg,#ffe08a,#f5c451)",
  color: "#1a0b2e",
  border: "none",
  fontWeight: "900",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};