// EventCustomerDashboard.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import UploadButton from "../../components/UploadButton.jsx";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

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

/* ---------------- PREMIUM DARK THEME STYLES ---------------- */
const styles = {
  pageContainer: { maxWidth: 1000, margin: "0 auto", padding: "0 10px", fontFamily: "'Inter', sans-serif" },
  tabs: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  tabBtn: {
    padding: "10px 20px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "0.3s"
  },
  activeTabBtn: {
    padding: "10px 20px", borderRadius: 50, border: "1px solid #c5a059",
    background: "rgba(197, 160, 89, 0.15)", color: "#c5a059", fontWeight: 800, fontSize: 13,
  },
  panel: {
    background: "#12141c", padding: 24, borderRadius: 20, marginBottom: 20,
    border: "1px solid rgba(197, 160, 89, 0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  input: {
    width: "100%", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", marginTop: 8, outline: "none", fontSize: "14px"
  },
  textarea: {
    width: "100%", minHeight: 120, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", marginTop: 8, outline: "none", resize: "vertical", fontSize: "14px"
  },
  formGrid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 },
  pillGrid: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  pill: {
    padding: "10px 16px", borderRadius: 50, border: "1px solid rgba(197, 160, 89, 0.3)",
    background: "transparent", color: "#c5a059", cursor: "pointer", fontSize: 12, fontWeight: 700,
  },
  activePill: {
    padding: "10px 16px", borderRadius: 50, border: "none",
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    color: "#000", cursor: "pointer", fontSize: 12, fontWeight: 800,
  },
  submitBtn: {
    width: "100%", padding: 16, borderRadius: 50,
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    fontWeight: 800, border: "none", cursor: "pointer", fontSize: 14, textTransform: "uppercase", letterSpacing: "1px",
    color: "#000", boxShadow: "0 4px 15px rgba(197, 160, 89, 0.2)", transition: "transform 0.2s"
  },
  card: { 
    background: "#12141c", padding: 20, borderRadius: 16, marginBottom: 16, 
    border: "1px solid rgba(255,255,255,0.05)", position: "relative" 
  },
  aiHero: {
    position: "relative", padding: 24, borderRadius: 20, border: "1px solid rgba(197, 160, 89, 0.3)",
    background: "radial-gradient(circle at top right, rgba(197, 160, 89, 0.1), transparent), #12141c",
    marginBottom: 24
  },
  estimateCard: {
    padding: 20, borderRadius: 16, border: "1px solid #c5a059",
    background: "rgba(197, 160, 89, 0.05)", marginTop: 16
  },
  chatCard: { 
    padding: 20, borderRadius: 20, border: "1px solid rgba(255,255,255,0.05)", 
    background: "#12141c", marginBottom: 16 
  },
  chatLog: { 
    marginTop: 12, maxHeight: 350, overflowY: "auto", padding: 16, 
    borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)" 
  },
  chatInput: { 
    flex: 1, padding: 14, borderRadius: 50, border: "1px solid rgba(197, 160, 89, 0.3)", 
    background: "#0b0d17", color: "#fff", outline: "none" 
  },
  modalBackdrop: {
    position: "fixed", inset: 0, background: "rgba(11, 13, 23, 0.9)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 9999
  },
  modalCard: {
    width: "100%", maxWidth: 550, background: "#12141c", borderRadius: 24, padding: 24,
    border: "1px solid #c5a059", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
  }
};

/* ---------------- UI COMPONENTS ---------------- */

const Input = ({ label, value, onChange, type = "text", options = [], placeholder = "" }) => {
  const hasOptions = Array.isArray(options) && options.length > 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontWeight: 700, color: "#c5a059", fontSize: 11, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</label>
      {type === "boolean" ? (
        <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" style={Boolean(value) === true ? styles.activePill : styles.pill} onClick={() => onChange(true)}>Yes</button>
          <button type="button" style={Boolean(value) === false ? styles.activePill : styles.pill} onClick={() => onChange(false)}>No</button>
        </div>
      ) : type === "select" && hasOptions ? (
        <select style={styles.input} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={styles.textarea} placeholder={placeholder} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={styles.input} placeholder={placeholder} />
      )}
    </div>
  );
};

const Panel = ({ title, children }) => (
  <div style={styles.panel}>
    <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "20px", marginBottom: "20px", marginTop: 0 }}>{title}</h3>
    {children}
  </div>
);

function EstimatedRangeCard({ estimate, confirmed, onConfirmYes, onChangeDetails }) {
  if (!estimate) return null;
  const low = Number(estimate.low || 0);
  const high = Number(estimate.high || 0);

  return (
    <div style={styles.estimateCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ color: "#c5a059", fontWeight: 800, fontSize: "12px", textTransform: "uppercase" }}>Expected Cost (AI Estimate)</div>
        <div style={{ padding: "4px 8px", borderRadius: 50, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", fontSize: 11, fontWeight: 800 }}>
          {estimate.confidence != null ? `${Math.round(Number(estimate.confidence) * 100)}% Confidence` : "Estimate"}
        </div>
      </div>
      <div style={{ fontSize: "32px", color: "#fff", fontWeight: 800, marginTop: "10px", fontFamily: "'Playfair Display', serif" }}>
        {fmtMoneyZar(low)} – {fmtMoneyZar(high)}
      </div>
      <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "10px", lineHeight: 1.5 }}>
        This is the expected range most vendor bids will likely fall within. <strong style={{ color: "#fff" }}>Do you want to create this event project?</strong>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!confirmed ? (
          <>
            <button type="button" style={{ ...styles.pill, background: "#166534", borderColor: "#166534", color: "#fff" }} onClick={onConfirmYes}>✅ Yes, create my project</button>
            <button type="button" style={{ ...styles.pill, color: "#fff", borderColor: "rgba(255,255,255,0.2)" }} onClick={onChangeDetails}>✏️ No, edit details</button>
          </>
        ) : (
          <div style={{ padding: "8px 14px", borderRadius: 50, background: "rgba(22, 101, 52, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 13, border: "1px solid rgba(74, 222, 128, 0.3)" }}>
            Confirmed ✅ Ready to post.
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
];

export default function EventCustomerDashboard() {
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

  const [aiDraft, setAiDraft] = useState({ project_name: "", location: "", event_date: "", guest_count: "", event_type: "", description: "", categories: {} });
  const [estimate, setEstimate] = useState(null); 
  const [pricingConfirmed, setPricingConfirmed] = useState(false);

  const [form, setForm] = useState({ project_name: "", location: "", event_date: "", guest_count: "", event_type: "", description: "", categories: {} });

  const SERVICE_DEFS = [
    { key: "Catering", fields: [ { name: "food_type", label: "Type of food", type: "select", options: ["Plated", "Buffet", "Finger food / Canapes", "Food truck"] }, { name: "dietary", label: "Dietary requirements?", type: "text", placeholder: "e.g. Halaal, Vegan, Gluten-free" } ] },
    { key: "Photography", fields: [ { name: "style", label: "Photography style", type: "select", options: ["Candid", "Traditional", "Mix", "Not sure"] }, { name: "hours", label: "Hours needed", type: "number" }, { name: "videography", label: "Include videography?", type: "boolean" } ] },
    { key: "Venue", fields: [ { name: "venue_type", label: "Venue vibe", type: "select", options: ["Indoor", "Outdoor", "Beach", "Wine Farm", "Industrial"] }, { name: "capacity", label: "Expected capacity", type: "number" } ] },
    { key: "Decor", fields: [ { name: "theme", label: "Theme / Colors", type: "text" }, { name: "flowers", label: "Fresh flowers needed?", type: "boolean" } ] },
    { key: "DJ / Music", fields: [ { name: "genre", label: "Preferred music genres", type: "text" }, { name: "equipment", label: "Does DJ need to bring sound system?", type: "boolean" } ] },
    { key: "Security", fields: [ { name: "guards", label: "Number of guards needed", type: "number" } ] },
    { key: "Event Planner", fields: [ { name: "level", label: "Level of service", type: "select", options: ["Full planning", "Day-of coordination", "Consulting"] } ] },
    { key: "Equipment Hire", fields: [ { name: "items", label: "What do you need?", type: "text", placeholder: "e.g. Tents, chairs, tables, glasses" } ] }
  ];

  const assistantOnly = location.pathname.endsWith("/assistant") || searchParams.get("assistant") === "1";

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
  }, []);

  function toggleProjectDetails(id) {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function commissionRateForBid(bidAmount) {
    const v = Number(bidAmount || 0);
    if (v <= 5000) return 0.05;
    if (v <= 15000) return 0.075;
    if (v <= 30000) return 0.1;
    if (v <= 60000) return 0.125;
    if (v <= 120000) return 0.15;
    if (v <= 250000) return 0.175;
    return 0.2;
  }

  function commissionAmountForBid(bidAmount) {
    const rate = commissionRateForBid(bidAmount);
    return round2(Number(bidAmount || 0) * rate);
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
    const { data: authResponse, error: authErr } = await supabase.auth.getUser();
    const currentUser = authResponse?.user;
    if (!currentUser) { navigate("/auth/login"); return; }
    setUser(currentUser);

    const expiry = new Date();
    expiry.setHours(expiry.getHours() - 48);
    // Note: Checking category = Events
    await supabase.from("projects").update({ status: "expired" }).eq("category", "Events").eq("status", "draft").lt("created_at", expiry.toISOString()).eq("owner_id", currentUser.id);

    const { data: drafts } = await supabase.from("projects").select("*").eq("category", "Events").eq("status", "draft").eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: activeBase } = await supabase.from("projects").select("*").eq("category", "Events").eq("status", "open").eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: progressBase } = await supabase.from("projects").select("*").eq("category", "Events").in("status", ["awarded", "in_progress", "bid_accepted"]).eq("owner_id", currentUser.id).order("created_at", { ascending: false });
    const { data: paidBase } = await supabase.from("projects").select("*").eq("category", "Events").eq("owner_id", currentUser.id).eq("payment_status", "paid").order("created_at", { ascending: false });

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
    setActiveProjects(attachBids(activeBase || []));
    setProgressProjects(attachBids(progressBase || []));
    setPaidProjects((paidBase || []).map((p) => ({ ...p, latestInvoice: invoiceMap[p.id] || null })));
    setLoading(false);
  }

  function toggleCategory(key) {
    setForm((prev) => {
      const categories = { ...(prev.categories || {}) };
      if (categories[key]) delete categories[key];
      else {
        const def = SERVICE_DEFS.find((c) => c.key === key);
        if (!def) { categories[key] = {}; return { ...prev, categories }; }
        const blank = {};
        def.fields.forEach((f) => { blank[f.name] = f.type === "boolean" ? false : ""; });
        categories[key] = blank;
      }
      return { ...prev, categories };
    });
  }

  async function submitProject(mode = "manual") {
    const sourceData = { ...(mode === "ai" ? aiDraft : form) };

    if (!sourceData.project_name || !sourceData.project_name.trim()) {
      sourceData.project_name = "Event Project";
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

    // 1. PULL THE LEAD FROM BROWSER MEMORY
    const activeLeadRaw = sessionStorage.getItem("pb_active_lead");
    const scoperLead = activeLeadRaw ? JSON.parse(activeLeadRaw) : null;

    const { data, error } = await supabase
      .from("projects")
      .insert([
        {
          owner_id: user.id,
          user_id: user.id,
          project_name: sourceData.project_name,
          location: sourceData.location || "Cape Town",
          description: sourceData.description ? sourceData.description.trim() : null, 
          category: "Events",
          status: "open",
          admin_status: "approved",
          paid: false,
          posting_fee_paid: false,
          payment_status: "unpaid",
          budget: null,
          metadata: {
            categories: sourceData.categories,
            description: sourceData.description ? sourceData.description.trim() : "", 
            event_date: sourceData.event_date || "",
            guest_count: sourceData.guest_count || "",
            event_type: sourceData.event_type || "",
            created_by: mode === "ai" ? "ai_assistant" : "customer_manual",
            listing_fee_disabled: true,
            expected_cost_low: mode === "ai" ? estimate?.low ?? null : null,
            expected_cost_high: mode === "ai" ? estimate?.high ?? null : null,
            expected_cost_confirmed: mode === "ai" ? pricingConfirmed : false,
          },
          
          // 2. ATTACH THE SCOPER DATA DIRECTLY TO THE NEW COLUMNS
          scoper_agent_id: scoperLead ? user.id : null, 
          scoper_client_details: scoperLead ? {
            agent_assisted: true,
            customer_name: scoperLead.customer_name || "Self-Posted",
            customer_phone: scoperLead.customer_phone || "N/A",
            customer_email: scoperLead.customer_email || "N/A",
            target_profit: scoperLead.estimated_profit || 0,
            commission_due: Number(scoperLead.estimated_profit || 0) * 0.02
          } : null
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error || !data) {
      console.error(error);
      alert("Failed to create event project.");
      return;
    }

    if (mode === "ai") {
      setAiDraft({ project_name: "", location: "", event_date: "", guest_count: "", event_type: "", description: "", categories: {} });
      setEstimate(null);
      setPricingConfirmed(false);
    } else {
      setForm({ project_name: "", location: "", event_date: "", guest_count: "", event_type: "", description: "", categories: {} });
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

  async function acceptBid(project, bid) {
    if (!user || awarding || isProjectPaid(project)) return;

    const base = Number(bid.price || 0);
    if (!base || base <= 0) { alert("This bid amount looks invalid."); return; }

    const inspectionFee = Number(project?.inspection_fee || 0);
    const commissionAmount = commissionAmountForBid(base);
    const total = round2(Number(base) + Number(commissionAmount) + Number(inspectionFee));

    const confirmMsg = `Accept this bid?\n\nVendor bid: R${base.toFixed(2)}\nCommission (${(commissionRateForBid(base) * 100).toFixed(1)}%): R${Number(commissionAmount).toFixed(2)}\nInspection fee: R${Number(inspectionFee).toFixed(2)}\n\nTotal payable: R${Number(total).toFixed(2)}`;
    if (!window.confirm(confirmMsg)) return;

    setAwarding(true);
    
    // 1. Update the Bids
    await supabase.from("bids").update({ status: "accepted" }).eq("id", bid.id);
    await supabase.from("bids").update({ status: "rejected" }).eq("project_id", project.id).neq("id", bid.id);

    // 2. Update the Project Table (Safely)
    const { error: projErr } = await supabase.from("projects").update({
      status: "awarded", 
      awarded_contractor_id: bid.contractor_id, 
      awarded_at: new Date().toISOString(), 
      bid_amount: base, 
      payment_status: "unpaid", 
      user_id: user.id,
      metadata: { ...(project.metadata || {}), accepted_bid_id: bid.id, commission_rate: commissionRateForBid(base), total_amount: total },
    }).eq("id", project.id);

    if (projErr) {
      alert("Error updating event project: " + projErr.message);
      setAwarding(false);
      return; 
    }

    // 3. Create the actual Invoice Table row
    const { error: invErr } = await supabase.from("invoices").insert([{ 
      project_id: project.id, 
      customer_id: user.id, 
      contractor_id: bid.contractor_id, 
      base_amount: base, 
      commission_amount: commissionAmount, 
      inspection_fee: inspectionFee, 
      total_amount: total, 
      amount: total, 
      status: "pending_payment" 
    }]);

    if (invErr) {
      console.warn("Minor issue generating invoice (RPC will recreate it anyway):", invErr.message);
    }

    await loadAll();
    setAwarding(false);
    
    // 4. Safely navigate to TradeSafe
    localStorage.setItem("pb_last_dashboard", "/customer/events");
    localStorage.setItem("pb_last_project_id", project.id);
    navigate(`/checkout/tradesafe/${project.id}`);
  }

  function fmtMoney(n) { return `R${Number(n || 0).toFixed(2)}`; }

  async function downloadInvoiceForPaid(p) {
     const inv = p?.latestInvoice;
     if (!inv?.id) { alert("No invoice found for this event yet."); return; }
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
     doc.text(`Event: ${p?.project_name || "Event Project"}`, 14, 86); doc.text(`Location: ${p?.location || "-"}`, 14, 92); doc.text(`Category: Events`, 14, 98);
 
     const base = Number(inv?.base_amount || 0); const commission = Number(inv?.commission_amount || 0); const inspection = Number(inv?.inspection_fee || 0);
     let total = Number(inv?.total_amount ?? inv?.amount ?? 0); if (!total || total <= 0) total = base + commission + inspection;
 
     const startY = 112; doc.setFillColor(245, 245, 245); doc.setDrawColor(220); doc.rect(14, startY, 182, 10, "FD");
     doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); doc.text("Description", 18, startY + 7); doc.text("Amount", 190, startY + 7, { align: "right" });
     let y = startY + 18; doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
 
     const rows = [ { label: "Vendor Amount", amount: base }, { label: "Platform Commission", amount: commission }, { label: "Inspection Fee", amount: inspection }, ].filter((r) => Number(r.amount) !== 0);
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
      <div style={{ textAlign: "center", paddingTop: 100, color: "#94a3b8" }}>
        Loading Dashboard...
      </div>
    );
  }

  return (
    <DashboardLayout title="Event Portal">
      <div style={styles.pageContainer}>
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
          <div>
            <div style={styles.aiHero}>
              <div style={{ position: "absolute", top: 16, right: 16, padding: "6px 12px", borderRadius: 50, background: "rgba(197, 160, 89, 0.1)", border: "1px solid #c5a059", color: "#c5a059", fontWeight: 800, fontSize: 11 }}>✨ SMART PORTAL</div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", color: "#fff", margin: 0 }}>AI Event Concierge</h1>
              <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px", maxWidth: "600px" }}>
                Describe your event, upload inspiration photos, and we’ll show an expected cost range <b>before</b> you post.
              </p>
            </div>

            <Panel title="✨ Event Pro Assistant">
              <EventProjectChatBot
                user={user}
                categoryDefs={SERVICE_DEFS}
                currentForm={aiDraft} 
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
                      event_date: draftUpdate?.event_date ?? prev.event_date,
                      guest_count: draftUpdate?.guest_count ?? prev.guest_count,
                      event_type: draftUpdate?.event_type ?? prev.event_type,
                      description: safeDescription, 
                      categories: draftUpdate?.categories ?? prev.categories,
                    };

                    if (draftUpdate?.service_focus && typeof draftUpdate.service_focus === "string") {
                      const mappedCats = { ...nextDraft.categories };
                      const keywords = draftUpdate.service_focus.split(/[,\/&]+/).map(k => k.trim().toLowerCase());
                      
                      SERVICE_DEFS.forEach(def => {
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
                onAutoPost={() => submitProject("ai")}
              />

              {aiDraft.project_name && (
                <div style={{ marginTop: 16, padding: 16, background: '#0b0d17', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                   <h3 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#c5a059', textTransform: 'uppercase' }}>Captured Details</h3>
                   <div style={styles.formGrid2}>
                      <div><strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Event Name</strong><div style={{color: "#fff", marginTop: 4}}>{aiDraft.project_name || '-'}</div></div>
                      <div><strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Location</strong><div style={{color: "#fff", marginTop: 4}}>{aiDraft.location || '-'}</div></div>
                      <div><strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Date</strong><div style={{color: "#fff", marginTop: 4}}>{aiDraft.event_date || '-'}</div></div>
                      <div><strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Guests</strong><div style={{color: "#fff", marginTop: 4}}>{aiDraft.guest_count || '-'}</div></div>
                      <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Services Required</strong><div style={{color: "#c5a059", marginTop: 4, fontWeight: 700}}>{Object.keys(aiDraft.categories || {}).length > 0 ? Object.keys(aiDraft.categories).join(', ') : 'None selected yet'}</div></div>
                      {aiDraft.description && (
                        <div style={{ gridColumn: '1 / -1', marginTop: 6 }}>
                          <strong style={{ color: '#94a3b8', fontSize: '11px', textTransform: "uppercase" }}>Event Scope / Vibe</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 4, color: "#fff", background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                            {aiDraft.description}
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <EstimatedRangeCard estimate={estimate} confirmed={pricingConfirmed} onConfirmYes={() => setPricingConfirmed(true)} onChangeDetails={() => { setPricingConfirmed(false); alert("No problem — tell Event Pro what changed."); }} />
              </div>

              <button
                style={{ ...styles.submitBtn, marginTop: 16, opacity: loading || !pricingConfirmed ? 0.7 : 1 }}
                onClick={() => submitProject("ai")}
                disabled={loading || !pricingConfirmed}
                title={!pricingConfirmed ? "Confirm expected cost range first" : ""}
              >
                {loading ? "Creating..." : "Create Event via AI"}
              </button>
            </Panel>
          </div>
        )}

        {/* --- TAB: MANUAL SETUP --- */}
        {activeTab === "manual" && (
          <div>
            <Panel title="Standard Event Setup (Manual)">
              <div style={styles.formGrid2}>
                <Input label="Event Name" value={form.project_name} onChange={(v) => setForm({ ...form, project_name: v })} placeholder="e.g. Sarah's 30th Birthday" />
                <Input label="Location / Venue" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Camps Bay, Cape Town" />
                <Input label="Event Date" type="date" value={form.event_date} onChange={(v) => setForm({ ...form, event_date: v })} />
                <Input label="Number of Guests" type="number" value={form.guest_count} onChange={(v) => setForm({ ...form, guest_count: v })} placeholder="e.g. 150" />
              </div>
              
              <Input label="Event Description & Vibe" type="textarea" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Describe the vibe, requirements, and anything vendors need to know." />

              <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.3)", background: "rgba(197, 160, 89, 0.05)", color: "#c5a059", fontSize: 13, margin: "14px 0" }}>
                <strong>Update:</strong> The R50 listing/admin fee has been <b>temporarily disabled</b>. Your event will go live immediately.
              </div>

              <h3 style={{ margin: "24px 0 12px", color: "#c5a059", fontSize: "14px", textTransform: "uppercase" }}>Services Required</h3>
              <div style={styles.pillGrid}>
                {SERVICE_DEFS.map((c) => (
                  <button key={c.key} onClick={() => toggleCategory(c.key)} style={form.categories?.[c.key] ? styles.activePill : styles.pill}>{c.key}</button>
                ))}
              </div>

              {Object.keys(form.categories || {}).map((cat) => {
                const def = SERVICE_DEFS.find((c) => c.key === cat);
                if (!def) return null;
                return (
                  <div key={cat} style={{ marginTop: 20, padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <h4 style={{ color: "#c5a059", marginBottom: 15, marginTop: 0 }}>{cat} Specifications</h4>
                    <div style={styles.formGrid2}>
                      {def.fields.map((f) => (
                        <Input key={f.name} label={f.label} type={f.type} options={f.options} placeholder={f.placeholder || ""} hint={f.hint || ""} value={form.categories?.[cat]?.[f.name]} onChange={(v) => { setForm((prev) => ({ ...prev, categories: { ...(prev.categories || {}), [cat]: { ...(prev.categories?.[cat] || {}), [f.name]: v } } })); }} />
                      ))}
                    </div>
                  </div>
                );
              })}

              <button style={{ ...styles.submitBtn, marginTop: 20, opacity: loading ? 0.7 : 1 }} onClick={() => submitProject("manual")} disabled={loading}>
                {loading ? "Creating..." : "Create Event Manually"}
              </button>
            </Panel>
          </div>
        )}

        {/* --- OTHER TABS (ACTIVE, PROGRESS, PAYMENTS) --- */}
        {activeTab === "active" && (
          <Panel title="Your Open Events (Pick a bid)">
            {draftProjects.length === 0 && activeProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No open events.</p>}
            
            {draftProjects.map((p) => (
              <div key={p.id} style={{ ...styles.card, border: "1px dashed rgba(197, 160, 89, 0.5)" }}>
                <strong style={{ color: "#fff" }}>{p.project_name}</strong><p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13 }}>Draft event (legacy)</p>
                <button style={{ ...styles.pill, marginTop: 12 }} onClick={() => publishDraft(p.id)} disabled={loading}>Publish Event</button>
              </div>
            ))}
            
            {activeProjects.map((p) => {
              const isExpanded = !!expandedProjects[p.id];
              const estLow = Number(p?.metadata?.expected_cost_low || 0);
              const estHigh = Number(p?.metadata?.expected_cost_high || 0);

              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ color: "#fff", fontSize: 16 }}>{p.project_name}</strong>
                      <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>{p.location || "No location"}</div>
                      
                      {(estLow > 0 || estHigh > 0) && (
                        <div style={{ color: "#c5a059", marginTop: 6, fontSize: 13, fontWeight: 700 }}>
                          🤖 Est: {fmtMoneyZar(estLow)} – {fmtMoneyZar(estHigh)}
                        </div>
                      )}
                      
                      <button 
                        style={{ ...styles.pill, padding: "6px 12px", marginTop: 10 }} 
                        onClick={() => toggleProjectDetails(p.id)}
                      >
                        {isExpanded ? "Hide details ↑" : "More details ↓"}
                      </button>
                    </div>
                    <div style={{ background: "rgba(197,160,89,0.1)", color: "#c5a059", padding: "6px 14px", borderRadius: "50px", fontSize: "12px", fontWeight: 800 }}>
                      {(p.bids || []).length} BIDS
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <strong style={{ color: '#fff' }}>Services Requested:</strong><br/>
                          <span style={{ color: "#c5a059" }}>{p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 ? Object.keys(p.metadata.categories).join(", ") : "-"}</span>
                        </div>
                        <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                          <strong style={{ color: '#fff' }}>Event Scope / Notes:</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                            {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "16px 0" }} />

                  {(p.bids || []).length === 0 ? (
                    <p style={{ color: "#94a3b8", marginTop: 0, fontSize: 13 }}>No bids yet. Vendors will appear here once they bid.</p>
                  ) : (
                    <div>
                      {(p.bids || []).map((b) => (
                        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "12px", marginBottom: "10px" }}>
                          <div>
                            <div style={{ color: "#fff", fontWeight: 800, fontSize: "16px" }}>R{Number(b.price).toFixed(2)}</div>
                            <div style={{ color: "#64748b", fontSize: "11px" }}>VENDOR: {b.contractor_id.slice(0, 8)}</div>
                          </div>
                          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                            {isProjectPaid(p) ? <span style={{ padding: "6px 12px", borderRadius: 50, background: "rgba(22, 101, 52, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>PAID</span> : safeLower(b.status) === "pending" ? <button style={{ ...styles.pill, background: "#c5a059", color: "#000", border: "none" }} onClick={() => acceptBid(p, b)} disabled={awarding}>{awarding ? "Processing..." : "Accept & Pay"}</button> : <span style={{ padding: "6px 12px", borderRadius: 50, background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontWeight: 800, fontSize: 12 }}>{b.status}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Panel>
        )}

        {activeTab === "progress" && (
          <Panel title="Events In Progress">
            {progressProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No events currently in progress.</p>}
            {progressProjects.map((p) => {
              const payAllowed = canPayEscrow(p);
              const looksAwardedButMissing = !isProjectPaid(p) && ["awarded", "bid_accepted", "in_progress"].includes(safeLower(p.status)) && !payAllowed;
              
              const isExpanded = !!expandedProjects[p.id];
              
              return (
                <div key={p.id} style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong style={{ color: "#fff", fontSize: 16 }}>{p.project_name}</strong>
                      <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Status: <span style={{ color: "#c5a059", textTransform: "uppercase" }}>{p.status}</span></div>
                      <div style={{ color: "#94a3b8", marginTop: 6, fontSize: 13 }}>Payment: {p.payment_status || "unpaid"}</div>
                      <div style={{ color: "#c5a059", marginTop: 6, fontSize: 13, fontWeight: 700 }}>Bid: R{Number(p.bid_amount || 0).toFixed(2)} • Total: R{Number(p?.metadata?.total_amount || 0).toFixed(2)}</div>
                      
                      <button 
                        style={{ ...styles.pill, padding: "6px 12px", marginTop: 10 }} 
                        onClick={() => toggleProjectDetails(p.id)}
                      >
                        {isExpanded ? "Hide details ↑" : "More details ↓"}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)", fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <strong style={{ color: '#fff' }}>Services Requested:</strong><br/>
                          <span style={{ color: "#c5a059" }}>{p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 ? Object.keys(p.metadata.categories).join(", ") : "-"}</span>
                        </div>
                        <div style={{ gridColumn: "1 / -1", marginTop: 6 }}>
                          <strong style={{ color: '#fff' }}>Event Scope / Notes:</strong><br/>
                          <div style={{ whiteSpace: "pre-wrap", marginTop: 4 }}>
                            {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isProjectPaid(p) && <div style={{ marginTop: 12, padding: "8px 14px", borderRadius: 50, background: "rgba(22, 101, 52, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 13, display: "inline-block" }}>Paid ✅ (Moved to Payments tab)</div>}
                  
                  {payAllowed && (
                    <button style={{ ...styles.submitBtn, marginTop: 16 }} onClick={() => { localStorage.setItem("pb_last_dashboard", "/customer/events"); localStorage.setItem("pb_last_project_id", p.id); navigate(`/checkout/tradesafe/${p.id}`); }}>
                      Pay via TradeSafe (Escrow)
                    </button>
                  )}
                  
                  {looksAwardedButMissing && <div style={{ padding: 14, borderRadius: 12, border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)", color: "#f87171", fontSize: 13, marginTop: 14 }}>Payment is unavailable because no accepted bid amount was found yet. Please accept a bid first.</div>}
                </div>
              );
            })}
          </Panel>
        )}

        {activeTab === "payments" && (
          <Panel title="Payments (Paid Events)">
            {paidProjects.length === 0 && <p style={{ color: "#94a3b8" }}>No paid events yet.</p>}
            {paidProjects.map((p) => (
              <div key={p.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#fff", fontSize: 16 }}>{p.project_name}</strong>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>{p.location || "No location"}</div>
                    <div style={{ color: "#c5a059", fontSize: 13, marginTop: 4, fontWeight: 700 }}>Total: R{Number(p?.latestInvoice?.total_amount ?? p?.latestInvoice?.amount ?? p?.metadata?.total_amount ?? 0).toFixed(2)}</div>
                  </div>
                  <span style={{ padding: "6px 12px", borderRadius: 50, background: "rgba(22, 101, 52, 0.2)", color: "#4ade80", fontWeight: 800, fontSize: 12 }}>PAID</span>
                </div>
                <button style={{ ...styles.pill, width: "100%", marginTop: 16 }} onClick={() => setSelectedPaid(p)}>View Details</button>
              </div>
            ))}
            {selectedPaid && (
              <div style={styles.modalBackdrop} onClick={() => setSelectedPaid(null)}>
                <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", marginTop: 0 }}>{selectedPaid.project_name}</h2>
                  <div style={{ color: "#94a3b8", fontSize: 14 }}>Location: {selectedPaid.location || "-"}</div>
                  <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>Status: <span style={{ color: "#c5a059", textTransform: "uppercase" }}>{selectedPaid.status}</span></div>
                  <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>Payment Status: <span style={{ color: "#c5a059", textTransform: "uppercase" }}>{selectedPaid.payment_status}</span></div>
                  
                  <div style={{ marginTop: 20, padding: 16, borderRadius: 12, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ color: "#fff", fontWeight: 800, marginBottom: 10 }}>Invoice Details</div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>ID: {selectedPaid.latestInvoice?.id || "—"}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6 }}>Paid at: {selectedPaid.latestInvoice?.paid_at ? new Date(selectedPaid.latestInvoice.paid_at).toLocaleString() : "—"}</div>
                  </div>

                  <div style={{ display: "grid", gap: 10, marginTop: 24 }}>
                    <button style={styles.submitBtn} onClick={() => downloadInvoiceForPaid(selectedPaid)}>Download Invoice (PDF)</button>
                    <button style={{ ...styles.pill, border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }} onClick={() => setSelectedPaid(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </Panel>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ---------------- EVENT PRO CHAT COMPONENT ---------------- */

function EventProjectChatBot({ user, currentForm, categoryDefs, onApplyDraft, onEstimate, onPriceAgreed, onAutoPost }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I'm Event Pro 😊 Your Cape Town event specialist. Tell me about the event you're planning — birthday, wedding, corporate, whatever it is. Give me as much as you can (date, location, how many people, vibe, what you need help with) and I'll ask smart follow-ups so contractors can quote you accurately.",
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
      
      const res = await fetch("/api/tts", {
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
          mode: "events",
          messages: nextMessages,
          current_form: currentForm,
          uploads,
          category_defs: categoryDefs || [],
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
          { role: "assistant", content: "✅ Your event project has been prepared! Please review the details below and click the 'Create Event' button to make it live." }
        ]);
        speak("Your event has been prepared! Please review the captured details below and click the post button to make it live.");
      }
      
    } catch (err) {
      console.error(err);
      alert("Couldn't reach Event Pro — is the backend still running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={styles.chatCard}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", alignItems: "center" }}>
          <div>
            <div style={{ color: "#c5a059", fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>✨ Event Pro – Smart Event Builder</div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Chat naturally — upload inspo photos — get accurate Rand estimate for contractors</div>
          </div>
          <button onClick={() => setSpeakReplies(!speakReplies)} style={{ background: "none", border: "none", color: "#c5a059", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
            {speakReplies ? <Volume2 size={16} /> : <VolumeX size={16} />} Voice {speakReplies ? "On" : "Off"}
          </button>
        </div>

        <div style={styles.chatLog} ref={chatLogRef}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 15, textAlign: m.role === "user" ? "right" : "left" }}>
              <div style={{ color: m.role === "user" ? "#fff" : "#c5a059", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 4 }}>
                {m.role === "user" ? "You" : "Event Pro"}
              </div>
              <div style={{ display: "inline-block", padding: "12px 16px", borderRadius: "15px", background: m.role === "user" ? "#1e2235" : "rgba(197, 160, 89, 0.05)", color: "#fff", fontSize: "14px", lineHeight: "1.5", maxWidth: "85%", textAlign: "left", border: m.role === "user" ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(197, 160, 89, 0.2)" }}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0b0d17", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>Upload inspo photos</div>
            <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Venue vibes, decor ideas, color schemes</div>
          </div>
          <UploadButton folder={`event-pro/${user?.id || "anon"}`} label="Upload photo" onUpload={onUpload} />
        </div>

        {uploads.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
            {uploads.map((u, i) => (
              <a key={i} href={u.file_url} target="_blank" rel="noreferrer" style={{ flexShrink: 0 }}>
                <img src={u.file_url} alt="upload" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(197,160,89,0.3)" }} />
              </a>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Planning a 30th birthday in Camps Bay..."
            style={{ flex: 1, minWidth: 200, padding: 14, borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.4)", background: "#0b0d17", outline: "none", fontSize: 14, color: "#ffffff" }}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
          />

          {!listening ? (
            <button type="button" onClick={startListening} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.3)", background: "#1e2235", color: "#c5a059", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              <Mic size={16} /> Talk
            </button>
          ) : (
            <button type="button" onClick={stopListening} style={{ padding: "14px 20px", borderRadius: 12, border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.1)", color: "#f87171", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}>
              <MicOff size={16} /> Stop
            </button>
          )}

          <button
            type="button"
            onClick={send}
            disabled={busy || !input.trim()}
            style={{ padding: "14px 24px", borderRadius: 12, border: "none", background: "#c5a059", color: "#000", cursor: "pointer", fontWeight: 800, opacity: busy || !input.trim() ? 0.6 : 1 }}
          >
            {busy ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}