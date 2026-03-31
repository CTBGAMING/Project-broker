import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadProjects(), loadInspectors()]);
    setLoading(false);
  }

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select(`
        id,
        project_name,
        project_type,
        admin_status,
        status,
        location,
        budget,
        description,
        categories,
        event_date,
        metadata,
        inspector_id,
        created_at
      `)
      .order("created_at", { ascending: false });

    setProjects(data || []);
  }

  async function loadInspectors() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "Inspector");

    setInspectors(data || []);
  }

  async function setStatus(id, admin_status) {
    await supabase
      .from("projects")
      .update({ admin_status })
      .eq("id", id);

    loadProjects();
  }

  async function assignInspector(projectId, inspectorId) {
    await supabase
      .from("projects")
      .update({ inspector_id: inspectorId })
      .eq("id", projectId);

    loadProjects();
  }

  function toggle(id) {
    setExpandedId(expandedId === id ? null : id);
  }

  if (loading) return <p>Loading projects…</p>;

  return (
    <>
      <h1>Projects</h1>
      <p>Click a project to view details and assign inspectors</p>

      <div style={list}>
        {projects.map((p) => {
          const expanded = expandedId === p.id;

          return (
            <div key={p.id} style={card}>
              {/* SUMMARY */}
              <div style={summary} onClick={() => toggle(p.id)}>
                <div>
                  <strong>{p.project_name}</strong>
                  <div style={meta}>
                    {p.project_type} • {p.admin_status || "pending"}
                  </div>
                </div>
                <span>{expanded ? "▲" : "▼"}</span>
              </div>

              {/* DETAILS */}
              {expanded && (
                <div style={details}>
                  <Detail label="Location" value={p.location} />
                  <Detail label="Budget" value={p.budget && `R ${p.budget}`} />
                  <Detail label="Categories" value={p.categories?.join(", ")} />
                  <Detail label="Event Date" value={p.event_date} />
                  <Detail
                    label="Created"
                    value={new Date(p.created_at).toLocaleString()}
                  />

                  {p.description && (
                    <Block title="Description">
                      <p>{p.description}</p>
                    </Block>
                  )}

                  {p.metadata && (
                    <Block title="Additional Data">
                      <pre style={metaBox}>
                        {JSON.stringify(p.metadata, null, 2)}
                      </pre>
                    </Block>
                  )}

                  {/* INSPECTOR ASSIGNMENT */}
                  <Block title="Site Inspector">
                    <select
                      value={p.inspector_id || ""}
                      onChange={(e) =>
                        assignInspector(p.id, e.target.value || null)
                      }
                    >
                      <option value="">— Unassigned —</option>
                      {inspectors.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.full_name}
                        </option>
                      ))}
                    </select>
                  </Block>

                  {/* ACTIONS */}
                  <div style={actions}>
                    <button onClick={() => setStatus(p.id, "approved")}>
                      Approve
                    </button>
                    <button onClick={() => setStatus(p.id, "rejected")}>
                      Reject
                    </button>
                    <button onClick={() => setStatus(p.id, "suspended")}>
                      Suspend
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ================= HELPERS ================= */

function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div style={detailRow}>
      <strong>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={block}>
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}

/* ================= STYLES ================= */

const list = {
  marginTop: "30px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const card = {
  background: "#fff",
  borderRadius: "14px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
  overflow: "hidden",
};

const summary = {
  padding: "18px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  cursor: "pointer",
  background: "#fafafe",
};

const meta = {
  fontSize: "12px",
  color: "#777",
  marginTop: "4px",
};

const details = {
  padding: "20px",
  borderTop: "1px solid #eee",
};

const detailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const block = {
  marginTop: "16px",
};

const metaBox = {
  background: "#f5f6fb",
  padding: "12px",
  borderRadius: "10px",
  fontSize: "12px",
};

const actions = {
  marginTop: "20px",
  display: "flex",
  gap: "10px",
};
