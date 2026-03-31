import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Link, useLocation } from "react-router-dom";

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [corporateId, setCorporateId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [corpUsers, setCorpUsers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [auditLog, setAuditLog] = useState([]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    initDashboard();
  }, []);

  async function initDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/auth/login");
    setUser(user);

    // Get Corporate Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("corporate_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.corporate_id) {
      alert("No corporate account linked.");
      return navigate("/");
    }

    setCorporateId(profile.corporate_id);
    await loadData(profile.corporate_id);
    setLoading(false);
  }

  async function loadData(id) {
    const [p, u, i, a] = await Promise.all([
      supabase.from("projects").select("*").eq("corporate_id", id).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("corporate_id", id),
      supabase.from("corporate_invites").select("*").eq("corporate_id", id).eq("status", "pending"),
      supabase.from("corporate_audit_log").select("*").eq("corporate_id", id).order("created_at", { ascending: false }).limit(20)
    ]);

    setProjects(p.data || []);
    setCorpUsers(u.data || []);
    setPendingInvites(i.data || []);
    setAuditLog(a.data || []);
  }

  async function logAction(action, entityType, entityId = null, metadata = {}) {
    await supabase.from("corporate_audit_log").insert([{
      corporate_id: corporateId,
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata
    }]);
  }

  async function sendInvite() {
    if (!inviteEmail) return;
    setActionLoading(true);
    const { error } = await supabase.from("corporate_invites").insert([{
      corporate_id: corporateId,
      email: inviteEmail.toLowerCase().trim(),
      role: inviteRole,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }]);

    if (!error) {
      await logAction("invite_sent", "user", null, { email: inviteEmail });
      setInviteEmail("");
      loadData(corporateId);
    }
    setActionLoading(false);
  }

  async function createBulkProjects() {
    const lines = bulkText.split("\n").filter(l => l.trim());
    if (lines.length === 0) return;

    setActionLoading(true);
    const newProjects = lines.map(line => {
      const [name, loc, cat] = line.split(",").map(s => s?.trim());
      return {
        project_name: name || "Untitled Project",
        location: loc || "TBD",
        category: cat || "Renovations",
        corporate_id: corporateId,
        user_id: user.id,
        status: "open"
      };
    });

    const { data, error } = await supabase.from("projects").insert(newProjects).select();
    if (!error) {
      await logAction("bulk_create", "projects", null, { count: lines.length });
      setBulkText("");
      loadData(corporateId);
    }
    setActionLoading(false);
  }

  if (loading) return <div style={loadingArea}>Verifying Corporate Credentials...</div>;

  return (
    <div style={layoutContainer}>
      <aside style={sidebar}>
        <div style={logoArea}><div style={logoIcon}>C</div><span style={logoText}>Corporate</span></div>
        <nav style={navStack}>
          <Link to="/dashboard/corporate" style={activeNavLink}>Portfolio</Link>
          <Link to="/dashboard/corporate/team" style={navLink}>Team Management</Link>
          <Link to="/dashboard/corporate/billing" style={navLink}>Billing</Link>
        </nav>
        <button onClick={() => supabase.auth.signOut().then(() => navigate("/"))} style={logoutBtn}>Sign Out</button>
      </aside>

      <main style={mainArea}>
        <header style={header}>
          <div>
            <h1 style={title}>Property Portfolio</h1>
            <p style={subtitle}>Manage institutional maintenance and development.</p>
          </div>
        </header>

        <div style={grid}>
          {/* Bulk Upload Section */}
          <section style={formCard}>
            <h3 style={sectionTitle}>Bulk Project Upload</h3>
            <p style={cardSubText}>Format: Name, Location, Category (one per line)</p>
            <textarea 
              style={textarea} 
              rows={5} 
              value={bulkText} 
              placeholder="Apartment 402, Cape Town, Plumbing"
              onChange={(e) => setBulkText(e.target.value)}
            />
            <button style={btn} onClick={createBulkProjects} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Create Projects"}
            </button>
          </section>

          {/* Team Invite Section */}
          <section style={formCard}>
            <h3 style={sectionTitle}>Invite Team Member</h3>
            <div style={{ display: "flex", gap: 10 }}>
              <input 
                style={input} 
                placeholder="Email Address" 
                value={inviteEmail} 
                onChange={e => setInviteEmail(e.target.value)} 
              />
              <select style={input} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button style={{ ...btn, marginTop: 15 }} onClick={sendInvite} disabled={actionLoading}>Send Invitation</button>
          </section>
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 40 }}>Active Projects</h3>
        <div style={listStack}>
          {projects.map(p => (
            <div key={p.id} style={card}>
              <div style={infoSide}>
                <span style={cardMainText}>{p.project_name}</span>
                <span style={cardSubText}>{p.location} • {p.category}</span>
              </div>
              <div style={statusBadge(p.status)}>{p.status}</div>
            </div>
          ))}
        </div>

        <h3 style={{ ...sectionTitle, marginTop: 40 }}>Recent Activity</h3>
        <div style={formCard}>
          {auditLog.map((log, i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
              <strong>{log.action.replace("_", " ")}</strong> — {new Date(log.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/* ======================= 
   STYLES (COPY-PASTE READY) 
======================= */
const layoutContainer = { display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'Inter', sans-serif" };
const sidebar = { width: "260px", background: "#0f172a", color: "#fff", padding: "30px 20px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh" };
const logoArea = { display: "flex", alignItems: "center", gap: 12, marginBottom: 40, paddingLeft: 10 };
const logoIcon = { width: 32, height: 32, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 };
const logoText = { fontWeight: 700, fontSize: 18, letterSpacing: "-0.5px" };
const navStack = { display: "flex", flexDirection: "column", gap: 8, flex: 1 };
const navLink = { padding: "12px 16px", borderRadius: "10px", color: "#94a3b8", textDecoration: "none", fontSize: "14px", fontWeight: 500 };
const activeNavLink = { ...navLink, background: "#1e293b", color: "#fff", fontWeight: 700 };
const mainArea = { flex: 1, marginLeft: "260px", padding: "40px" };
const header = { marginBottom: 30 };
const title = { fontSize: 28, fontWeight: 800, margin: 0, color: "#0f172a" };
const subtitle = { color: "#64748b", fontSize: 14, marginTop: 4 };
const sectionTitle = { fontSize: 12, fontWeight: 800, color: "#6366f1", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 15 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 };
const formCard = { background: "#fff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0" };
const input = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px" };
const textarea = { ...input, resize: "none", marginBottom: 10 };
const btn = { width: "100%", background: "#0f172a", color: "#fff", border: "none", padding: "12px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" };
const listStack = { display: "flex", flexDirection: "column", gap: 10 };
const card = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0" };
const infoSide = { display: "flex", flexDirection: "column", gap: 2 };
const cardMainText = { fontSize: 15, fontWeight: 700, color: "#1e293b" };
const cardSubText = { fontSize: 13, color: "#64748b" };
const statusBadge = (s) => ({ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 800, background: s === "open" ? "#dcfce7" : "#f1f5f9", color: s === "open" ? "#166534" : "#475569" });
const loadingArea = { padding: 40, color: "#64748b" };
const logoutBtn = { marginTop: "auto", padding: "12px", background: "transparent", border: "1px solid #334155", color: "#94a3b8", borderRadius: "10px", cursor: "pointer", fontWeight: 600 };