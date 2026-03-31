import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminScopers() {
  const [scopers, setScopers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("role", "scoper")
      .order("full_name", { ascending: true });

    if (error) console.error("AdminScopers load error:", error);
    setScopers(data || []);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ margin: 0, color: "#fff", fontSize: 28, fontWeight: 900 }}>Scopers</h1>
      <p style={{ color: "rgba(255,255,255,0.70)", marginTop: 6 }}>
        Scopers are users with role <b>scoper</b>.
      </p>

      {loading && <p style={{ color: "rgba(255,255,255,0.75)" }}>Loading…</p>}

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        {scopers.map((s) => (
          <div key={s.id} style={card}>
            <div style={{ fontWeight: 900, color: "#fff" }}>{s.full_name || "—"}</div>
            <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 13 }}>
              {s.email || "—"} • {s.role}
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 6 }}>
              {s.id}
            </div>
          </div>
        ))}

        {!loading && scopers.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.70)" }}>No scopers found.</div>
        )}
      </div>
    </div>
  );
}

const card = {
  padding: 16,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(15,23,42,0.65)",
};