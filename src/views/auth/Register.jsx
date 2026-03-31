import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { User, Briefcase, Building2, PartyPopper, ShieldCheck } from "lucide-react";

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [role, setRole] = useState(searchParams.get("role") || "customer");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
    industry: "Property Management",
    portfolioSize: ""
  });

  const roles = [
    { id: "customer", label: "Customer", icon: <User size={18} />, desc: "Homeowner / Individual" },
    { id: "contractor", label: "Contractor", icon: <Briefcase size={18} />, desc: "Service Provider" },
    { id: "event_planner", label: "Event Planner", icon: <PartyPopper size={18} />, desc: "Events & Venues" },
    { id: "corporate_user", label: "Corporate", icon: <Building2 size={18} />, desc: "Insurance & Property" },
  ];

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    if (role === "corporate_user") {
      // Logic for Corporate Application
      const { error } = await supabase.from("corporate_applications").insert([{
        company_name: formData.companyName,
        industry_type: formData.industry,
        contact_person_name: formData.fullName,
        contact_email: formData.email.toLowerCase().trim(),
        contact_phone: formData.phone,
        portfolio_size: formData.portfolioSize,
        status: "pending"
      }]);

      if (!error) {
        alert("Application Submitted! Our admin team will review your details shortly.");
        navigate("/auth/login");
      } else {
        alert("Error: " + error.message);
      }
    } else {
      // Standard Registration for other roles
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: role,
            company_name: role === "customer" ? null : formData.companyName,
            phone: formData.phone
          }
        }
      });

      if (!error) {
        alert("Registration Successful! Please verify your email to log in.");
        navigate("/auth/login");
      } else {
        alert("Error: " + error.message);
      }
    }
    setLoading(false);
  }

  return (
    <div style={pageContainer}>
      <div style={glassCard}>
        {/* TIGHTENED HEADER SECTION */}
        <div style={headerSection}>
          <div style={badge}><ShieldCheck size={12} /> SECURE REGISTRATION</div>
          <h1 style={goldTitle}>Create Your Account</h1>
          <p style={subtitle}>Premium access for property & event professionals</p>
        </div>

        {/* ROLE SELECTOR GRID */}
        <div style={roleGrid}>
          {roles.map((r) => (
            <div 
              key={r.id} 
              onClick={() => setRole(r.id)}
              style={role === r.id ? activeRoleCard : roleCard}
            >
              <div style={role === r.id ? goldIcon : purpleIcon}>{r.icon}</div>
              <div style={role === r.id ? activeRoleLabel : roleLabel}>{r.label}</div>
              <p style={roleDesc}>{r.desc}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleRegister} style={formStyle}>
          
          {/* ROW 1: Name & Email */}
          <div style={row}>
            <div style={inputGroup}>
               <label style={labelStyle}>Full Name</label>
               <input 
                 style={inputStyle} 
                 placeholder="John Doe" 
                 required 
                 value={formData.fullName}
                 onChange={e => setFormData({...formData, fullName: e.target.value})} 
               />
            </div>
            <div style={inputGroup}>
               <label style={labelStyle}>Email Address</label>
               <input 
                 style={inputStyle} 
                 type="email" 
                 placeholder="john@example.com" 
                 required 
                 value={formData.email}
                 onChange={e => setFormData({...formData, email: e.target.value})} 
               />
            </div>
          </div>

          {/* ROW 2: Phone & Company Name */}
          <div style={row}>
            <div style={inputGroup}>
              <label style={labelStyle}>Phone Number</label>
              <input 
                style={inputStyle} 
                placeholder="+27..." 
                required 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})} 
              />
            </div>
            {role !== "customer" && (
              <div style={inputGroup}>
                <label style={labelStyle}>Company Name</label>
                <input 
                  style={inputStyle} 
                  placeholder="Elite Group" 
                  required 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})} 
                />
              </div>
            )}
          </div>

          {/* ROW 3: Corporate Specific Fields */}
          {role === "corporate_user" && (
            <div style={row}>
              <div style={inputGroup}>
                <label style={labelStyle}>Industry</label>
                <select 
                  style={inputStyle} 
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                >
                  <option>Property Management</option>
                  <option>Insurance Provider</option>
                  <option>Asset Management</option>
                </select>
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Portfolio Size</label>
                <input 
                  style={inputStyle} 
                  placeholder="e.g. 50+ Units" 
                  value={formData.portfolioSize}
                  onChange={e => setFormData({...formData, portfolioSize: e.target.value})} 
                />
              </div>
            </div>
          )}

          {/* ROW 4: Password (Hidden for Corporate) */}
          {role !== "corporate_user" && (
            <div style={{ ...inputGroup, width: "100%" }}>
              <label style={labelStyle}>Create Password</label>
              <input 
                style={inputStyle} 
                type="password" 
                placeholder="••••••••" 
                required 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          )}

          <button type="submit" style={goldBtn} disabled={loading}>
            {loading ? "Processing..." : role === "corporate_user" ? "Submit Application" : "Create My Account"}
          </button>
        </form>

        <p style={footerLink}>
          Already have an account? <Link to="/auth/login" style={linkGold}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

// STYLES (Aggressively tightened to remove dead space)
const pageContainer = { minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px 20px", fontFamily: "'Inter', sans-serif" };
const glassCard = { background: "#12141c", border: "1px solid rgba(197, 160, 89, 0.2)", borderRadius: "20px", padding: "25px 30px", width: "100%", maxWidth: "650px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" };
const headerSection = { textAlign: "center", marginBottom: "15px" };
const badge = { display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", padding: "4px 10px", borderRadius: "100px", fontSize: "10px", fontWeight: "800", marginBottom: "8px", letterSpacing: "1px" };
const goldTitle = { fontSize: "24px", fontWeight: "800", color: "#ffffff", margin: 0, fontFamily: "'Playfair Display', serif", lineHeight: "1.2" };
const subtitle = { color: "#94a3b8", fontSize: "13px", margin: "4px 0 0 0" };
const roleGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" };
const roleCard = { padding: "12px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", cursor: "pointer", transition: "all 0.3s ease" };
const activeRoleCard = { ...roleCard, background: "rgba(197, 160, 89, 0.08)", border: "1px solid #c5a059" };
const roleLabel = { fontSize: "13px", fontWeight: "700", color: "#fff", marginTop: "6px" };
const activeRoleLabel = { ...roleLabel, color: "#c5a059" };
const roleDesc = { fontSize: "11px", color: "#64748b", marginTop: "2px" };
const purpleIcon = { color: "#64748b" };
const goldIcon = { color: "#c5a059" };
const formStyle = { display: "flex", flexDirection: "column", gap: "15px" };
const row = { display: "flex", gap: "12px", width: "100%" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "6px", flex: 1 };
const labelStyle = { fontSize: "10px", fontWeight: "700", color: "#c5a059", textTransform: "uppercase", letterSpacing: "1px" };
const inputStyle = { background: "#0b0d17", border: "1px solid rgba(255,255,255,0.1)", padding: "12px", borderRadius: "8px", color: "#fff", fontSize: "13px", width: "100%", boxSizing: "border-box", outline: "none" };
const goldBtn = { marginTop: "5px", background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)", color: "#000000", border: "none", padding: "14px", borderRadius: "50px", fontWeight: "800", fontSize: "13px", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 10px 20px rgba(197, 160, 89, 0.2)", transition: "opacity 0.3s" };
const footerLink = { textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#94a3b8" };
const linkGold = { color: "#c5a059", fontWeight: "700", textDecoration: "none", marginLeft: "5px" };