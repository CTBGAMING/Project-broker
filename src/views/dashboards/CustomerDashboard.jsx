import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import UploadButton from "../../components/UploadButton.jsx";
import DashboardLayout from "../../components/DashboardLayout.jsx";

function safeLower(s) {
  return String(s || "").toLowerCase();
}

function safeStr(v) {
  return String(v ?? "");
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function fmtMoneyZar(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "R0";
  return `R${Math.round(v).toLocaleString()}`;
}

/* ---------------- STYLES (PREMIUM DARK THEME) ---------------- */
const styles = {
  pageInner: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "0 10px",
    fontFamily: "'Inter', sans-serif",
  },
  tabs: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  tabBtn: {
    padding: "10px 18px",
    borderRadius: 50,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17",
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.5px",
    transition: "all 0.3s"
  },
  activeTabBtn: {
    padding: "10px 18px",
    borderRadius: 50,
    border: "1px solid #c5a059",
    background: "rgba(197, 160, 89, 0.1)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    color: "#c5a059",
    letterSpacing: "0.5px",
  },
  panel: {
    background: "#12141c",
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    border: "1px solid rgba(197, 160, 89, 0.2)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  input: {
    width: "100%",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17",
    color: "#ffffff",
    marginTop: 8,
    outline: "none",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17",
    color: "#ffffff",
    marginTop: 8,
    outline: "none",
    resize: "vertical",
    fontSize: 14,
  },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 },
  pillGrid: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  pill: {
    padding: "10px 16px",
    borderRadius: 50,
    border: "1px solid rgba(197, 160, 89, 0.3)",
    background: "transparent",
    color: "#c5a059",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },
  activePill: {
    padding: "10px 16px",
    borderRadius: 50,
    border: "none",
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    color: "#000000",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },
  fieldPillWrap: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 },
  fieldPill: {
    padding: "10px 14px",
    borderRadius: 50,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    color: "#94a3b8",
  },
  fieldPillActive: {
    padding: "10px 14px",
    borderRadius: 50,
    border: "1px solid #c5a059",
    background: "rgba(197, 160, 89, 0.1)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
    color: "#c5a059",
  },
  fieldHint: { marginTop: 8, color: "#94a3b8", fontSize: 12, lineHeight: 1.5 },
  submitBtn: {
    width: "100%",
    padding: 16,
    borderRadius: 50,
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    fontWeight: 800,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#000000",
    boxShadow: "0 4px 15px rgba(197, 160, 89, 0.2)"
  },
  closeBtn: { 
    padding: "8px 14px", 
    borderRadius: 50, 
    background: "rgba(239, 68, 68, 0.1)", 
    color: "#f87171", 
    fontWeight: 700, 
    border: "1px solid rgba(239, 68, 68, 0.3)", 
    cursor: "pointer", 
    fontSize: 12 
  },
  card: { background: "#12141c", padding: 20, borderRadius: 16, marginBottom: 16, border: "1px solid rgba(197, 160, 89, 0.2)" },
  resumeBtn: {
    marginTop: 12,
    padding: "10px 16px",
    borderRadius: 50,
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    fontWeight: 800,
    color: "#000",
    border: "none",
    cursor: "pointer",
  },
  noticeBox: {
    background: "rgba(245, 158, 11, 0.1)",
    padding: 14,
    borderRadius: 12,
    border: "1px solid rgba(245, 158, 11, 0.3)",
    margin: "16px 0",
    color: "#fbbf24",
    fontSize: 13,
    lineHeight: 1.5,
  },
  bidRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "#0b0d17",
    marginBottom: 10,
  },
  chip: {
    padding: "6px 12px",
    borderRadius: 50,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.05)",
    fontWeight: 700,
    fontSize: 12,
    color: "#94a3b8",
    textTransform: "capitalize",
  },
  acceptBtn: {
    padding: "10px 16px",
    borderRadius: 50,
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    background: "linear-gradient(135deg, #34d399, #10b981)",
    color: "#000000",
  },
  loadingWrap: { textAlign: "center", paddingTop: 100 },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(11, 13, 23, 0.85)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    background: "#12141c",
    borderRadius: 18,
    padding: 24,
    border: "1px solid #c5a059",
    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
  },
  invoiceCard: { marginTop: 16, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(197, 160, 89, 0.2)" },
  invoiceLine: { marginTop: 8, color: "#94a3b8", fontSize: 13 },
  warnBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    color: "#fbbf24",
    fontSize: 13,
    lineHeight: 1.5,
  },
  stack: { display: "grid", gap: 16 },
  aiHero: {
    position: "relative",
    padding: 24,
    borderRadius: 16,
    border: "1px solid rgba(197, 160, 89, 0.3)",
    background: "#12141c",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  aiHeroBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: "6px 12px",
    borderRadius: 50,
    fontWeight: 800,
    fontSize: 11,
    background: "rgba(197, 160, 89, 0.1)",
    border: "1px solid #c5a059",
    color: "#c5a059",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  aiHeroTitle: { fontWeight: 800, fontSize: 22, color: "#ffffff", fontFamily: "'Playfair Display', serif" },
  aiHeroDesc: { marginTop: 8, color: "#94a3b8", fontSize: 14, lineHeight: 1.6, maxWidth: 700 },
  aiHeroSteps: { marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 },
  step: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  stepN: {
    width: 24,
    height: 24,
    borderRadius: 50,
    background: "rgba(197, 160, 89, 0.1)",
    border: "1px solid #c5a059",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 12,
    color: "#c5a059",
  },
  stepT: { fontWeight: 700, fontSize: 13, color: "#ffffff" },
  stepS: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  legalContent: {
    padding: 24,
    background: "#0b0d17",
    borderRadius: 12,
    border: "1px solid rgba(197, 160, 89, 0.2)",
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.7,
    marginBottom: 20,
  },
  legalSectionTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: "#c5a059",
    fontFamily: "'Playfair Display', serif",
    marginTop: 10,
    marginBottom: 16,
  }
};

/* ---------------- UI COMPONENTS ---------------- */

const Input = ({ label, value, onChange, type = "text", options = [], placeholder = "", hint = "" }) => {
  const hasOptions = Array.isArray(options) && options.length > 0;

  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 700, color: "#c5a059", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</label>

      {type === "boolean" ? (
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={Boolean(value) === true ? styles.fieldPillActive : styles.fieldPill} onClick={() => onChange(true)}>Yes</button>
          <button type="button" style={Boolean(value) === false ? styles.fieldPillActive : styles.fieldPill} onClick={() => onChange(false)}>No</button>
        </div>
      ) : type === "select" && hasOptions ? (
        <div style={styles.fieldPillWrap}>
          {options.map((opt) => {
            const optVal = typeof opt === "string" ? opt : opt?.value;
            const optLabel = typeof opt === "string" ? opt : opt?.label ?? optVal;
            const active = String(value ?? "") === String(optVal ?? "");
            return (
              <button key={String(optVal)} type="button" style={active ? styles.fieldPillActive : styles.fieldPill} onClick={() => onChange(optVal)} title={optLabel}>
                {optLabel}
              </button>
            );
          })}
        </div>
      ) : type === "textarea" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={styles.textarea} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={styles.input} placeholder={placeholder} />
      )}
      {hint ? <div style={styles.fieldHint}>{hint}</div> : null}
    </div>
  );
};

const Panel = ({ title, children }) => (
  <div style={styles.panel}>
    <h2 style={{ marginTop: 0, marginBottom: 20, color: "#ffffff", fontFamily: "'Playfair Display', serif", letterSpacing: "1px" }}>{title}</h2>
    {children}
  </div>
);

function EstimatedRangeCard({ estimate, confirmed, onConfirmYes, onChangeDetails }) {
  if (!estimate) return null;
  const low = Number(estimate.low || 0);
  const high = Number(estimate.high || 0);

  return (
    <div style={{ marginTop: 16, padding: 20, borderRadius: 14, border: "1px solid #c5a059", background: "rgba(197, 160, 89, 0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, color: "#c5a059", fontSize: 14, textTransform: "uppercase", letterSpacing: "1px" }}>Expected Cost (AI Estimate)</div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#fcf6ba" }}>
          {estimate.confidence != null ? `${Math.round(Number(estimate.confidence) * 100)}% Match` : "AI"}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", marginTop: 12, fontFamily: "'Playfair Display', serif" }}>
        {fmtMoneyZar(low)} – {fmtMoneyZar(high)}
      </div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginTop: 10, lineHeight: 1.6 }}>
        This is the expected range most contractor bids will likely fall within (materials + labour).{" "}
        <span style={{ color: "#ffffff", fontWeight: 700 }}>Do you want to create this project?</span>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
        {!confirmed ? (
          <>
            <button type="button" style={{ padding: "12px 18px", borderRadius: 50, border: "none", background: "linear-gradient(135deg, #34d399, #10b981)", color: "#000", fontWeight: 800, cursor: "pointer" }} onClick={onConfirmYes}>✅ Yes, create my project</button>
            <button type="button" style={{ padding: "12px 18px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.2)", background: "#1e2235", color: "#fff", fontWeight: 700, cursor: "pointer" }} onClick={onChangeDetails}>✏️ Change details</button>
          </>
        ) : (
          <div style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #10b981", background: "rgba(16, 185, 129, 0.1)", fontWeight: 700, color: "#34d399", width: "100%", textAlign: "center" }}>
            Confirmed ✅ You can select a timeframe and post below.
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- MAIN DASHBOARD ---------------- */

const DASHBOARD_TABS = [
  { id: "assistant", label: "✨ AI Assistant" },
  { id: "manual", label: "Standard Setup" },
  { id: "active", label: "Open Bids" },
  { id: "progress", label: "In Progress" },
  { id: "payments", label: "Payments" },
  { id: "legal", label: "⚖️ Legal & T&Cs" },
];

function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("assistant");
  const [loading, setLoading] = useState(true);

  const [draftProjects, setDraftProjects] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [progressProjects, setProgressProjects] = useState([]);

  const [paidProjects, setPaidProjects] = useState([]);
  const [selectedPaid, setSelectedPaid] = useState(null);

  const [rawBids, setRawBids] = useState([]);
  const [awarding, setAwarding] = useState(false);
  
  const [expandedProjects, setExpandedProjects] = useState({});

  const [aiDraft, setAiDraft] = useState({ project_name: "", location: "", description: "", categories: {}, bid_duration: "48" });
  const [estimate, setEstimate] = useState(null); 
  const [pricingConfirmed, setPricingConfirmed] = useState(false);

  const [form, setForm] = useState({ project_name: "", location: "", description: "", categories: {}, bid_duration: "48" });

  const [tenderData, setTenderData] = useState({
    mode: "construction",
    current_project_data: {
      project_title: "", project_address_or_area: "", project_type: "", goal: "", target_start_date: "", target_completion_date: "", site_access: "", occupancy: "", existing_services: "", known_hazards: "", photos_or_plans_available: "", areas_in_scope: "", demolition_required: "", materials_and_finishes: "", interfaces: "", utilities_shutdowns_needed: "", standards_or_brand_preferences: "", snag_list_process: "", warranty_expectations: "", procurement_type: "quote", pricing_format: "lump_sum", payment_milestones_optional: "", site_meetings_frequency: "", explicit_exclusions: "", client_responsibilities: "",
    },
    last_questions: [],
    sow_markdown: null,
    is_ready: false,
  });

  const CATEGORY_DEFS = [
    { key: "Plumbing", fields: [ { name: "job_type", label: "What best describes the plumbing job?", type: "select", options: ["Leak", "Blocked drain", "Geyser", "Install", "Other / Not sure"] }, { name: "where_leak", label: "Where is the issue located?", type: "select", options: ["Kitchen", "Bathroom", "Laundry", "Outside", "Wall/Ceiling", "Other / Not sure"] }, { name: "access", label: "How accessible is it?", type: "select", options: ["Easy access", "Needs opening wall/ceiling", "May need digging", "Not sure"] }, { name: "urgency", label: "How urgent is it?", type: "select", options: ["Emergency (active leak)", "Soon (today/tomorrow)", "This week", "Not urgent"] }, { name: "materials", label: "Customer supplies materials?", type: "boolean" }, { name: "notes", label: "Extra notes (optional)", type: "text", placeholder: "Anything else contractors should know?" }, ] },
    { key: "Electrical", fields: [ { name: "job_type", label: "What best describes the electrical job?", type: "select", options: ["No power / trips", "New points/lights", "Fault finding", "COC / Compliance", "Other / Not sure"] }, { name: "points", label: "Approx number of points / fittings", type: "number" }, { name: "coc", label: "COC required?", type: "boolean" }, { name: "urgency", label: "How urgent is it?", type: "select", options: ["Emergency", "Soon", "This week", "Not urgent"] }, ] },
    { key: "Painting", fields: [ { name: "interior_exterior", label: "Interior or exterior?", type: "select", options: ["Interior", "Exterior", "Both", "Not sure"] }, { name: "rooms", label: "Rooms / areas", type: "text" }, { name: "coats", label: "Number of coats", type: "number" }, { name: "prep", label: "Wall prep needed?", type: "select", options: ["None", "Minor patching", "Skimming / major repairs", "Not sure"] }, ] },
    { key: "Roofing", fields: [ { name: "repair_type", label: "Repair or replacement?", type: "select", options: ["Repair", "Replacement", "Not sure"] }, { name: "material", label: "Roof type", type: "select", options: ["Tile", "Metal", "Flat / Torch-on", "Not sure"] }, { name: "leak_visible", label: "Active leak?", type: "boolean" }, { name: "area", label: "Approx area (m²)", type: "number" }, ] },
    { key: "Flooring", fields: [ { name: "type", label: "Floor type", type: "select", options: ["Tiling", "Vinyl", "Laminate", "Wood", "Other / Not sure"] }, { name: "area", label: "Area size (m²)", type: "number" }, { name: "subfloor", label: "Subfloor prep required?", type: "boolean" }, ] },
    { key: "Structural / Brickwork", fields: [ { name: "work_type", label: "New build or extension?", type: "select", options: ["New build", "Extension", "Crack repair", "Retaining wall", "Other / Not sure"] }, { name: "plans", label: "Plans approved?", type: "boolean" }, ] },
    { key: "HVAC", fields: [ { name: "service", label: "Install or service?", type: "select", options: ["Install", "Service", "Repair", "Not sure"] }, { name: "units", label: "Number of units", type: "number" }, ] },
    { key: "Carpentry", fields: [ { name: "item", label: "What needs to be built?", type: "text" }, { name: "custom", label: "Custom / bespoke?", type: "boolean" }, ] },
  ];

  const assistantOnly = location.pathname.endsWith("/assistant") || searchParams.get("assistant") === "1";

  useEffect(() => {
    const openTab = sessionStorage.getItem("pb_open_tab");
    if (openTab) {
      setActiveTab(openTab);
      sessionStorage.removeItem("pb_open_tab"); 
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (assistantOnly) {
      setActiveTab("assistant");
    } else if (tab && DASHBOARD_TABS.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [assistantOnly]);

  useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => clearInterval(interval);
  }, []);

  function toggleProjectDetails(id) {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function commissionRateForBid(bidAmount) {
    const v = Number(bidAmount || 0);
    if (v <= 5000) return 0.20;
    if (v <= 20000) return 0.15;
    if (v <= 100000) return 0.10;
    return 0.05;
  }

  function commissionAmountForBid(bidAmount) {
    const rate = commissionRateForBid(bidAmount);
    return round2(Number(bidAmount || 0) * rate);
  }

  function getInclusiveTotal(baseAmount, inspectionFee = 0) {
    const base = Number(baseAmount || 0);
    const rate = commissionRateForBid(base);
    const comm = round2(base * rate);
    return round2(base + comm + Number(inspectionFee));
  }

  function isProjectPaid(p) {
    return safeLower(p?.payment_status) === "paid" || p?.paid === true;
  }

  function canPayEscrow(p) {
    if (!p) return false;
    if (isProjectPaid(p)) return false;

    const status = safeLower(p.status);
    const statusOk = status === "awarded" || status === "bid_accepted" || status === "in_progress";
    if (!statusOk) return false;

    const acceptedBidId = p?.metadata?.accepted_bid_id || p?.accepted_bid_id || p?.winning_bid_id || null;
    const bidAmount = Number(p?.bid_amount || 0);
    const totalAmount = Number(p?.metadata?.total_amount || 0);

    if (!acceptedBidId || !Number.isFinite(bidAmount) || bidAmount <= 0 || !Number.isFinite(totalAmount) || totalAmount <= 0) return false;
    return true;
  }

  function bidsByProjectId(bids) {
    const m = {};
    (bids || []).forEach((b) => {
      if (!b.project_id) return;
      const pid = String(b.project_id);
      if (!m[pid]) m[pid] = [];
      m[pid].push(b);
    });
    Object.keys(m).forEach((pid) => m[pid].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    return m;
  }

  const bidsMap = useMemo(() => bidsByProjectId(rawBids), [rawBids]);

  function attachBids(projects) {
    return (projects || []).map((p) => ({ ...p, bids: bidsMap[String(p.id)] || [] }));
  }

  async function loadAll() {
    setLoading(true);
    const { data: authResponse } = await supabase.auth.getUser();
    const currentUser = authResponse?.user;
    if (!currentUser) { navigate("/auth/login"); return; }
    setUser(currentUser);

    const expiry = new Date();
    expiry.setHours(expiry.getHours() - 48);
    await supabase.from("projects").update({ status: "expired" }).eq("category", "Construction").eq("status", "draft").lt("created_at", expiry.toISOString()).eq("owner_id", currentUser.id);

    const { data: drafts } = await supabase.from("projects").select("*").eq("category", "Construction").eq("status", "draft").eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: activeBase } = await supabase.from("projects").select("*").eq("category", "Construction").eq("status", "open").eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: progressBase } = await supabase.from("projects").select("*").eq("category", "Construction").in("status", ["awarded", "in_progress", "bid_accepted"]).eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: paidBase } = await supabase.from("projects").select("*").eq("category", "Construction").eq("owner_id", currentUser.id).eq("payment_status", "paid").order("created_at", { ascending: false });

    const allProjects = [...(activeBase || []), ...(progressBase || [])];
    const projectIds = allProjects.map((p) => p.id);

    let bids = [];
    if (projectIds.length > 0) {
      const { data: bidsData } = await supabase.from("bids").select("id, project_id, contractor_id, price, status, created_at").in("project_id", projectIds).order("created_at", { ascending: false });
      bids = bidsData || [];
    }
    setRawBids(bids);

    const paidIds = (paidBase || []).map((p) => p.id);
    let invoiceMap = {};
    if (paidIds.length > 0) {
      const { data: invs } = await supabase.from("invoices").select("id, project_id, status, base_amount, commission_amount, inspection_fee, total_amount, amount, created_at, paid_at").in("project_id", paidIds).order("created_at", { ascending: false });
      (invs || []).forEach((inv) => { if (!invoiceMap[inv.project_id]) invoiceMap[inv.project_id] = inv; });
    }

    setDraftProjects(drafts || []);
    setActiveProjects(activeBase || []);
    setProgressProjects(progressBase || []);
    setPaidProjects((paidBase || []).map((p) => ({ ...p, latestInvoice: invoiceMap[p.id] || null })));
    setLoading(false);
  }

  function toggleCategory(key) {
    setForm((prev) => {
      const categories = { ...(prev.categories || {}) };
      if (categories[key]) delete categories[key];
      else {
        const def = CATEGORY_DEFS.find((c) => c.key === key);
        if (!def) { categories[key] = {}; return { ...prev, categories }; }
        const blank = {};
        def.fields.forEach((f) => { blank[f.name] = f.type === "boolean" ? false : ""; });
        categories[key] = blank;
      }
      return { ...prev, categories };
    });
  }

  useEffect(() => {
    setTenderData((prev) => ({
      ...prev,
      current_project_data: {
        ...prev.current_project_data,
        project_title: aiDraft.project_name || prev.current_project_data.project_title,
        project_address_or_area: aiDraft.location || prev.current_project_data.project_address_or_area,
      },
    }));
  }, [aiDraft.project_name, aiDraft.location]);

  async function submitProject(mode = "manual") {
    const sourceData = { ...(mode === "ai" ? aiDraft : form) };

    if (!sourceData.project_name || !sourceData.project_name.trim()) {
      sourceData.project_name = "Property Repair / Renovation";
    }

    if (mode === "manual" && Object.keys(sourceData.categories || {}).length === 0) {
      alert("Please select at least one service category.");
      return;
    }

    if (!user) {
      alert("Session expired. Please log in again.");
      return;
    }

    if (mode === "ai" && !pricingConfirmed) {
      alert("Please confirm the expected cost range first before posting via AI.");
      return;
    }

    setLoading(true);

    const hours = Number(sourceData.bid_duration || 48);
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          owner_id: user.id,
          user_id: user.id,
          project_name: sourceData.project_name,
          location: sourceData.location || "Cape Town",
          description: sourceData.description ? sourceData.description.trim() : null,
          category: "Construction",
          status: "open",
          admin_status: "approved",
          paid: false,
          posting_fee_paid: false,
          payment_status: "unpaid",
          budget: null,
          metadata: {
            categories: sourceData.categories,
            description: sourceData.description ? sourceData.description.trim() : "", 
            created_by: mode === "ai" ? "ai_assistant" : "customer_manual",
            listing_fee_disabled: true,
            expected_cost_low: mode === "ai" ? estimate?.low ?? null : null,
            expected_cost_high: mode === "ai" ? estimate?.high ?? null : null,
            expected_cost_confirmed: mode === "ai" ? pricingConfirmed : false,
            bid_deadline: deadline.toISOString(),
            bidding_closed: false,
            tender: (mode === "ai" && tenderData?.sow_markdown)
              ? { sow_markdown: tenderData.sow_markdown, last_questions: tenderData.last_questions || [], updated_at: new Date().toISOString() }
              : null,
          },
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      console.error(error);
      alert("Failed to create project.");
      return;
    }

    if (mode === "ai") {
      setAiDraft({ project_name: "", location: "", description: "", categories: {}, bid_duration: "48" });
      setEstimate(null);
      setPricingConfirmed(false);
      setTenderData((prev) => ({ ...prev, current_project_data: { ...prev.current_project_data, project_title: "", project_address_or_area: "" }, last_questions: [], sow_markdown: null, is_ready: false }));
    } else {
      setForm({ project_name: "", location: "", description: "", categories: {}, bid_duration: "48" });
    }

    setActiveTab("active");
    await loadAll();
  }

  async function publishDraft(projectId) {
    if (!user) return;
    setLoading(true);
    await supabase.from("projects").update({ status: "open", posting_fee_paid: false, paid: false, payment_status: "unpaid", user_id: user.id }).eq("id", projectId).eq("owner_id", user.id);
    await loadAll();
    setActiveTab("active");
    setLoading(false);
  }

  async function closeBiddingEarly(projectId, metadata) {
    if (!window.confirm("Are you sure you want to close bidding? Contractors will no longer be able to submit new bids, but you can still accept the ones you have received.")) return;
    setLoading(true);
    const newMeta = { ...(metadata || {}), bidding_closed: true };
    const { error } = await supabase.from("projects").update({ metadata: newMeta }).eq("id", projectId);
    if (error) alert("Error closing bidding: " + error.message);
    await loadAll();
  }

  async function acceptBid(project, bid) {
    if (!user || awarding || isProjectPaid(project)) return;

    const base = Number(bid.price || 0);
    if (!base || base <= 0) { alert("This bid amount looks invalid."); return; }

    const inspectionFee = Number(project?.inspection_fee || 0);
    const commissionAmount = commissionAmountForBid(base);
    const total = getInclusiveTotal(base, inspectionFee);

    const confirmMsg = `Are you ready to accept this quote?\n\nTotal secure payment: R${total.toFixed(2)}\n\n(This includes all contractor materials/labor and platform escrow fees. You won't be charged anything extra.)`;
    if (!window.confirm(confirmMsg)) return;

    setAwarding(true);
    
    await supabase.from("bids").update({ status: "selected" }).eq("id", bid.id);
    await supabase.from("bids").update({ status: "rejected" }).eq("project_id", project.id).neq("id", bid.id);

    const { error: projErr } = await supabase.from("projects").update({
      status: "bid_accepted", 
      awarded_contractor_id: bid.contractor_id, 
      awarded_at: new Date().toISOString(), 
      bid_amount: base, 
      payment_status: "unpaid", 
      user_id: user.id,
      metadata: { ...(project.metadata || {}), accepted_bid_id: bid.id, commission_rate: commissionRateForBid(base), total_amount: total },
    }).eq("id", project.id);

    if (projErr) {
      alert("Error updating project: " + projErr.message);
      setAwarding(false);
      return; 
    }

    const { data: existingInv } = await supabase.from("invoices").select("id").eq("project_id", project.id).maybeSingle();

    const invPayload = {
      project_id: project.id,
      customer_id: user.id,
      contractor_id: bid.contractor_id,
      base_amount: base,
      commission_amount: commissionAmount,
      inspection_fee: inspectionFee,
      total_amount: total,
      amount: total,
      status: "pending_payment"
    };

    if (existingInv?.id) {
      await supabase.from("invoices").update(invPayload).eq("id", existingInv.id);
    } else {
      await supabase.from("invoices").insert([invPayload]);
    }

    await loadAll();
    setAwarding(false);
    
    localStorage.setItem("pb_last_dashboard", "/customer/construction");
    localStorage.setItem("pb_last_project_id", project.id);
    navigate(`/checkout/tradesafe/${project.id}`);
  }

  function fmtMoney(n) { return `R${Number(n || 0).toFixed(2)}`; }

  function isBiddingClosed(p) {
    if (p.metadata?.bidding_closed) return true;
    if (p.metadata?.bid_deadline && new Date(p.metadata.bid_deadline) <= new Date()) return true;
    return false;
  }

  function getTimeRemaining(p) {
    if (p.metadata?.bidding_closed) return "Bidding closed";
    const deadlineStr = p.metadata?.bid_deadline;
    if (!deadlineStr) return "Open";
    const diff = new Date(deadlineStr) - new Date();
    if (diff <= 0) return "Bidding closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `Closes in ${Math.floor(hours / 24)} days`;
    return `Closes in ${hours} hours`;
  }

  async function downloadInvoiceForPaid(p) {
     const inv = p?.latestInvoice;
     if (!inv?.id) { alert("No invoice found for this project yet."); return; }
     const doc = new jsPDF({ unit: "mm", format: "a4" });
     const COMPANY_NAME = "Project Broker";
     const ENQUIRY_EMAIL = "admin@projectbroker.co.za";
     const COMPANY_CITY = "Cape Town, South Africa";
     const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);
 
     doc.setDrawColor(180); doc.setLineWidth(0.6); doc.rect(10, 10, 190, 277);
     doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(COMPANY_NAME, 196, 18, { align: "right" });
     doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.text(COMPANY_CITY, 196, 24, { align: "right" }); doc.text(`Enquiries: ${ENQUIRY_EMAIL}`, 196, 29.5, { align: "right" });
     doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.text("INVOICE", 105, 48, { align: "center" });
     doc.setDrawColor(210); doc.line(14, 54, 196, 54);
     doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Invoice Details", 14, 64);
     doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.text(`Date: ${isoDate()}`, 14, 71); doc.text(`Invoice ID: ${inv.id}`, 14, 77);
     doc.text(`Project: ${p?.project_name || "Project"}`, 14, 86); doc.text(`Location: ${p?.location || "-"}`, 14, 92); doc.text(`Category: Construction`, 14, 98);
 
     const base = Number(inv?.base_amount || 0); const commission = Number(inv?.commission_amount || 0); const inspection = Number(inv?.inspection_fee || 0);
     let total = Number(inv?.total_amount ?? inv?.amount ?? 0); if (!total || total <= 0) total = base + commission + inspection;
 
     const startY = 112; doc.setFillColor(245, 245, 245); doc.setDrawColor(220); doc.rect(14, startY, 182, 10, "FD");
     doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text("Description", 18, startY + 7); doc.text("Amount", 190, startY + 7, { align: "right" });
     let y = startY + 18; doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
 
     const rows = [ { label: "Contractor Amount", amount: base }, { label: "Platform Commission", amount: commission }, { label: "Inspection Fee", amount: inspection }, ].filter((r) => Number(r.amount) !== 0);
     rows.forEach((r) => { doc.text(r.label, 18, y); doc.text(fmtMoney(r.amount), 190, y, { align: "right" }); y += 8; });
     doc.setDrawColor(220); doc.line(14, y, 196, y); y += 10;
     doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("TOTAL PAID", 18, y); doc.text(fmtMoney(total), 190, y, { align: "right" });
     doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80); doc.text(`Status: ${(inv?.status || "paid").toString().toUpperCase()}`, 14, 190);
     if (inv?.paid_at) doc.text(`Paid at: ${new Date(inv.paid_at).toLocaleString()}`, 14, 196); doc.setTextColor(0);
     doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(120); doc.text("Thank you for using Project Broker.", 14, 275); doc.text("For enquiries, contact admin@projectbroker.co.za", 14, 281); doc.setTextColor(0);
     doc.save(`Invoice-${inv.id}.pdf`);
  }

  if (loading && !user) {
    return (
      <DashboardLayout title="Customer Portal">
        <div style={styles.loadingWrap}>
          <h2 style={{ color: "#c5a059", fontFamily: "'Playfair Display', serif" }}>Loading Dashboard...</h2>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Customer Portal">
      <div style={styles.pageInner}>

        {!assistantOnly && (
          <div style={styles.tabs}>
            {DASHBOARD_TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? styles.activeTabBtn : styles.tabBtn}>
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* --- TAB: AI ASSISTANT --- */}
        {activeTab === "assistant" && (
          <div style={styles.stack}>
            <div style={styles.aiHero}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={styles.aiHeroBadge}>✨ New</div>
                  <div style={styles.aiHeroTitle}>{assistantOnly ? "Construction Assistant" : "AI Project Builder"}</div>
                  <div style={styles.aiHeroDesc}>Describe the job, upload photos if needed, and we’ll show an expected cost range <b>before</b> you post.</div>
                </div>
              </div>
              <div style={styles.aiHeroSteps}>
                <div style={styles.step}><div style={styles.stepN}>1</div><div><div style={styles.stepT}>Describe your job</div><div style={styles.stepS}>Speak or type naturally</div></div></div>
                <div style={styles.step}><div style={styles.stepN}>2</div><div><div style={styles.stepT}>Add photos if needed</div><div style={styles.stepS}>Boost accuracy</div></div></div>
                <div style={styles.step}><div style={styles.stepN}>3</div><div><div style={styles.stepT}>Confirm expected cost</div><div style={styles.stepS}>Then create project</div></div></div>
              </div>
            </div>

            <Panel title="✨ Project Assistant">
              <ProjectChatBot
                user={user}
                categoryDefs={CATEGORY_DEFS}
                currentForm={aiDraft} 
                tenderData={tenderData}
                onTenderData={(patch) => setTenderData((prev) => ({ ...prev, ...(patch || {}) }))}
                onApplyDraft={(draftUpdate) => {
                  setPricingConfirmed(false);
                  setAiDraft((prev) => {
                    
                    const safeDescription = (draftUpdate?.description && draftUpdate.description.trim().length > 5) 
                                            ? draftUpdate.description 
                                            : prev.description;

                    const nextDraft = {
                      ...prev,
                      project_name: draftUpdate?.project_name ?? prev.project_name,
                      location: draftUpdate?.location ?? prev.location,
                      description: safeDescription, 
                      categories: draftUpdate?.categories ?? prev.categories,
                    };

                    if (draftUpdate?.service_focus && typeof draftUpdate.service_focus === "string") {
                      const mappedCats = { ...nextDraft.categories };
                      const keywords = draftUpdate.service_focus.split(/[,\/&]+/).map(k => k.trim().toLowerCase());
                      
                      CATEGORY_DEFS.forEach(def => {
                        if (keywords.some(kw => def.key.toLowerCase().includes(kw) || kw.includes(def.key.toLowerCase()))) {
                          if (!mappedCats[def.key]) mappedCats[def.key] = { ai_selected: true };
                        }
                      });
                      
                      if (Object.keys(mappedCats).length > 0) {
                        nextDraft.categories = mappedCats;
                      }
                    }

                    return nextDraft;
                  });
                }}
                onEstimate={(est) => {
                  setPricingConfirmed(false);
                  if (est && typeof est === "object") setEstimate(est);
                }}
                onPriceAgreed={() => setPricingConfirmed(true)}
              />

              {aiDraft.project_name && (
                <div style={{ marginTop: 20, padding: 20, background: '#0b0d17', borderRadius: 12, border: '1px solid rgba(197, 160, 89, 0.3)' }}>
                   <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: '#c5a059', textTransform: "uppercase", letterSpacing: "1px" }}>Captured Details</h3>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: "#ffffff" }}>
                      <div><strong style={{ color: '#94a3b8' }}>Project Name:</strong><br/>{aiDraft.project_name || '-'}</div>
                      <div><strong style={{ color: '#94a3b8' }}>Location:</strong><br/>{aiDraft.location || '-'}</div>
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#94a3b8' }}>Services Required:</strong><br/>{Object.keys(aiDraft.categories || {}).length > 0 ? Object.keys(aiDraft.categories).join(', ') : 'None selected yet'}</div>
                      {aiDraft.description && (
                        <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                          <strong style={{ color: '#94a3b8' }}>Scope of Work / Notes:</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 4, lineHeight: 1.6 }}>
                            {aiDraft.description}
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <EstimatedRangeCard estimate={estimate} confirmed={pricingConfirmed} onConfirmYes={() => setPricingConfirmed(true)} onChangeDetails={() => { setPricingConfirmed(false); alert("No problem — tell the bot what changed."); }} />
              </div>

              {pricingConfirmed && (
                <div style={{ marginTop: 20, padding: 20, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(197, 160, 89, 0.3)" }}>
                  <Input 
                    label="Bid Collection Period (How long do you want to accept quotes?)" 
                    type="select" 
                    options={[ 
                      { value: "48", label: "48 Hours (2 Days)" }, 
                      { value: "72", label: "72 Hours (3 Days)" }, 
                      { value: "96", label: "96 Hours (4 Days)" }, 
                      { value: "120", label: "120 Hours (5 Days)" }
                    ]} 
                    value={aiDraft.bid_duration} 
                    onChange={(v) => setAiDraft({ ...aiDraft, bid_duration: v })} 
                    hint="You can always close bidding early once you find a contractor you like." 
                  />
                  <button
                    style={{ ...styles.submitBtn, marginTop: 16, opacity: loading || !pricingConfirmed ? 0.7 : 1 }}
                    onClick={() => submitProject("ai")}
                    disabled={loading || !pricingConfirmed}
                    title={!pricingConfirmed ? "Confirm expected cost range first" : ""}
                  >
                    {loading ? "Creating..." : "Post Project & Start Getting Quotes"}
                  </button>
                </div>
              )}
            </Panel>
          </div>
        )}

        {/* --- TAB: MANUAL SETUP --- */}
        {activeTab === "manual" && (
          <div style={styles.stack}>
            <Panel title="Standard Project Setup (Manual)">
              <div style={styles.formGrid}>
                <Input label="Project Name" value={form.project_name} onChange={(v) => setForm({ ...form, project_name: v })} />
                <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
              </div>
              
              <Input label="Scope of Work / Description" type="textarea" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe the job requirements, measurements, etc." />

              <div style={styles.noticeBox}><strong>Update:</strong> The R50 listing/admin fee has been <b>temporarily disabled</b>. Your project will go live immediately.</div>

              <Input 
                label="Bid Collection Period (How long do you want to accept quotes?)" 
                type="select" 
                options={[ 
                  { value: "48", label: "48 Hours (2 Days)" }, 
                  { value: "72", label: "72 Hours (3 Days)" }, 
                  { value: "96", label: "96 Hours (4 Days)" }, 
                  { value: "120", label: "120 Hours (5 Days)" }
                ]} 
                value={form.bid_duration} 
                onChange={(v) => setForm({ ...form, bid_duration: v })} 
                hint="You can always close bidding early once you find a contractor you like." 
              />

              <h3 style={{ margin: "20px 0 12px", color: "#c5a059", fontFamily: "'Playfair Display', serif" }}>Services Required</h3>
              <div style={styles.pillGrid}>
                {CATEGORY_DEFS.map((c) => (
                  <button key={c.key} onClick={() => toggleCategory(c.key)} style={form.categories?.[c.key] ? styles.activePill : styles.pill}>{c.key}</button>
                ))}
              </div>

              {Object.keys(form.categories || {}).map((cat) => {
                const def = CATEGORY_DEFS.find((c) => c.key === cat);
                if (!def) return null;
                return (
                  <div key={cat} style={{ background: "#0b0d17", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
                    <h3 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{cat} Details</h3>
                    {def.fields.map((f) => (
                      <Input key={f.name} label={f.label} type={f.type} options={f.options} placeholder={f.placeholder || ""} hint={f.hint || ""} value={form.categories?.[cat]?.[f.name]} onChange={(v) => { setForm((prev) => ({ ...prev, categories: { ...(prev.categories || {}), [cat]: { ...(prev.categories?.[cat] || {}), [f.name]: v } } })); }} />
                    ))}
                  </div>
                );
              })}

              <button style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} onClick={() => submitProject("manual")} disabled={loading}>
                {loading ? "Creating..." : "Post Project & Start Getting Quotes"}
              </button>
            </Panel>
          </div>
        )}

        {/* --- TAB: ACTIVE BIDS --- */}
        {activeTab === "active" && (
          <Panel title="Your Open Projects (Pick a bid)">
            {draftProjects.length === 0 && activeProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No open projects.</p>}
            
            {draftProjects.map((p) => (
              <div key={p.id} style={{ ...styles.card, border: "2px dashed #c5a059" }}>
                <strong style={{color: "#ffffff", fontSize: 18}}>{p.project_name}</strong><p style={{ margin: "8px 0 0", color: "#94a3b8" }}>Draft project (legacy)</p>
                <button style={styles.resumeBtn} onClick={() => publishDraft(p.id)} disabled={loading}>Publish Project</button>
              </div>
            ))}
            
            {attachBids(activeProjects).map((p) => {
              const isExpanded = !!expandedProjects[p.id];
              const estLow = Number(p?.metadata?.expected_cost_low || 0);
              const estHigh = Number(p?.metadata?.expected_cost_high || 0);
              const closed = isBiddingClosed(p);

              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontSize: 18, color: "#ffffff" }}>{p.project_name}</strong>
                      
                      <div style={{ color: "#94a3b8", marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                        <span>{p.location || "No location"}</span>
                        <span style={{color: "#c5a059"}}>•</span>
                        <span style={{ fontWeight: 800, color: closed ? "#f87171" : "#fcf6ba" }}>
                          {getTimeRemaining(p)}
                        </span>
                      </div>
                      
                      {(estLow > 0 || estHigh > 0) && (
                        <div style={{ color: "#c5a059", marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                          🤖 AI Est: {fmtMoneyZar(estLow)} – {fmtMoneyZar(estHigh)}
                        </div>
                      )}
                      
                      <button 
                        style={{ ...styles.pill, marginTop: 14 }} 
                        onClick={() => toggleProjectDetails(p.id)}
                      >
                        {isExpanded ? "Hide details ↑" : "More details ↓"}
                      </button>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, color: "#ffffff", fontSize: 14 }}>{(p.bids || []).length} bid(s)</div>
                      {!closed && (
                        <button style={{ ...styles.closeBtn, marginTop: 10 }} onClick={() => closeBiddingEarly(p.id, p.metadata)}>
                          Close Bidding 🛑
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px dashed rgba(197, 160, 89, 0.4)", fontSize: 14, color: "#ffffff", lineHeight: 1.6 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                        <div>
                          <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Services Requested:</strong><br/>
                          <span style={{color: "#e2e8f0"}}>{p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 ? Object.keys(p.metadata.categories).join(", ") : "-"}</span>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Project Scope / Notes:</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: "#e2e8f0" }}>
                            {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.05)", margin: "20px 0" }} />

                  {(p.bids || []).length === 0 ? (
                    <p style={{ color: "#94a3b8", marginTop: 0 }}>No bids yet. Contractors will appear here once they bid.</p>
                  ) : (
                    <div>
                      {(p.bids || []).map((b) => {
                        const inclusiveTotal = getInclusiveTotal(b.price, p.inspection_fee);
                        
                        return (
                          <div key={b.id} style={styles.bidRow}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 18, color: "#ffffff", fontFamily: "'Playfair Display', serif" }}>
                                {fmtMoneyZar(inclusiveTotal)}
                              </div>
                              <div style={{ color: "#c5a059", fontSize: 11, fontWeight: 700, marginTop: 4, textTransform: "uppercase" }}>
                                Total Inclusive Price
                              </div>
                              <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 6 }}>
                                Contractor: {b.contractor_id.substring(0,8)}...
                              </div>
                            </div>
                            
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              {isProjectPaid(p) ? (
                                <span style={{ ...styles.chip, borderColor: "#10b981", background: "rgba(16,185,129,0.1)", color: "#34d399" }}>paid</span>
                              ) : safeLower(b.status) === "pending" ? (
                                <button style={styles.acceptBtn} onClick={() => acceptBid(p, b)} disabled={awarding}>
                                  {awarding ? "Processing..." : "Accept Quote & Pay"}
                                </button>
                              ) : safeLower(b.status) === "selected" ? (
                                <button 
                                  style={{ ...styles.acceptBtn, background: "linear-gradient(135deg, #b38728, #c5a059)", color: "#000" }} 
                                  onClick={() => { localStorage.setItem("pb_last_dashboard", "/customer/construction"); localStorage.setItem("pb_last_project_id", p.id); navigate(`/checkout/tradesafe/${p.id}`); }}
                                >
                                  Complete Payment
                                </button>
                              ) : (
                                <span style={styles.chip}>{b.status === "accepted" ? "Awarded" : b.status}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Panel>
        )}

        {/* --- TAB: IN PROGRESS --- */}
        {activeTab === "progress" && (
          <Panel title="Projects In Progress">
            {progressProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No projects currently in progress.</p>}
            {progressProjects.map((p) => {
              const payAllowed = canPayEscrow(p);
              const looksAwardedButMissing = !isProjectPaid(p) && ["awarded", "bid_accepted", "in_progress"].includes(safeLower(p.status)) && !payAllowed;
              const isExpanded = !!expandedProjects[p.id];
              
              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontSize: 18, color: "#ffffff" }}>{p.project_name}</strong>
                      <div style={{color: "#94a3b8", marginTop: 6}}>Status: <span style={{ textTransform: "capitalize", color: "#ffffff" }}>{p.status}</span></div>
                      <div style={{ color: "#94a3b8", marginTop: 4 }}>Payment: <span style={{color: "#ffffff"}}>{p.payment_status || "unpaid"}</span></div>
                      <div style={{ color: "#c5a059", marginTop: 6, fontSize: 13, fontWeight: 700 }}>Total Secure Escrow: R{Number(p?.metadata?.total_amount || 0).toFixed(2)}</div>
                      
                      <button 
                        style={{ ...styles.pill, marginTop: 14 }} 
                        onClick={() => toggleProjectDetails(p.id)}
                      >
                        {isExpanded ? "Hide details ↑" : "More details ↓"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px dashed rgba(197, 160, 89, 0.4)", fontSize: 14, color: "#ffffff", lineHeight: 1.6 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                        <div>
                          <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Services Requested:</strong><br/>
                          <span style={{color: "#e2e8f0"}}>{p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 ? Object.keys(p.metadata.categories).join(", ") : "-"}</span>
                        </div>
                        <div style={{ marginTop: 10 }}>
                          <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Project Scope / Notes:</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: "#e2e8f0" }}>
                            {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isProjectPaid(p) && <div style={{ marginTop: 16, fontWeight: 800, color: "#34d399" }}>Paid ✅ (Moved to Payments tab)</div>}
                  
                  {payAllowed && (
                    <button style={{ ...styles.submitBtn, marginTop: 16, background: "linear-gradient(135deg, #34d399, #10b981)" }} onClick={() => { localStorage.setItem("pb_last_dashboard", "/customer/construction"); localStorage.setItem("pb_last_project_id", p.id); navigate(`/checkout/tradesafe/${p.id}`); }}>
                      Pay via TradeSafe (Escrow)
                    </button>
                  )}
                  
                  {looksAwardedButMissing && <div style={styles.warnBox}>Payment is unavailable because no accepted bid amount was found yet. Please accept a bid first.</div>}
                </div>
              );
            })}
          </Panel>
        )}

        {/* --- TAB: PAYMENTS --- */}
        {activeTab === "payments" && (
          <Panel title="Payments (Paid Projects)">
            {paidProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No paid projects yet.</p>}
            {paidProjects.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <strong style={{fontSize: 18, color: "#ffffff"}}>{p.project_name}</strong>
                    <div style={{ color: "#94a3b8", marginTop: 8 }}>{p.location || "No location"} • <span style={{color: "#c5a059", fontWeight: 700}}>Total: R{Number(p?.latestInvoice?.total_amount ?? p?.latestInvoice?.amount ?? p?.metadata?.total_amount ?? 0).toFixed(2)}</span></div>
                  </div>
                  <span style={{ ...styles.chip, borderColor: "#10b981", background: "rgba(16,185,129,0.1)", color: "#34d399" }}>paid</span>
                </div>
                <button style={{ ...styles.submitBtn, marginTop: 16, background: "#1e2235", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" }} onClick={() => setSelectedPaid(p)}>View Details</button>
              </div>
            ))}
            
            {selectedPaid && (
              <div style={styles.modalBackdrop} onClick={() => setSelectedPaid(null)}>
                <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ marginTop: 0, color: "#ffffff", fontFamily: "'Playfair Display', serif" }}>{selectedPaid.project_name}</h2>
                  <div style={{ color: "#94a3b8" }}>Location: {selectedPaid.location || "-"}</div>
                  <div style={{ color: "#94a3b8", marginTop: 6 }}>Status: <span style={{color: "#ffffff"}}>{selectedPaid.status}</span></div>
                  <div style={{ color: "#94a3b8", marginTop: 6 }}>Payment Status: <span style={{color: "#34d399"}}>{selectedPaid.payment_status}</span></div>
                  
                  <div style={styles.invoiceCard}>
                    <div style={{ fontWeight: 800, color: "#c5a059", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Invoice</div>
                    <div style={styles.invoiceLine}>Invoice ID: {selectedPaid.latestInvoice?.id || "—"}</div>
                    <div style={styles.invoiceLine}>Paid at: {selectedPaid.latestInvoice?.paid_at ? new Date(selectedPaid.latestInvoice.paid_at).toLocaleString() : "—"}</div>
                  </div>
                  
                  <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                    <button style={styles.submitBtn} onClick={() => downloadInvoiceForPaid(selectedPaid)}>Download Invoice (PDF)</button>
                    <button style={{...styles.submitBtn, background: "transparent", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", boxShadow: "none"}} onClick={() => setSelectedPaid(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        )}

        {/* --- TAB: LEGAL & T&Cs --- */}
        {activeTab === "legal" && (
          <div style={styles.stack}>
            <Panel title="Platform Policies & Agreements">
              <p style={{ color: "#94a3b8", marginBottom: 20, fontSize: 14 }}>
                Below are the agreements you consented to when registering for Project Broker. 
                These protect both you and the contractors on our platform.
              </p>

              <div style={styles.legalContent}>
                <div style={styles.legalSectionTitle}>1. Project Broker Terms of Service (Platform Agreement)</div>
                <strong style={{color: "#ffffff"}}>1.1. Limitation of Liability</strong>
                <p>Project Broker operates exclusively as an online intermediary platform that connects customers with independent service providers. Project Broker does not provide construction or event planning services itself.</p>
                <p>To the maximum extent permitted by South African law, Project Broker shall not be held liable for any direct, indirect, incidental, special, or consequential damages arising out of or in connection with the services rendered by a Contractor.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#ffffff" }}>1.2. Escrow Payments</strong>
                <p>All project payments must be routed through the TradeSafe escrow system. Attempting to circumvent the platform for direct cash payments is a violation of these terms and removes all platform protections.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#ffffff" }}>1.3. Disputes</strong>
                <p>Any disputes regarding the quality of work must be resolved directly between the Customer and the Contractor using TradeSafe dispute mechanisms.</p>
              </div>

              <div style={styles.legalContent}>
                <div style={styles.legalSectionTitle}>2. Customer & Contractor Direct Service Agreement</div>
                <p style={{color: "#c5a059"}}><em>(This contract takes effect the moment you click "Accept Quote & Pay")</em></p>
                <strong style={{ display: "block", marginTop: 12, color: "#ffffff" }}>2.1. Parties</strong>
                <p>This agreement is made directly between the Customer and the Contractor. Project Broker is not a party to this agreement.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#ffffff" }}>2.2. Scope of Work</strong>
                <p>The Contractor agrees to perform the services detailed in the accepted project listing, including any materials, labor, and timelines specified in the bid and platform messages.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#ffffff" }}>2.3. Warranties and Liability</strong>
                <p>The Contractor warrants that all work will be performed in a professional, workmanlike manner and in compliance with all applicable South African building codes and regulations (including issuing COCs where applicable by law). The Contractor holds the Customer harmless against any claims arising from the Contractor's negligence.</p>
              </div>

              <div style={styles.legalContent}>
                <div style={styles.legalSectionTitle}>3. POPIA Privacy Policy</div>
                <strong style={{color: "#ffffff"}}>3.1. Introduction</strong>
                <p>Project Broker respects your privacy and is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#ffffff" }}>3.2. Information We Collect & Share</strong>
                <p>We collect identity data, location data for project sites, and financial data necessary to facilitate secure escrow payments via TradeSafe (including FICA compliance). Your data is only shared with the specific Contractor you award a bid to, our escrow partner TradeSafe, or legal authorities if required by law. We do not sell your personal data.</p>
              </div>
            </Panel>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default CustomerDashboard;

/* ---------------- AI PROJECT BUILDER (CHAT + UPLOADS) ---------------- */

function ProjectChatBot({ user, currentForm, categoryDefs, tenderData, onTenderData, onApplyDraft, onEstimate, onPriceAgreed }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I'm your Project Builder 😊 Tell me what construction or maintenance project you need help with. Give me as much detail as you can (measurements, specific rooms, what needs fixing) and I'll ask smart follow-ups so contractors can quote you accurately.",
    },
  ]);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [uploads, setUploads] = useState([]);

  const chatLogRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, uploads]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel?.();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function speak(text) {
    if (!speakReplies) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const fixedText = text.replace(/R(\d{1,3}(?:,\d{3})*)/g, (match, num) => num.replace(/,/g, '') + " Rand");
      
      const res = await fetch("/api/tts.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fixedText }),
      });
      
      if (!res.ok) throw new Error("TTS generation failed");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("Audio playback error, falling back to browser voice:", err);
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-ZA";
      window.speechSynthesis.speak(u);
    }
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not available.");
      return;
    }
    if (recognitionRef.current) return;

    const rec = new SpeechRecognition();
    rec.lang = "en-ZA";
    rec.interimResults = true;
    rec.continuous = true;

    rec.onstart = () => setListening(true);
    rec.onerror = () => setListening(false);
    rec.onend = () => { setListening(false); recognitionRef.current = null; };

    rec.onresult = (event) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + " ";
      }
      if (final.trim()) setInput((p) => (p ? p + " " : "") + final.trim());
    };

    recognitionRef.current = rec;
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop?.();
    setListening(false);
  }

  async function onUpload(url) {
    if (!url) return;
    setUploads((u) => [...u, { file_url: url, media_type: "image" }]);
    const uploadMsg = "Got the photo ✅ I'll factor that into the scope.";
    setMessages((prev) => [...prev, { role: "assistant", content: uploadMsg }]);
    speak(uploadMsg);
  }

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/project-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "events", // or "construction"
          messages: nextMessages,
          current_form: currentForm,
          category_defs: categoryDefs
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      setMessages((prev) => [...prev, { role: "assistant", content: data.assistant_message }]);
      
      if (speakReplies && data.audioBase64) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        const audio = new Audio("data:audio/mpeg;base64," + data.audioBase64);
        audioRef.current = audio;
        audio.play().catch(e => console.error("Base64 Audio play error:", e));
      } else if (speakReplies) {
        speak(data.assistant_message);
      }
      
      if (data.draft_update) {
        onApplyDraft(data.draft_update);
      }

      if (data.estimate && data.estimate.low && data.estimate.high) {
        onEstimate({
          low: data.estimate.low,
          high: data.estimate.high,
          confidence: data.estimate.confidence ?? null,
          factors: data.estimate.factors ?? [],
          source: "ai",
        });
      }

      if (data.ready_to_post) {
        onPriceAgreed();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "✅ Your project has been prepared! Please review the captured details below and click the 'Create Project' button to make it live." }
        ]);
        speak("Your project has been prepared! Please review the captured details below and click the post button to make it live.");
      }
      
    } catch (err) {
      console.error(err);
      alert("Couldn't reach Project Builder — is the backend still running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ padding: 24, borderRadius: 16, border: "1px solid #c5a059", background: "#12141c", marginBottom: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#c5a059", fontFamily: "'Playfair Display', serif" }}>✨ AI Project Builder</div>
            <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Chat naturally — upload photos — get accurate Rand estimates for contractors</div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
            <input type="checkbox" checked={speakReplies} onChange={(e) => setSpeakReplies(e.target.checked)} />
            🔊 Read replies aloud
          </label>
        </div>

        <div style={{ marginTop: 12, maxHeight: 400, overflowY: "auto", padding: 20, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)" }} ref={chatLogRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", color: m.role === "user" ? "#ffffff" : "#c5a059", marginBottom: 6 }}>
                {m.role === "user" ? "You" : "Project Builder"}
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: m.role === "user" ? "#ffffff" : "#cbd5e1", lineHeight: 1.6, fontSize: 15 }}>{m.content}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#ffffff", fontSize: 13, textTransform: "uppercase", letterSpacing: "1px" }}>Upload project photos</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Damage, spaces, blueprints, inspiration</div>
          </div>
          <UploadButton folder={`project-pro/${user?.id || "anon"}`} label="Upload photo" onUpload={onUpload} />
        </div>

        {uploads.length > 0 && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
            {uploads.slice(0, 8).map((u, i) => (
              <a key={i} href={u.file_url} target="_blank" rel="noreferrer" style={{ display: "block", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(197, 160, 89, 0.3)", background: "#0b0d17" }}>
                <img src={u.file_url} alt="upload" style={{ width: "100%", height: 90, objectFit: "cover" }} />
              </a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. I need my kitchen tiled, roughly 15 square meters..."
            style={{ flex: 1, minWidth: 240, padding: 16, borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.4)", background: "#0b0d17", outline: "none", fontSize: 15, color: "#ffffff" }}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
          />

          {!listening ? (
            <button type="button" onClick={startListening} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.3)", background: "#1e2235", color: "#c5a059", cursor: "pointer", fontWeight: 800 }}>
              🎤 Talk
            </button>
          ) : (
            <button type="button" onClick={stopListening} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", cursor: "pointer", fontWeight: 800 }}>
              ⏹ Stop
            </button>
          )}

          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)", color: "#000", cursor: "pointer", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", opacity: busy || !input.trim() ? 0.6 : 1 }}
          >
            {busy ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}