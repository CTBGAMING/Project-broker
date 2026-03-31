import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

const ROLES = [
  "customer",
  "contractor",
  "scoper",
  "inspector",
  "admin",
  "corporate_user",
  "corporate_admin",
  "event_planner",
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const [tab, setTab] = useState("all"); // all | contractors
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setErrMsg("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, banned, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("AdminUsers fetch error:", error);
      setErrMsg(`${error.message}${error.details ? ` — ${error.details}` : ""}`);
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (users || [])
      .filter((u) => (tab === "contractors" ? u.role === "contractor" : true))
      .filter((u) => {
        if (!q) return true;
        const hay = `${u.email || ""} ${u.full_name || ""} ${u.role || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [users, tab, search]);

  return (
    <div style={wrap}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>Users</h1>
          <p style={subtitle}>User + contractor list (from profiles table).</p>
        </div>
        <button style={goldBtn} onClick={fetchUsers}>
          Refresh
        </button>
      </div>

      <div style={controls}>
        <input
          style={searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search email / name / role…"
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={tab === "all" ? pillActive : pill} onClick={() => setTab("all")}>
            All
          </button>
          <button
            style={tab === "contractors" ? pillActive : pill}
            onClick={() => setTab("contractors")}
          >
            Contractors
          </button>
        </div>
      </div>

      {loading && <p style={muted}>Loading users…</p>}

      {!loading && errMsg && (
        <div style={errorBox}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Could not load users</div>
          <div style={{ fontSize: 13 }}>{errMsg}</div>
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.75)" }}>
            If this is an RLS issue, add the policy: <b>Admins can read all profiles</b>.
          </div>
        </div>
      )}

      {!loading && !errMsg && (
        <div style={tableWrap}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Email</th>
                <th style={th}>Name</th>
                <th style={th}>Role</th>
                <th style={th}>Banned</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td style={td}>{u.email || "—"}</td>
                  <td style={td}>{u.full_name || "—"}</td>
                  <td style={td}>
                    <span style={roleChip}>{u.role || "—"}</span>
                  </td>
                  <td style={td}>{u.banned ? "Yes" : "No"}</td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td style={td} colSpan="4">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const wrap = { maxWidth: 1200, margin: "0 auto" };
const headerRow = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 };
const title = { margin: 0, color: "#fff", fontSize: 28, fontWeight: 900 };
const subtitle = { marginTop: 6, color: "rgba(255,255,255,0.70)" };

const controls = { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 };

const searchInput = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  minWidth: 260,
  outline: "none",
};

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

const goldBtn = { padding: "12px 14px", borderRadius: 12, border: "none", background: "#D4AF37", color: "#0f172a", fontWeight: 900, cursor: "pointer" };
const muted = { color: "rgba(255,255,255,0.75)" };

const errorBox = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(239,68,68,0.35)",
  background: "rgba(239,68,68,0.12)",
  color: "#fff",
};

const tableWrap = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.65)",
  overflow: "hidden",
};

const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", padding: 14, color: "rgba(255,255,255,0.80)", fontSize: 12, letterSpacing: 0.5, borderBottom: "1px solid rgba(255,255,255,0.08)" };
const td = { padding: 14, color: "rgba(255,255,255,0.90)", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 13 };

const roleChip = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  fontWeight: 900,
  color: "#fff",
  fontSize: 12,
};