import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { CheckCircle, XCircle, Building2, Mail, Phone, Briefcase } from "lucide-react";

export default function AdminApprovals() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    setLoading(true);
    const { data } = await supabase.from("corporate_applications").select("*").eq("status", "pending").order("created_at", { ascending: false });
    setApplications(data || []);
    setLoading(false);
  }

  async function handleApprove(app) {
    setActionLoading(app.id);
    const { error } = await supabase.from("corporate_applications").update({ status: "approved" }).eq("id", app.id);
    if (!error) {
      alert(`Approved: ${app.company_name}`);
      fetchApplications();
    }
    setActionLoading(null);
  }

  async function handleReject(id) {
    if (!confirm("Reject this application?")) return;
    const { error } = await supabase.from("corporate_applications").update({ status: "rejected" }).eq("id", id);
    if (!error) fetchApplications();
  }

  if (loading) return <div style={{ padding: 40 }}>Loading pending apps...</div>;

  return (
    <div style={{ padding: "30px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Corporate Vetting</h1>
          <p style={{ color: "#64748b" }}>Approve property management and insurance entities.</p>
        </div>
        <div style={{ background: "#6366f1", color: "#fff", padding: "8px 16px", borderRadius: "20px", fontWeight: 700 }}>{applications.length} Pending</div>
      </header>

      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <th style={th}>Company</th>
              <th style={th}>Contact</th>
              <th style={th}>Scale</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{app.company_name}</div>
                  <div style={subText}><Building2 size={12} /> {app.industry_type}</div>
                </td>
                <td style={td}>
                  <div style={{ fontWeight: 700 }}>{app.contact_person_name}</div>
                  <div style={subText}><Mail size={12} /> {app.contact_email}</div>
                </td>
                <td style={td}>
                  <div style={subText}><Briefcase size={12} /> Portfolio: {app.portfolio_size || "N/A"}</div>
                </td>
                <td style={td}>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => handleApprove(app)} style={appBtn} disabled={actionLoading === app.id}>
                      <CheckCircle size={18} />
                    </button>
                    <button onClick={() => handleReject(app.id)} style={rejBtn}>
                      <XCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No applications found.</div>}
      </div>
    </div>
  );
}

const th = { padding: "16px 24px", fontSize: "12px", fontWeight: "700", color: "#475569", textTransform: "uppercase" };
const td = { padding: "20px 24px" };
const subText = { fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: 6, marginTop: 4 };
const appBtn = { background: "#dcfce7", color: "#166534", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" };
const rejBtn = { background: "#fee2e2", color: "#991b1b", border: "none", padding: 8, borderRadius: 8, cursor: "pointer" };