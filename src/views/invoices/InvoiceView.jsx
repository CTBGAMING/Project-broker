import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function InvoiceView() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [invoice, setInvoice] = useState(null);
  const [project, setProject] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  async function load() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      navigate("/auth/login");
      return;
    }

    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr) {
      console.error("Invoice load error:", invErr);
      alert(invErr.message);
      setLoading(false);
      return;
    }

    setInvoice(inv);

    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .select("id, project_name, location, category, status, owner_id, customer_id")
      .eq("id", inv.project_id)
      .single();

    if (projErr) {
      console.error("Project load error:", projErr);
    } else {
      setProject(proj);
    }

    setLoading(false);
  }

  const canPay =
    invoice &&
    ["draft", "pending_payment", "payment_initiated"].includes(invoice.status);

  async function startPayment() {
    if (!invoice) return;

    setPaying(true);

    const { data, error } = await supabase.functions.invoke(
      "tradesafe-create-transaction",
      {
        body: { project_id: invoice.project_id },
      }
    );

    if (error) {
      console.error("TradeSafe function error:", error);
      alert(error.message || "Failed to create TradeSafe link.");
      setPaying(false);
      return;
    }

    const url = data?.checkout_url;
    if (!url) {
      alert("No checkout URL returned.");
      setPaying(false);
      return;
    }

    window.location.href = url;
  }

  async function downloadInvoice() {
    if (!invoice) return;

    setDownloading(true);

    const { data, error } = await supabase.functions.invoke("invoice-download", {
      body: { invoice_id: invoice.id },
    });

    setDownloading(false);

    if (error) {
      console.error("invoice-download error:", error);
      alert(error.message || "Failed to get invoice download link.");
      return;
    }

    const url = data?.url;
    if (!url) {
      alert("No download URL returned.");
      return;
    }

    window.open(url, "_blank");
  }

  if (loading) {
    return (
      <div style={wrap}>
        <h2>Loading invoice...</h2>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={wrap}>
        <h2>Invoice not found.</h2>
      </div>
    );
  }

  const total = Number(invoice.total_amount ?? invoice.amount ?? 0);

  return (
    <div style={page}>
      <h1 style={{ marginBottom: 6 }}>Invoice</h1>
      <div style={{ color: "#64748b", marginBottom: 18 }}>
        Status: <b style={{ textTransform: "capitalize" }}>{invoice.status}</b>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {project?.project_name || "Project"}
            </div>
            <div style={{ color: "#64748b", marginTop: 6 }}>
              {project?.location || "No location"} • {project?.category || "Construction"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 900 }}>
              Total: R{total.toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, borderTop: "1px solid #e5e7eb", paddingTop: 14 }}>
          <Line label="Bid (base)" value={invoice.base_amount} />
          <Line label="Commission" value={invoice.commission_amount} />
          <Line label="Inspection fee" value={invoice.inspection_fee} />
          <Line label="Emergency fee" value={invoice.emergency_fee} />
          <Line label="Inspector fee" value={invoice.inspector_fee} />
          <Line label="Total" value={total} bold />
        </div>

        {canPay ? (
          <button style={payBtn} onClick={startPayment} disabled={paying}>
            {paying ? "Opening TradeSafe..." : "Pay with TradeSafe"}
          </button>
        ) : (
          <div style={{ marginTop: 14, color: "#16a34a", fontWeight: 800 }}>
            Payment complete ✅
          </div>
        )}

        <button
          style={downloadBtn(invoice?.invoice_pdf_path)}
          onClick={downloadInvoice}
          disabled={downloading || !invoice?.invoice_pdf_path}
        >
          {downloading
            ? "Preparing..."
            : invoice?.invoice_pdf_path
              ? "Download Invoice"
              : "Invoice PDF not ready yet"}
        </button>
      </div>
    </div>
  );
}

function Line({ label, value, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
        fontWeight: bold ? 900 : 600,
      }}
    >
      <span style={{ color: bold ? "#0f172a" : "#475569" }}>{label}</span>
      <span>R{Number(value || 0).toFixed(2)}</span>
    </div>
  );
}

const page = { maxWidth: 900, margin: "40px auto", padding: "0 20px", fontFamily: "Inter, sans-serif" };
const wrap = { textAlign: "center", padding: 60, fontFamily: "Inter, sans-serif" };
const card = { background: "#fff", padding: 24, borderRadius: 18, border: "1px solid #e5e7eb" };

const payBtn = {
  width: "100%",
  padding: 16,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontWeight: 900,
  background: "linear-gradient(135deg,#34d399,#22c55e)",
  color: "#052e16",
  marginTop: 18,
};

const downloadBtn = (ready) => ({
  width: "100%",
  padding: 16,
  borderRadius: 14,
  border: "none",
  cursor: ready ? "pointer" : "not-allowed",
  fontWeight: 900,
  background: ready ? "linear-gradient(135deg,#ffe08a,#f5c451)" : "#e5e7eb",
  color: ready ? "#0f172a" : "#64748b",
  marginTop: 12,
});