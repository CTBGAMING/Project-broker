import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function ScoperDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [assignments, setAssignments] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [findings, setFindings] = useState("");
  const [materials, setMaterials] = useState("");
  const [labour, setLabour] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");

  useEffect(() => {
    loadAssignments();
  }, []);

  async function loadAssignments() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth/login");

    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("scoper_id", user.id)
      .order("created_at", { ascending: false });

    setAssignments(data || []);
    setLoading(false);
  }

  async function submitReport() {
    if (!selectedProject) return;
    
    const { error } = await supabase.from("scoper_reports").insert([{
      project_id: selectedProject.id,
      findings,
      materials_estimate: materials,
      labour_estimate: labour,
      difficulty
    }]);

    if (!error) {
      await supabase.from("projects").update({ status: "scoped" }).eq("id", selectedProject.id);
      setSelectedProject(null);
      loadAssignments();
      alert("Scope submitted successfully");
    }
  }

  if (loading) return <div style={loadingArea}>Fetching Assignments...</div>;

  return (
    <div style={layoutContainer}>
      <aside style={sidebar}>
        <div style={logoArea}><div style={logoIcon}>S</div><span style={logoText}>Scoper</span></div>
        <nav style={navStack}>
          <Link to="/dashboard/scoper" style={activeNavLink}>My Site Visits</Link>
          <Link to="/dashboard/scoper/drafts" style={navLink}>Draft Scopes</Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} style={logoutBtn}>Sign Out</button>
      </aside>

      <main style={mainArea}>
        <header style={header}>
          <h1 style={title}>Site Inspection & Scoping</h1>
          <p style={subtitle}>Analyze project requirements and define technical specifications.</p>
        </header>

        {selectedProject ? (
          <div style={formCard}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={sectionTitle}>Scoping: {selectedProject.project_name}</h3>
              <button style={cancelLink} onClick={() => setSelectedProject(null)}>Exit</button>
            </div>
            
            <label style={label}>Detailed Findings</label>
            <textarea style={textarea} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Describe site conditions..." />
            
            <label style={label}>Materials Required</label>
            <textarea style={textarea} value={materials} onChange={e => setMaterials(e.target.value)} placeholder="List major components..." />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
              <div>
                <label style={label}>Labour Estimate (Days)</label>
                <input style={input} value={labour} onChange={e => setLabour(e.target.value)} placeholder="e.g. 5 days" />
              </div>
              <div>
                <label style={label}>Difficulty</label>
                <select style={input} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>

            <button style={{ ...btn, marginTop: 25 }} onClick={submitReport}>Submit Inspection & Finalize Scope</button>
          </div>
        ) : (
          <div style={listStack}>
            {assignments.map(a => (
              <div key={a.id} style={card}>
                <div style={infoSide}>
                  <span style={cardMainText}>{a.project_name}</span>
                  <span style={cardSubText}>{a.location} • Status: {a.status}</span>
                </div>
                <button style={secBtn} onClick={() => setSelectedProject(a)}>Begin Scope</button>
              </div>
            ))}
            {assignments.length === 0 && <div style={emptyState}>No site visits currently assigned.</div>}
          </div>
        )}
      </main>
    </div>
  );
}

// STYLES (Synced with Corporate/Inspector)
const layoutContainer = { display: "flex", minHeight: "100vh", background: "#f8fafc" };
const sidebar = { width: "260px", background: "#0f172a", color: "#fff", padding: "30px 20px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh" };
const logoArea = { display: "flex", alignItems: "center", gap: 12, marginBottom: 40, paddingLeft: 10 };
const logoIcon = { width: 32, height: 32, background: "#f59e0b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 };
const logoText = { fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" };
const navStack = { display: "flex", flexDirection: "column", gap: 8, flex: 1 };
const navLink = { padding: "12px 16px", borderRadius: "10px", color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: 500 };
const activeNavLink = { ...navLink, background: "#1e293b", color: "#fff", fontWeight: 700 };
const mainArea = { flex: 1, marginLeft: "260px", padding: "40px" };
const header = { marginBottom: 30 };
const title = { fontSize: 28, fontWeight: 800, margin: 0 };
const subtitle = { color: "#64748b", fontSize: 14, marginTop: 4 };
const formCard = { background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" };
const sectionTitle = { fontSize: 12, fontWeight: 800, color: "#6366f1", textTransform: "uppercase" };
const label = { display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, marginTop: 15 };
const input = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" };
const textarea = { ...input, height: 80, resize: "none" };
const btn = { width: "100%", background: "#0f172a", color: "#fff", border: "none", padding: "15px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" };
const secBtn = { padding: "10px 18px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", fontWeight: 600, cursor: "pointer" };
const cancelLink = { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 };
const listStack = { display: "flex", flexDirection: "column", gap: 10 };
const card = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" };
const infoSide = { display: "flex", flexDirection: "column", gap: 2 };
const cardMainText = { fontSize: 15, fontWeight: 700, color: "#1e293b" };
const cardSubText = { fontSize: 13, color: "#64748b" };
const emptyState = { padding: 40, textAlign: "center", color: "#64748b" };
const loadingArea = { padding: 40 };
const logoutBtn = { marginTop: "auto", padding: "12px", background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: "10px", cursor: "pointer", fontWeight: 600 };