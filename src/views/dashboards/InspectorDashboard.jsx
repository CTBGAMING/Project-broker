import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";

/* ---------------- PREMIUM DARK THEME STYLES ---------------- */
const styles = {
  pageContainer: { maxWidth: 1000, margin: "0 auto", padding: "0 10px", fontFamily: "'Inter', sans-serif" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 20
  },
  logoHomeBtn: {
    display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer"
  },
  logoImg: {
    height: 48, width: "auto", objectFit: "contain"
  },
  title: { fontFamily: "'Playfair Display', serif", color: "#fff", margin: 0, fontSize: 28 },
  subtitle: { color: "#94a3b8", fontSize: 14, marginTop: 4 },
  card: {
    background: "#12141c", padding: 24, borderRadius: 20, marginBottom: 20,
    border: "1px solid rgba(197, 160, 89, 0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  badge: {
    padding: "6px 12px", borderRadius: 50, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", 
    fontSize: 11, fontWeight: 800, display: "inline-block", textTransform: "uppercase", border: "1px solid rgba(197, 160, 89, 0.3)"
  },
  input: {
    flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", outline: "none", fontSize: "14px"
  },
  textarea: {
    width: "100%", minHeight: 100, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", marginTop: 16, outline: "none", resize: "vertical", fontSize: "14px"
  },
  pill: {
    padding: "10px 20px", borderRadius: 50, border: "1px solid rgba(197, 160, 89, 0.4)",
    background: "transparent", color: "#c5a059", cursor: "pointer", fontSize: 13, fontWeight: 800, textTransform: "uppercase"
  },
  passBtn: {
    flex: 1, padding: 16, borderRadius: 50, background: "linear-gradient(135deg, #166534 0%, #22c55e 100%)",
    color: "#fff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 13, textTransform: "uppercase",
    letterSpacing: "1px", boxShadow: "0 4px 15px rgba(34, 197, 94, 0.2)"
  },
  failBtn: {
    flex: 1, padding: 16, borderRadius: 50, background: "linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)",
    color: "#fff", fontWeight: 800, border: "none", cursor: "pointer", fontSize: 13, textTransform: "uppercase",
    letterSpacing: "1px", boxShadow: "0 4px 15px rgba(239, 68, 68, 0.2)"
  },
  photosGrid: {
    display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12
  },
  photo: {
    width: 100, height: 100, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(197, 160, 89, 0.3)"
  },
  fileInputWrap: {
    marginTop: 16, padding: "16px", borderRadius: 12, border: "1px dashed rgba(197, 160, 89, 0.4)", 
    background: "rgba(197, 160, 89, 0.02)", textAlign: "center", color: "#c5a059"
  },
  snagBox: {
    padding: "16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginTop: "16px"
  },
  empty: {
    background: "#12141c", padding: 40, borderRadius: 16, color: "#94a3b8", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)"
  }
};

export default function InspectorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return navigate("/auth/login");
    }

    setUser(user);

    const { data, error } = await supabase
      .from("inspections")
      .select(`
        id, status, notes, snag_list, media_urls, created_at,
        projects ( id, project_name, project_type, categories, location, budget, status )
      `)
      .eq("inspector_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setInspections(data || []);
    }

    setLoading(false);
  }

  async function submitInspection(id, status, notes, snagList) {
    if (!window.confirm(`Submit inspection as ${status.toUpperCase()}? This cannot be undone.`)) return;

    setSubmitting(true);

    await supabase
      .from("inspections")
      .update({
        status,
        notes,
        snag_list: snagList,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    await loadInspections();
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0d17", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#c5a059", fontFamily: "'Playfair Display', serif" }}>Loading Audits…</div>
      </div>
    );
  }

  if (error) return <div style={{ color: "#ef4444", textAlign: "center", padding: 50, background: "#0b0d17", minHeight: "100vh" }}>{error}</div>;

  return (
    <DashboardLayout title="Inspector Portal">
      <div style={styles.pageContainer}>
        
        {/* HEADER WITH LOGO */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a onClick={(e) => { e.preventDefault(); navigate("/"); }} href="/" style={styles.logoHomeBtn}>
              {/* Replace /logo.png with your actual logo path */}
              <img src="/logo.png" alt="Project Broker Logo" style={styles.logoImg} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <span style={{ display: "none", fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#c5a059", fontWeight: 900, letterSpacing: "-1px" }}>PB.</span>
            </a>
            <div>
              <h1 style={styles.title}>Quality Assurance Portal</h1>
              <div style={styles.subtitle}>Assigned site audits & inspections.</div>
            </div>
          </div>
          <button onClick={loadInspections} style={{ ...styles.pill, background: "rgba(197,160,89,0.1)" }}>Refresh</button>
        </div>

        {inspections.length === 0 && (
          <div style={styles.empty}>No inspections assigned to you yet. You're all caught up!</div>
        )}

        {inspections.map((inspection) => (
          <InspectionCard
            key={inspection.id}
            inspection={inspection}
            onSubmit={submitInspection}
            submitting={submitting}
            reload={loadInspections}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}

/* =========================
   INSPECTION CARD
========================= */
function InspectionCard({ inspection, onSubmit, submitting, reload }) {
  const [notes, setNotes] = useState("");
  const [snagInput, setSnagInput] = useState("");
  const [snagList, setSnagList] = useState([]);
  const [uploading, setUploading] = useState(false);

  const locked = inspection.status !== "assigned" && inspection.status !== "pending";

  function addSnag() {
    if (!snagInput.trim()) return;
    setSnagList([...snagList, snagInput.trim()]);
    setSnagInput("");
  }

  async function uploadPhoto(file) {
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${inspection.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("inspection_media").upload(path, file);

    if (!error) {
      const { data } = supabase.storage.from("inspection_media").getPublicUrl(path);
      const updated = [...(inspection.media_urls || []), data.publicUrl];

      await supabase.from("inspections").update({ media_urls: updated }).eq("id", inspection.id);
      await reload();
    } else {
      alert(`Upload failed: ${error.message}`);
    }

    setUploading(false);
  }

  return (
    <div style={styles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: 22, margin: "0 0 8px 0" }}>
            {inspection.projects?.project_name || "Untitled Project"}
          </h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={styles.badge}>{inspection.projects?.project_type || "Inspection"}</span>
            <span style={{ color: "#94a3b8", fontSize: 13, textTransform: "uppercase", fontWeight: 700 }}>{inspection.status}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20, color: "#94a3b8", fontSize: 13 }}>
        <Detail label="Location" value={inspection.projects?.location} />
        <Detail label="Budget" value={inspection.projects?.budget ? `R ${Number(inspection.projects.budget).toLocaleString()}` : null} />
        <div style={{ gridColumn: "1 / -1" }}>
          <Detail label="Categories" value={inspection.projects?.categories?.join(", ")} />
        </div>
      </div>

      {/* MEDIA GALLERY */}
      {inspection.media_urls?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <strong style={{ color: "#c5a059", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Uploaded Photos</strong>
          <div style={styles.photosGrid}>
            {inspection.media_urls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="inspection" style={styles.photo} />
              </a>
            ))}
          </div>
        </div>
      )}

      {!locked && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          
          <div style={styles.fileInputWrap}>
            <label style={{ cursor: "pointer" }}>
              <strong>{uploading ? "Uploading..." : "📸 Click to Upload Inspection Photo"}</strong>
              <input type="file" accept="image/*" disabled={uploading} onChange={(e) => uploadPhoto(e.target.files[0])} style={{ display: "none" }} />
            </label>
          </div>

          <textarea placeholder="Log your internal inspection notes here..." value={notes} onChange={(e) => setNotes(e.target.value)} style={styles.textarea} />

          <div style={styles.snagBox}>
            <strong style={{ color: "#c5a059", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: 12 }}>Snag List (Issues)</strong>
            
            <div style={{ display: "flex", gap: 10 }}>
              <input value={snagInput} onChange={(e) => setSnagInput(e.target.value)} placeholder="Describe the issue found..." style={styles.input} onKeyDown={(e) => e.key === "Enter" && addSnag()} />
              <button onClick={addSnag} style={{ ...styles.pill, borderRadius: 12 }}>Add</button>
            </div>

            {snagList.length > 0 && (
              <ul style={{ paddingLeft: 20, color: "#cbd5e1", fontSize: 14, marginTop: 16 }}>
                {snagList.map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ display: "flex", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
            <button disabled={submitting} onClick={() => onSubmit(inspection.id, "passed", notes, snagList)} style={styles.passBtn}>
              ✅ Pass Inspection
            </button>
            <button disabled={submitting || snagList.length === 0} onClick={() => onSubmit(inspection.id, "failed", notes, snagList)} style={{ ...styles.failBtn, opacity: snagList.length === 0 ? 0.5 : 1 }} title={snagList.length === 0 ? "You must add at least one snag to fail an inspection" : ""}>
              ❌ Fail & Send Snags
            </button>
          </div>
        </div>
      )}

      {locked && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <strong style={{ color: "#c5a059", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Final Notes</strong>
          <div style={{ color: "#fff", fontSize: 14, marginTop: 6, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8 }}>
            {inspection.notes || "No notes provided."}
          </div>

          {inspection.snag_list?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <strong style={{ color: "#ef4444", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>Logged Snags</strong>
              <ul style={{ paddingLeft: 20, color: "#cbd5e1", fontSize: 14, marginTop: 8 }}>
                {inspection.snag_list.map((s, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */
function Detail({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <strong style={{ color: "#c5a059" }}>{label}:</strong> <span style={{ color: "#fff" }}>{value}</span>
    </div>
  );
}