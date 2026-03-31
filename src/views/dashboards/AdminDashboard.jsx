import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [tab, setTab] = useState("projects");

  const [projects, setProjects] = useState([]);
  const [scopers, setScopers] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const p = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    const s = await supabase.from("profiles").select("*").eq("role", "scoper");
    const u = await supabase.from("profiles").select("*");
    const pay = await supabase.from("payments").select("*").order("created_at", { ascending: false });

    setProjects(p.data || []);
    setScopers(s.data || []);
    setUsers(u.data || []);
    setPayments(pay.data || []);
  }

  async function assignScoper(projectId, scoperId) {
    await supabase.from("projects").update({ scoper_id: scoperId }).eq("id", projectId);
    alert("Scoper assigned");
    loadAll();
  }

  async function emergencyOpen(projectId) {
    await supabase.from("projects").update({ status: "open" }).eq("id", projectId);
    alert("Project forced open");
    loadAll();
  }

  async function banUser(userId) {
    await supabase.from("profiles").update({ banned: true }).eq("id", userId);
    alert("User banned");
    loadAll();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* SIDEBAR */}
      <aside style={{ width: 260, background: "#fff", padding: 24, borderRight: "1px solid #eee" }}>
        <h2 style={{ color: "#6f52ff", marginBottom: 30 }}>Admin</h2>

        <Menu label="Projects" onClick={() => setTab("projects")} active={tab === "projects"} />
        <Menu label="Assign Scopers" onClick={() => setTab("scopers")} active={tab === "scopers"} />
        <Menu label="Users" onClick={() => setTab("users")} active={tab === "users"} />
        <Menu label="Payments" onClick={() => setTab("payments")} active={tab === "payments"} />
        <Menu label="Platform" onClick={() => setTab("settings")} active={tab === "settings"} />
      </aside>

      {/* CONTENT */}
      <main style={{ flex: 1, padding: 40, background: "#f7f8fc" }}>
        {tab === "projects" && (
          <>
            <h1>Projects</h1>
            {projects.map(p => (
              <div key={p.id} style={card}>
                <strong>{p.project_name}</strong>
                <div>Status: {p.status}</div>
                <div>Category: {p.category}</div>
                <button onClick={() => emergencyOpen(p.id)}>🚨 Emergency Open</button>
              </div>
            ))}
          </>
        )}

        {tab === "scopers" && (
          <>
            <h1>Assign Scopers</h1>
            {projects.filter(p => !p.scoper_id).map(p => (
              <div key={p.id} style={card}>
                <strong>{p.project_name}</strong>
                <select onChange={e => assignScoper(p.id, e.target.value)}>
                  <option>Select Scoper</option>
                  {scopers.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              </div>
            ))}
          </>
        )}

        {tab === "users" && (
          <>
            <h1>Users</h1>
            {users.map(u => (
              <div key={u.id} style={card}>
                {u.full_name} ({u.role})
                <button onClick={() => banUser(u.id)}>🚫 Ban</button>
              </div>
            ))}
          </>
        )}

        {tab === "payments" && (
          <>
            <h1>Payments</h1>
            {payments.map(p => (
              <div key={p.id} style={card}>
                R{p.amount} – {p.reason}
              </div>
            ))}
          </>
        )}

        {tab === "settings" && (
          <>
            <h1>Platform</h1>
            <p>Admin project fee: R50</p>
            <p>Scoper site visit fee: R400</p>
            <p>Emergency override enabled</p>
          </>
        )}
      </main>
    </div>
  );
}

function Menu({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 12,
        marginBottom: 10,
        borderRadius: 10,
        border: "none",
        background: active ? "linear-gradient(135deg,#6f52ff,#f5c451)" : "transparent",
        color: active ? "#fff" : "#444",
        fontWeight: 700,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {label}
    </button>
  );
}

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 12,
  marginBottom: 12,
};
