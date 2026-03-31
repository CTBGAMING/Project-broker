import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import jsPDF from "jspdf";

const FN_TRADESAFE_CHECKOUT = "tradesafe-checkout-link";

const COMPANY_NAME = "Project Broker";
const ENQUIRY_EMAIL = "admin@projectbroker.co.za";
const COMPANY_CITY = "Cape Town, South Africa";

function safeLower(s) {
  return String(s || "").toLowerCase();
}

export default function TradeSafeCheckout() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);
  const [quotePdfLoading, setQuotePdfLoading] = useState(false);

  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [latestInvoice, setLatestInvoice] = useState(null);

  useEffect(() => {
    loadAll();
    const t = setInterval(loadAll, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadAll() {
    try {
      setError("");

      const { data: proj, error: projErr } = await supabase
        .from("projects")
        .select("id, project_name, budget, status, payment_status, location, category")
        .eq("id", projectId)
        .single();

      if (projErr) throw projErr;
      setProject(proj);

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, status, base_amount, commission_amount, inspection_fee, total_amount, amount, created_at, paid_at, tradesafe_transaction_id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invErr) throw invErr;
      setLatestInvoice(inv || null);

      setPageLoading(false);
    } catch (e) {
      setError(e?.message || "Failed to load project.");
      setPageLoading(false);
    }
  }

  async function callCheckoutEdge() {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await supabase.functions.invoke(FN_TRADESAFE_CHECKOUT, {
      body: { projectId },
      headers: {
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : undefined
      }
    });
    
    if (response.error) {
      let exactError = response.error.message;
      try {
        if (response.error.context && typeof response.error.context.json === 'function') {
          const errBody = await response.error.context.json();
          exactError = errBody.error || errBody.details || exactError;
        } else if (response.data && response.data.error) {
          exactError = response.data.error;
        }
      } catch(e) {
        console.warn("Could not parse Edge error JSON", e);
      }
      throw new Error(exactError);
    }

    return response.data;
  }

  const paymentDone =
    safeLower(project?.payment_status) === "paid" ||
    safeLower(latestInvoice?.status) === "paid";

  function dashboardPathForProject(p) {
    const cat = safeLower(p?.category);
    return cat === "events" ? "/customer/events" : "/customer/construction";
  }

  async function startCheckout() {
    if (paymentDone) {
      setError("Payment has already been received for this project. Escrow checkout is locked.");
      return;
    }

    setPayLoading(true);
    setError("");

    try {
      const dash = dashboardPathForProject(project);
      localStorage.setItem("pb_last_dashboard", dash);
      localStorage.setItem("pb_last_project_id", projectId);

      const data = await callCheckoutEdge();
      if (!data?.checkout_url) throw new Error("No checkout_url returned.");
      window.location.href = data.checkout_url;
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to start escrow checkout.");
      setPayLoading(false);
    }
  }

  function fmtMoney(n) {
    return `R${Number(n || 0).toFixed(2)}`;
  }

  function isoDate(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function getAmounts() {
    const inv = latestInvoice;
    const base = Number(inv?.base_amount || 0);
    const commission = Number(inv?.commission_amount || 0);
    const inspection = Number(inv?.inspection_fee || 0);

    let total = Number(inv?.total_amount ?? inv?.amount ?? 0);
    if (!total || total <= 0) total = base + commission + inspection;

    return { base, commission, inspection, total };
  }

  async function addHeader(doc, title) {
    doc.setDrawColor(180);
    doc.setLineWidth(0.6);
    doc.rect(10, 10, 190, 277);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(COMPANY_NAME, 196, 18, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(COMPANY_CITY, 196, 24, { align: "right" });
    doc.text(`Enquiries: ${ENQUIRY_EMAIL}`, 196, 29.5, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title, 105, 48, { align: "center" });
    doc.setDrawColor(210);
    doc.line(14, 54, 196, 54);
  }

  function addProjectDetails(doc, p, docType, refText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`${docType} Details`, 14, 64);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Date: ${isoDate()}`, 14, 71);
    if (refText) doc.text(refText, 14, 77);
    doc.text(`Project: ${p?.project_name || "Project"}`, 14, 86);
    doc.text(`Location: ${p?.location || "-"}`, 14, 92);
    doc.text(`Category: ${p?.category || "-"}`, 14, 98);
  }

  function addTable(doc, rows, totalLabel, totalValue) {
    const startY = 112;
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(220);
    doc.rect(14, startY, 182, 10, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Description", 18, startY + 7);
    doc.text("Amount", 190, startY + 7, { align: "right" });
    let y = startY + 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    rows.forEach((r) => {
      doc.text(r.label, 18, y);
      doc.text(fmtMoney(r.amount), 190, y, { align: "right" });
      y += 8;
    });
    doc.setDrawColor(220);
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(totalLabel, 18, y);
    doc.text(fmtMoney(totalValue), 190, y, { align: "right" });
    return y;
  }

  function addFooter(doc) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Thank you for using Project Broker.", 14, 275);
    doc.text("For enquiries, contact admin@projectbroker.co.za", 14, 281);
    doc.setTextColor(0);
  }

  async function downloadQuotePdf() {
    setQuotePdfLoading(true);
    setError("");
    try {
      const p = project;
      if (!p) throw new Error("Project not loaded.");
      const { base, commission, inspection, total } = getAmounts();
      const budget = Number(p?.budget || 0);
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      await addHeader(doc, "QUOTATION");
      addProjectDetails(doc, p, "Quotation", latestInvoice?.id ? `Reference: ${latestInvoice.id}` : "");

      if (total > 0 || base > 0 || commission > 0 || inspection > 0) {
        const rows = [
          { label: "Contractor / Planner Amount", amount: base },
          { label: "Platform Commission", amount: commission },
          { label: "Inspection Fee", amount: inspection },
        ].filter((r) => Number(r.amount) !== 0);
        addTable(doc, rows, "TOTAL PAYABLE", total);
      } else if (budget > 0) {
        addTable(doc, [{ label: "Estimated Budget", amount: budget }], "ESTIMATED TOTAL", budget);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(120);
        doc.text("Note: Final amounts will be calculated after accepting a bid.", 14, 170);
        doc.setTextColor(0);
      } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Amounts will be finalized after selecting a contractor.", 14, 140);
        doc.text("Please check back after accepting a bid.", 14, 146);
      }
      addFooter(doc);
      doc.save(`Quotation-${p.id}.pdf`);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to generate quotation PDF.");
    } finally {
      setQuotePdfLoading(false);
    }
  }

  async function downloadInvoicePdf() {
    setInvoicePdfLoading(true);
    setError("");
    try {
      const p = project;
      if (!p) throw new Error("Project not loaded.");
      if (!latestInvoice?.id) throw new Error("No invoice exists yet. An invoice is created after you accept a bid.");
      const { base, commission, inspection, total } = getAmounts();
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      await addHeader(doc, "INVOICE");
      addProjectDetails(doc, p, "Invoice", `Invoice ID: ${latestInvoice.id}`);
      const rows = [
        { label: "Contractor / Planner Amount", amount: base },
        { label: "Platform Commission", amount: commission },
        { label: "Inspection Fee", amount: inspection },
      ].filter((r) => Number(r.amount) !== 0);
      addTable(doc, rows, "TOTAL PAID", total);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Status: ${(latestInvoice?.status || "pending").toString().toUpperCase()}`, 14, 190);
      if (latestInvoice?.paid_at) doc.text(`Paid at: ${new Date(latestInvoice.paid_at).toLocaleString()}`, 14, 196);
      doc.setTextColor(0);
      addFooter(doc);
      doc.save(`Invoice-${latestInvoice.id}.pdf`);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to generate invoice PDF.");
    } finally {
      setInvoicePdfLoading(false);
    }
  }

  const cancelToDashboard = () => {
    const dash = dashboardPathForProject(project);
    navigate(`${dash}?tab=progress`);
  };

  if (pageLoading) {
    return (
      <div style={wrap}>
        <h2>Loading escrow checkout…</h2>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={wrap}>
        <h2>Project not found</h2>
      </div>
    );
  }

  const canDownloadInvoice = paymentDone;
  const amounts = getAmounts();

  if (error) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Escrow Payment Error</h2>
          <p style={{ color: "#ef4444", whiteSpace: "pre-wrap" }}>{error}</p>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {!paymentDone && (
              <button style={btnGold} onClick={startCheckout} disabled={payLoading}>
                {payLoading ? "Trying again…" : "Try escrow again"}
              </button>
            )}
            <button style={btnGhost} onClick={() => navigate(-1)}>
              Go back
            </button>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            <button style={btnGhost} onClick={downloadQuotePdf} disabled={quotePdfLoading}>
              {quotePdfLoading ? "Generating quotation…" : "Download Quotation PDF"}
            </button>
            {canDownloadInvoice && (
              <button style={btnGhost} onClick={downloadInvoicePdf} disabled={invoicePdfLoading}>
                {invoicePdfLoading ? "Generating invoice…" : "Download Invoice PDF"}
              </button>
            )}
          </div>
          <button style={btnGhost} onClick={cancelToDashboard}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={{ marginTop: 0 }}>Secure Escrow Payment</h1>
        <p style={{ color: "#64748b" }}>You’ll be redirected to TradeSafe to complete payment securely.</p>

        <div style={info}>
          <Row label="Project" value={project.project_name} />
          <Row label="Status" value={project.status || "-"} />
          <Row label="Payment status" value={project.payment_status || "-"} />
        </div>

        {/* ✅ THE NEW COST BREAKDOWN SECTION */}
        <div style={{ marginTop: 24, padding: 20, background: "#ffffff", borderRadius: 16, border: "2px solid #eef2ff", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#0f172a" }}>Payment Breakdown</h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#475569" }}>
            <span>Contractor Bid</span>
            <span style={{ fontWeight: 800 }}>{fmtMoney(amounts.base)}</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#475569" }}>
            <span>Platform Commission</span>
            <span style={{ fontWeight: 800 }}>{fmtMoney(amounts.commission)}</span>
          </div>

          {amounts.inspection > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, color: "#475569" }}>
              <span>Inspection Fee</span>
              <span style={{ fontWeight: 800 }}>{fmtMoney(amounts.inspection)}</span>
            </div>
          )}

          <div style={{ height: 1, background: "#e2e8f0", margin: "16px 0" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 900, color: "#0f172a", fontSize: 15 }}>Total Secure Escrow</span>
            <span style={{ fontWeight: 900, color: "#16a34a", fontSize: 20 }}>{fmtMoney(amounts.total)}</span>
          </div>
        </div>

        {paymentDone ? (
          <div style={{ marginTop: 24, fontWeight: 900, color: "#16a34a", textAlign: "center", padding: 16, background: "#dcfce7", borderRadius: 12 }}>
            Payment received ✅ (Escrow locked)
          </div>
        ) : (
          <button style={btnGold} onClick={startCheckout} disabled={payLoading}>
            {payLoading ? "Connecting to TradeSafe…" : "Continue to escrow payment"}
          </button>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button style={btnGhost} onClick={downloadQuotePdf} disabled={quotePdfLoading}>
            {quotePdfLoading ? "Generating quotation…" : "Download Quotation PDF"}
          </button>

          {canDownloadInvoice && (
            <button style={btnGhost} onClick={downloadInvoicePdf} disabled={invoicePdfLoading}>
              {invoicePdfLoading ? "Generating invoice…" : "Download Invoice PDF"}
            </button>
          )}
        </div>

        <button style={{ ...btnGhost, border: "none", color: "#64748b" }} onClick={cancelToDashboard}>
          Cancel and return to Dashboard
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={row}>
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

const wrap = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  fontFamily: "Inter, sans-serif",
};

const page = {
  maxWidth: 600,
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "Inter, sans-serif",
};

const card = {
  background: "#f8fafc",
  padding: 32,
  borderRadius: 24,
  border: "1px solid #e2e8f0",
  width: "100%",
  boxShadow: "0 20px 40px -10px rgba(0,0,0,0.05)",
};

const info = { marginTop: 24, display: "grid", gap: 12 };

const row = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 16px",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  background: "#fff",
};

const labelStyle = { fontWeight: 700, color: "#64748b", fontSize: 14 };
const valueStyle = { fontWeight: 900, color: "#0f172a", fontSize: 14 };

const btnGold = {
  marginTop: 24,
  width: "100%",
  padding: "16px",
  borderRadius: 14,
  border: "none",
  fontWeight: 950,
  fontSize: 16,
  color: "#1f2937",
  cursor: "pointer",
  background: "linear-gradient(135deg,#ffe08a,#f5c451)",
  boxShadow: "0 4px 14px rgba(245,196,81,0.3)",
};

const btnGhost = {
  width: "100%",
  padding: "14px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  fontWeight: 800,
  cursor: "pointer",
  background: "#fff",
  color: "#334155",
};