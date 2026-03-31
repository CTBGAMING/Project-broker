import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filter, setFilter] = useState("pending_admin"); // default to pending approvals
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("projects")
      .select("id, project_name, category, status, admin_status, payment_status, created_at")
      .order("created_at", { ascending: false });

    if (error) console.error("AdminProjects load error:", error);
    setProjects(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return (projects || [])
      .filter((p) => {
        if (filter === "pending_admin") return p.admin_status === "pending";
        if (filter === "events") return p.category === "Events";
        if (filter === "construction") return p.category !== "Events";
        return true;
      })
      .filter((p) => {
        if (!q) return true;
        const hay = `${p.project_name || ""} ${p.category || ""} ${p.status || ""} ${p.admin_status || ""} ${p.payment_status || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [projects, filter, search]);

  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>Projects</h1>
          <p style={subtitle}>Admin approvals are driven by <b>admin_status</b>.</p>
        </div>
        <button style={goldBtn} onClick={load}>Refresh</button>
      </div>

      <div style={controls}>
        <input
          style={searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects..."
        />

        <div style={pillRow}>
          <button style={filter === "pending_admin" ? pillActive : pill} onClick={() => setFilter("pending_admin")}>
            Pending (Admin)
          </button>
          <button style={filter === "all" ? pillActive : pill} onClick={() => setFilter("all")}>
            All
          </button>
          <button style={filter === "events" ? pillActive : pill} onClick={() => setFilter("events")}>
            Events
          </button>
          <button style={filter === "construction" ? pillActive : pill} onClick={() => setFilter("construction")}>
            Construction
          </button>
        </div>
      </div>

      {loading && <div style={muted}>Loading…</div>}
      {!loading && filtered.length === 0 && <div style={muted}>No matching projects.</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((p) => (
          <div key={p.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 900, color: "#fff" }}>{p.project_name || "Untitled"}</div>
              <span style={statusChip(p.admin_status)}>{p.admin_status || "—"}</span>
            </div>

            <div style={meta}>
              <span><b>Category:</b> {p.category || "—"}</span>
              <span><b>Status:</b> {p.status || "—"}</span>
              <span><b>Payment:</b> {p.payment_status || "—"}</span>
            </div>

            <div style={meta2}>
              <span><b>ID:</b> {p.id}</span>
              <span><b>Created:</b> {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const wrap = {
  maxWidth: 1200,
  margin: "0 auto",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 18,
};

const title = { margin: 0, color: "#fff", fontSize: 28, fontWeight: 900 };
const subtitle = { marginTop: 6, color: "rgba(255,255,255,0.70)" };

const controls = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 16,
};

const searchInput = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  minWidth: 260,
  outline: "none",
};

const pillRow = { display: "flex", gap: 8, flexWrap: "wrap" };

const pill = {
  padding: "10px 12px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.90)",
  cursor: "pointer",
  fontWeight: 900,
};

const pillActive = {
  ...pill,
  border: "1px solid rgba(212,175,55,0.35)",
  background: "rgba(212,175,55,0.14)",
  color: "#D4AF37",
};

const goldBtn = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "none",
  background: "#D4AF37",
  color: "#0f172a",
  fontWeight: 900,
  cursor: "pointer",
};

const muted = { color: "rgba(255,255,255,0.70)", padding: "10px 0" };

const card = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.65)",
  backdropFilter: "blur(10px)",
};

const meta = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 10,
  color: "rgba(255,255,255,0.78)",
  fontSize: 13,
};

const meta2 = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 8,
  color: "rgba(255,255,255,0.55)",
  fontSize: 12,
};

function statusChip(adminStatus) {
  const s = String(adminStatus || "").toLowerCase();
  let bg = "rgba(226,232,240,0.15)";
  let color = "rgba(255,255,255,0.85)";
  let border = "1px solid rgba(255,255,255,0.14)";

  if (s === "pending") {
    bg = "rgba(245, 196, 81, 0.14)";
    color = "#F5C451";
    border = "1px solid rgba(245,196,81,0.30)";
  }
  if (s === "approved") {
    bg = "rgba(16,185,129,0.14)";
    color = "#10b981";
    border = "1px solid rgba(16,185,129,0.30)";
  }
  if (s === "rejected") {
    bg = "rgba(239,68,68,0.14)";
    color = "#ef4444";
    border = "1px solid rgba(239,68,68,0.30)";
  }

  return { padding: "6px 10px", borderRadius: 999, background: bg, color, border, fontWeight: 900, fontSize: 12 };
}