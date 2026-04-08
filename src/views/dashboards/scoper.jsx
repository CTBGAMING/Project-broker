import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { UserPlus, X, Briefcase, Phone, TrendingUp, DollarSign, Calendar, Hammer } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout.jsx";

/* ---------------- STYLES (PREMIUM DARK THEME) ---------------- */
const styles = {
  pageInner: { maxWidth: 1000, margin: "0 auto", padding: "0 10px", fontFamily: "'Inter', sans-serif" },
  panel: {
    background: "#12141c", padding: 24, borderRadius: 16, marginBottom: 20,
    border: "1px solid rgba(197, 160, 89, 0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  title: { marginTop: 0, marginBottom: 20, color: "#ffffff", fontFamily: "'Playfair Display', serif", letterSpacing: "1px", fontSize: "24px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: {
    background: "linear-gradient(145deg, #1a1d27 0%, #12141c 100%)", padding: 24, borderRadius: 16,
    border: "1px solid rgba(197, 160, 89, 0.15)", display: "flex", flexDirection: "column", gap: 8, position: "relative", overflow: "hidden"
  },
  statLabel: { color: "#94a3b8", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", zIndex: 2 },
  statValue: { color: "#c5a059", fontSize: 32, fontWeight: 800, fontFamily: "'Playfair Display', serif", zIndex: 2 },
  statIcon: { position: "absolute", right: -10, bottom: -10, opacity: 0.05, color: "#c5a059", width: 100, height: 100, zIndex: 1 },
  
  clientGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 },
  clientCard: {
    background: "#0b0d17", padding: 20, borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.05)", transition: "transform 0.2s, borderColor 0.2s",
    display: "flex", flexDirection: "column", gap: 12
  },
  clientHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  clientName: { color: "#ffffff", fontSize: 18, fontWeight: 700, margin: 0 },
  clientPhone: { color: "#94a3b8", fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginTop: 4 },
  
  chipContainer: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: { padding: "4px 10px", borderRadius: 50, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" },
  
  commBox: { background: "rgba(197, 160, 89, 0.1)", padding: 12, borderRadius: 8, border: "1px solid rgba(197, 160, 89, 0.2)", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" },
  
  goldBtn: {
    padding: "16px 24px", borderRadius: 50, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 13,
    letterSpacing: "1px", textTransform: "uppercase", color: "#000",
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    boxShadow: "0 4px 15px rgba(197, 160, 89, 0.2)", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", width: "100%"
  },
  
  modalBackdrop: { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(11, 13, 23, 0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: { background: "#12141c", width: "100%", maxWidth: 480, padding: 32, borderRadius: 24, border: "1px solid #c5a059", position: "relative", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" },
  modalTitle: { fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: 24, margin: "0 0 8px 0" },
  modalSub: { color: "#94a3b8", fontSize: 14, marginBottom: 24 },
  closeBtn: { position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#94a3b8", cursor: "pointer" },
  
  inputBox: { marginBottom: 16 },
  label: { display: "block", color: "#c5a059", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 },
  input: { width: "100%", background: "#0b0d17", border: "1px solid rgba(255,255,255,0.1)", padding: 14, borderRadius: 12, color: "#fff", outline: "none", fontSize: 14, boxSizing: "border-box" },
};

export default function ScoperDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [leadData, setLeadData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    estimated_profit: ""
  });

  useEffect(() => {
    loadScoperData();
  }, []);

  async function loadScoperData() {
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) {
      navigate("/");
      return;
    }
    setUser(authData.user);

    // 1. THIS IS THE CRITICAL FIX: Querying the new scoper_agent_id column
    const { data: clientProjects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("scoper_agent_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching agent projects:", error.message);
    } else {
      setProjects(clientProjects || []);
    }
    
    setLoading(false);
  }

  const handleStartSession = (e) => {
    e.preventDefault();
    // 2. Save exactly what the Customer/Event dashboards are expecting
    sessionStorage.setItem("pb_active_lead", JSON.stringify(leadData));
    setShowModal(false);
    
    // Send them to the video landing page to choose Construction vs Events
    navigate("/customer/home");
  };

  // --- STAT CALCULATIONS ---
  const totalClients = projects.length;
  
  // Summing up the numbers from the new scoper_client_details column
  const totalCommission = projects.reduce((acc, curr) => {
    const comm = curr.scoper_client_details?.commission_due || 0;
    return acc + Number(comm);
  }, 0);

  const totalPipeline = projects.reduce((acc, curr) => {
    const profit = curr.scoper_client_details?.target_profit || 0;
    return acc + Number(profit);
  }, 0);

  if (loading) {
    return (
      <DashboardLayout title="Agent Portal">
        <div style={{ textAlign: "center", paddingTop: 100, color: "#c5a059", fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
          Loading Pipeline...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Agent Portal">
      <div style={styles.pageInner}>
        
        {/* TOP BUTTON */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <div style={{ width: "280px" }}>
            <button onClick={() => setShowModal(true)} style={styles.goldBtn}>
              <UserPlus size={18} /> New Client Project
            </button>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <Briefcase style={styles.statIcon} />
            <div style={styles.statLabel}>Active Clients</div>
            <div style={styles.statValue}>{totalClients}</div>
          </div>
          <div style={styles.statCard}>
            <TrendingUp style={styles.statIcon} />
            <div style={styles.statLabel}>Pipeline Value</div>
            <div style={styles.statValue}>R{(totalPipeline).toLocaleString()}</div>
          </div>
          <div style={{...styles.statCard, border: "1px solid rgba(16, 185, 129, 0.3)"}}>
            <DollarSign style={styles.statIcon} />
            <div style={{...styles.statLabel, color: "#34d399"}}>Expected Commission</div>
            <div style={{...styles.statValue, color: "#34d399"}}>R{(totalCommission).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          </div>
        </div>

        {/* CLIENT PIPELINE */}
        <div style={styles.panel}>
          <h2 style={styles.title}>Your Client Pipeline</h2>
          
          {projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#0b0d17", borderRadius: 12, border: "1px dashed rgba(197,160,89,0.3)" }}>
              <UserPlus size={48} color="#c5a059" style={{ opacity: 0.5, marginBottom: 16 }} />
              <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No clients yet</div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>Click "New Client Project" to start your first session.</div>
            </div>
          ) : (
            <div style={styles.clientGrid}>
              {projects.map(p => {
                const clientData = p.scoper_client_details || {};
                const isConstruction = p.category === "Construction";
                
                return (
                  <div key={p.id} style={styles.clientCard}>
                    <div style={styles.clientHeader}>
                      <div>
                        <h4 style={styles.clientName}>{clientData.customer_name || "Unknown Client"}</h4>
                        <div style={styles.clientPhone}>
                          <Phone size={12} /> {clientData.customer_phone || "No phone provided"}
                        </div>
                      </div>
                    </div>
                    
                    <div style={styles.chipContainer}>
                      <span style={{...styles.chip, border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8"}}>
                        {p.status}
                      </span>
                      <span style={{...styles.chip, border: isConstruction ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid rgba(217, 70, 239, 0.3)", color: isConstruction ? "#60a5fa" : "#e879f9", background: isConstruction ? "rgba(59, 130, 246, 0.1)" : "rgba(217, 70, 239, 0.1)", display: "flex", alignItems: "center", gap: 4}}>
                        {isConstruction ? <Hammer size={10}/> : <Calendar size={10}/>}
                        {p.category}
                      </span>
                    </div>

                    <div style={{ color: "#fff", fontSize: 13, marginTop: 4 }}>
                      <strong>Project:</strong> {p.project_name}
                    </div>

                    <div style={styles.commBox}>
                      <span style={{ color: "#c5a059", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>Commission (2%)</span>
                      <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>R{Number(clientData.commission_due || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- LEAD CAPTURE MODAL --- */}
      {showModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <button style={styles.closeBtn} onClick={() => setShowModal(false)}><X size={24}/></button>
            <div style={{ color: "#c5a059", fontSize: 10, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Briefcase size={14} /> Agent Session
            </div>
            <h2 style={styles.modalTitle}>Start Client Project</h2>
            <p style={styles.modalSub}>Capture the client's details to secure your commission before picking a portal.</p>
            
            <form onSubmit={handleStartSession}>
              <div style={styles.inputBox}>
                <label style={styles.label}>Client Full Name</label>
                <input required style={styles.input} value={leadData.customer_name} onChange={e => setLeadData({...leadData, customer_name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={styles.inputBox}>
                  <label style={styles.label}>Phone Number</label>
                  <input required style={styles.input} value={leadData.customer_phone} onChange={e => setLeadData({...leadData, customer_phone: e.target.value})} placeholder="081..." />
                </div>
                <div style={styles.inputBox}>
                  <label style={styles.label}>Email (Optional)</label>
                  <input type="email" style={styles.input} value={leadData.customer_email} onChange={e => setLeadData({...leadData, customer_email: e.target.value})} placeholder="Optional" />
                </div>
              </div>

              <div style={styles.inputBox}>
                <label style={styles.label}>Estimated Vendor Profit (ZAR)</label>
                <input type="number" required style={styles.input} value={leadData.estimated_profit} onChange={e => setLeadData({...leadData, estimated_profit: e.target.value})} placeholder="e.g. 10000" />
                <div style={{ color: "#34d399", fontSize: 12, marginTop: 8, fontWeight: 700 }}>
                  Your estimated commission (2%): R{leadData.estimated_profit ? (Number(leadData.estimated_profit) * 0.02).toFixed(2) : "0.00"}
                </div>
              </div>

              <button type="submit" style={{ ...styles.goldBtn, marginTop: 24, padding: "18px 24px" }}>
                Save & Select Portal
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}