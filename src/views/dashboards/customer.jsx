import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function CustomerDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("create");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [draftProjects, setDraftProjects] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [progressProjects, setProgressProjects] = useState([]);
  const [payments, setPayments] = useState([]);

  const CATEGORY_DEFS = [
    { key: "Plumbing", fields: [{ name: "scope", label: "Describe plumbing work" }, { name: "fixtures", label: "Number of fixtures", type: "number" }, { name: "materials", label: "Customer supplies materials?", type: "boolean" }] },
    { key: "Electrical", fields: [{ name: "scope", label: "Describe electrical work" }, { name: "points", label: "Number of points", type: "number" }, { name: "coc", label: "COC required?", type: "boolean" }] },
    { key: "Painting", fields: [{ name: "rooms", label: "Rooms / areas" }, { name: "coats", label: "Number of coats", type: "number" }, { name: "exterior", label: "Includes exterior?", type: "boolean" }] },
    { key: "Roofing", fields: [{ name: "material", label: "Material (Tile / Metal)" }, { name: "repair_type", label: "Repair or Replacement?" }, { name: "area", label: "Approx area (m²)", type: "number" }] },
    { key: "Flooring", fields: [{ name: "type", label: "Type (Tiling / Vinyl / Wood)" }, { name: "area", label: "Area size (m²)", type: "number" }, { name: "subfloor", label: "Subfloor prep required?", type: "boolean" }] },
    { key: "Structural / Brickwork", fields: [{ name: "work_type", label: "New build or extension?" }, { name: "plans", label: "Plans approved?", type: "boolean" }] },
    { key: "HVAC", fields: [{ name: "units", label: "Number of units", type: "number" }, { name: "service", label: "Install or service?" }] },
    { key: "Carpentry", fields: [{ name: "item", label: "What needs to be built?" }, { name: "custom", label: "Custom / bespoke?", type: "boolean" }] },
  ];

  const [form, setForm] = useState({ project_name: "", location: "", budget: "", categories: {} });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setUser(currentUser);

    const { data: drafts } = await supabase.from("projects").select("*").eq("user_id", currentUser.id).eq("status", "draft");
    const { data: active } = await supabase.from("projects").select("*").eq("user_id", currentUser.id).eq("status", "open");
    const { data: progress } = await supabase.from("projects").select("*").eq("user_id", currentUser.id).in("status", ["awarded", "in_progress"]);
    const { data: pay } = await supabase.from("payments").select("*").eq("user_id", currentUser.id);

    setDraftProjects(drafts || []);
    setActiveProjects(active || []);
    setProgressProjects(progress || []);
    setPayments(pay || []);
    setLoading(false);
  }

  function toggleCategory(key) {
    setForm(prev => {
      const categories = { ...prev.categories };
      if (categories[key]) delete categories[key];
      else {
        const def = CATEGORY_DEFS.find(c => c.key === key);
        const blank = {};
        def.fields.forEach(f => { blank[f.name] = f.type === "boolean" ? false : ""; });
        categories[key] = blank;
      }
      return { ...prev, categories };
    });
  }

  async function submitProject() {
    if (!form.project_name || Object.keys(form.categories).length === 0) {
      alert("Please enter a project name and select services.");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.from("projects").insert([{
      user_id: user.id,
      project_name: form.project_name,
      location: form.location,
      budget: form.budget,
      category: "Construction",
      // Listing fee temporarily disabled: go live immediately
      status: "open",
      paid: false,
      posting_fee_paid: false,
      metadata: { categories: form.categories, created_by: "customer", listing_fee_disabled: true }
    }]).select().single();

    if (!error) {
      setForm({ project_name: "", location: "", budget: "", categories: {} });
      setActiveTab("active");
      loadAll();
    }
    setLoading(false);
  }

  if (loading && !user) return <div style={loadingView}>Loading your dashboard...</div>;

  return (
    <div style={page}>
      <h1 style={title}>Construction Dashboard</h1>
      <div style={tabs}>
        {["create", "active", "progress", "payments"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={activeTab === tab ? activeTabBtn : tabBtn}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {activeTab === "create" && (
        <Panel title="New Project">
          <Input label="Project Name" value={form.project_name} onChange={v => setForm({ ...form, project_name: v })} />
          <Input label="Location" value={form.location} onChange={v => setForm({ ...form, location: v })} />
          <Input label="Budget (ZAR)" value={form.budget} onChange={v => setForm({ ...form, budget: v })} />

          <div style={noticeBox}><strong>Update:</strong> The R50 listing/admin fee is temporarily disabled.</div>

          <div style={pillGrid}>
            {CATEGORY_DEFS.map(c => (
              <button key={c.key} onClick={() => toggleCategory(c.key)} style={form.categories[c.key] ? activePill : pill}>{c.key}</button>
            ))}
          </div>

          <button style={submitBtn} onClick={submitProject} disabled={loading}>{loading ? "Creating..." : "Create Project"}</button>
        </Panel>
      )}

      {activeTab === "active" && (
        <Panel title="My Projects">
          {draftProjects.map(p => (
            <div key={p.id} style={card}>
              <strong>{p.project_name}</strong> - <span>Draft (legacy)</span>
            </div>
          ))}
          {activeProjects.map(p => <div key={p.id} style={card}><strong>{p.project_name}</strong> (Open)</div>)}
        </Panel>
      )}
    </div>
  );
}

/* =========================
   UI HELPERS & STYLES
========================= */
const Input = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 15 }}>
    <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>{label}</label>
    <input style={inputStyle} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);
const Panel = ({ title, children }) => <div style={panelStyle}><h3>{title}</h3>{children}</div>;

const page = { maxWidth: 900, margin: "40px auto", padding: "0 20px", fontFamily: 'sans-serif' };
const title = { fontSize: '28px', fontWeight: '800', marginBottom: '20px' };
const tabs = { display: "flex", gap: 10, marginBottom: 30 };
const tabBtn = { padding: "10px 20px", borderRadius: 99, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const activeTabBtn = { ...tabBtn, background: "linear-gradient(135deg,#ffe08a,#f5c451)", fontWeight: "bold", border: 'none' };
const panelStyle = { background: "#fff", padding: 30, borderRadius: 20, boxShadow: "0 10px 25px rgba(0,0,0,0.05)" };
const inputStyle = { width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd" };
const pillGrid = { display: "flex", gap: 8, flexWrap: "wrap", margin: '20px 0' };
const pill = { padding: "8px 15px", borderRadius: 99, border: "1px solid #ddd", background: "#fff", cursor: 'pointer' };
const activePill = { ...pill, background: "#6366f1", color: "#fff", border: 'none' };
const submitBtn = { width: "100%", padding: 15, background: "linear-gradient(135deg,#ffe08a,#f5c451)", border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' };
const card = { background: "#f8fafc", padding: 15, borderRadius: 12, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const noticeBox = { background: '#fffbeb', padding: 15, borderRadius: 10, border: '1px solid #f5c451', marginBottom: 20 };
const loadingView = { textAlign: 'center', marginTop: 100, fontSize: '20px', color: '#64748b' };
