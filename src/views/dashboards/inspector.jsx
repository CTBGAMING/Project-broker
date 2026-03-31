import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function InspectorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State for Active Inspection
  const [activeId, setActiveId] = useState(null);
  const [notes, setNotes] = useState("");
  const [snagInput, setSnagInput] = useState("");
  const [snagList, setSnagList] = useState([]);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth/login");

    const { data } = await supabase
      .from("inspections")
      .select(`*, projects(project_name, location)`)
      .eq("inspector_id", user.id)
      .order("created_at", { ascending: false });

    setInspections(data || []);
    setLoading(false);
  }

  async function submitResult(status) {
    if (!activeId) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("inspections")
      .update({
        status,
        notes,
        snag_list: snagList,
        completed_at: new Date().toISOString()
      })
      .eq("id", activeId);

    if (!error) {
      setActiveId(null);
      setSnagList([]);
      setNotes("");
      loadInspections();
    }
    setSubmitting(false);
  }

  const addSnag = () => {
    if (snagInput.trim()) {
      setSnagList([...snagList, snagInput.trim()]);
      setSnagInput("");
    }
  };

  if (loading) return <div style={loadingArea}>Loading Inspections...</div>;

  return (
    <div style={layoutContainer}>
      <aside style={sidebar}>
        <div style={logoArea}>
          <div style={logoIcon}>PB</div>
          <span style={logoText}>Inspector</span>
        </div>
        <nav style={navStack}>
          <Link to="/dashboard/inspector" style={location.pathname === "/dashboard/inspector" ? activeNavLink : navLink}>Pending Audits</Link>
          <Link to="/dashboard/inspector/history" style={location.pathname.includes("/history") ? activeNavLink : navLink}>History</Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} style={logoutBtn}>Sign Out</button>
      </aside>

      <main style={mainArea}>
        <header style={header}>
          <h1 style={title}>Quality Assurance</h1>
          <p style={subtitle}>Verify milestone completion and log site snags.</p>
        </header>

        {activeId && (
          <div style={formCard}>
            <h3 style={sectionTitle}>Current Inspection Workspace</h3>
            <textarea 
              style={textarea} 
              placeholder="Internal inspector notes..." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
            
            <div style={{ display: "flex", gap: 10, marginBottom: 15, alignItems: "center" }}>
              <input 
                style={input} 
                placeholder="Log a new snag item..." 
                value={snagInput} 
                onChange={e => setSnagInput(e.target.value)} 
                onKeyDown={e => e.key === "Enter" && addSnag()}
              />
              <button style={secBtn} onClick={addSnag}>Add Snag</button>
            </div>
            
            {snagList.length > 0 && (
              <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "20px" }}>
                <div style={{ color: "#c5a059", fontSize: 11, fontWeight: 800, textTransform: "uppercase", marginBottom: 10 }}>Logged Snags</div>
                {snagList.map((s, i) => (
                  <div key={i} style={snagItem}><span style={{ color: "#c5a059" }}>•</span> {s}</div>
                ))}
              </div>
            )}
            
            <div style={{ display: "flex", gap: 16, marginTop: 24 }}>
              <button style={{ ...btn, background: "linear-gradient(135deg, #166534 0%, #22c55e 100%)", color: "#fff", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)" }} onClick={() => submitResult("passed")} disabled={submitting}>
                {submitting ? "Processing..." : "Pass Inspection"}
              </button>
              <button style={{ ...btn, background: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)", color: "#fff", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)" }} onClick={() => submitResult("failed")} disabled={submitting}>
                {submitting ? "Processing..." : "Fail & Submit Snags"}
              </button>
            </div>
            
            <button style={cancelBtn} onClick={() => setActiveId(null)}>Cancel Audit</button>
          </div>
        )}

        <div style={listStack}>
          {inspections.length === 0 && !loading && (
            <div style={{ color: "#94a3b8", padding: "20px 0" }}>No inspections currently assigned to you.</div>
          )}
          
          {inspections.map(i => (
            <div key={i.id} style={card}>
              <div style={infoSide}>
                <span style={cardMainText}>{i.projects?.project_name || "Untitled Project"}</span>
                <span style={cardSubText}>{i.projects?.location || "No location provided"} • Audit ID: {i.id.slice(0,8)}</span>
              </div>
              {i.status === "pending" ? (
                <button style={secBtn} onClick={() => setActiveId(i.id)}>Start Audit</button>
              ) : (
                <div style={statusBadge(i.status)}>{i.status}</div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// PREMIUM DARK LUXURY STYLES
const layoutContainer = { display: "flex", minHeight: "100vh", background: "#0b0d17", fontFamily: "'Inter', sans-serif" };
const sidebar = { width: "260px", background: "#12141c", borderRight: "1px solid rgba(255,255,255,0.05)", color: "#fff", padding: "30px 20px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 10 };
const logoArea = { display: "flex", alignItems: "center", gap: 12, marginBottom: 40, paddingLeft: 10 };
const logoIcon = { width: 40, height: 40, background: "rgba(197, 160, 89, 0.15)", border: "1px solid rgba(197, 160, 89, 0.5)", color: "#c5a059", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontFamily: "'Playfair Display', serif", fontSize: 18 };
const logoText = { fontWeight: 900, fontSize: 22, letterSpacing: "-0.5px", color: "#fff", fontFamily: "'Playfair Display', serif" };
const navStack = { display: "flex", flexDirection: "column", gap: 8, flex: 1 };
const navLink = { padding: "12px 16px", borderRadius: "10px", color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: 600, transition: "0.2s" };
const activeNavLink = { ...navLink, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", border: "1px solid rgba(197, 160, 89, 0.3)", fontWeight: 800 };
const mainArea = { flex: 1, marginLeft: "260px", padding: "40px", maxWidth: 1000 };
const header = { marginBottom: 30 };
const title = { fontSize: 32, fontWeight: 800, margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif" };
const subtitle = { color: "#94a3b8", fontSize: 14, marginTop: 8 };
const formCard = { background: "#12141c", padding: "28px", borderRadius: "20px", border: "1px solid rgba(197, 160, 89, 0.3)", marginBottom: 30, boxShadow: "0 10px 40px rgba(0,0,0,0.5)" };
const sectionTitle = { fontSize: 13, fontWeight: 800, color: "#c5a059", textTransform: "uppercase", marginBottom: 20, letterSpacing: "1px", marginTop: 0 };
const input = { flex: 1, padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0b0d17", color: "#fff", outline: "none", fontSize: 14 };
const textarea = { width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "#0b0d17", color: "#fff", marginBottom: 20, height: 100, outline: "none", resize: "vertical", fontSize: 14, fontFamily: "'Inter', sans-serif" };
const btn = { flex: 1, border: "none", padding: "16px", borderRadius: "50px", fontWeight: 800, cursor: "pointer", textTransform: "uppercase", fontSize: 13, letterSpacing: "1px", transition: "transform 0.2s" };
const secBtn = { padding: "12px 24px", borderRadius: "50px", border: "1px solid rgba(197, 160, 89, 0.4)", background: "transparent", color: "#c5a059", fontWeight: 800, cursor: "pointer", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" };
const cancelBtn = { background: "none", border: "none", color: "#94a3b8", cursor: "pointer", marginTop: 20, width: "100%", textAlign: "center", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" };
const listStack = { display: "flex", flexDirection: "column", gap: 16 };
const card = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", background: "#12141c", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap", gap: 16 };
const infoSide = { display: "flex", flexDirection: "column", gap: 6 };
const cardMainText = { fontSize: 20, fontWeight: 800, color: "#fff", fontFamily: "'Playfair Display', serif" };
const cardSubText = { fontSize: 13, color: "#94a3b8" };
const snagItem = { fontSize: 14, padding: "6px 0", color: "#cbd5e1", display: "flex", alignItems: "center", gap: 8 };
const statusBadge = (s) => ({ padding: "6px 16px", borderRadius: "50px", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", border: "1px solid", background: s === "passed" ? "rgba(22, 101, 52, 0.15)" : s === "failed" ? "rgba(127, 29, 29, 0.15)" : "rgba(255,255,255,0.05)", color: s === "passed" ? "#4ade80" : s === "failed" ? "#f87171" : "#94a3b8", borderColor: s === "passed" ? "rgba(74, 222, 128, 0.3)" : s === "failed" ? "rgba(248, 113, 113, 0.3)" : "rgba(255,255,255,0.1)" });
const loadingArea = { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0b0d17", color: "#c5a059", fontSize: 24, fontWeight: 900, fontFamily: "'Playfair Display', serif" };
const logoutBtn = { marginTop: "auto", padding: "14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "12px", cursor: "pointer", fontWeight: 700, transition: "0.2s" };