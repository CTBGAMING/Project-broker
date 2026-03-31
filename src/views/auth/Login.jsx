import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ShieldCheck, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    /**
     * IMPORTANT:
     * Do NOT route by role here.
     * Always let DashboardRouter decide.
     */
    navigate("/dashboard");
    setLoading(false);
  }

  return (
    <div style={pageContainer}>
      <div style={glassCard}>
        <div style={headerSection}>
          <div style={badge}><ShieldCheck size={14} /> SECURE LOGIN</div>
          <h1 style={goldTitle}>Welcome Back</h1>
          <p style={subtitle}>Sign in to your professional portal</p>
        </div>

        <form onSubmit={handleLogin} style={formStyle}>
          <div style={inputGroup}>
            <label style={labelStyle}>Email Address</label>
            <input 
              style={inputStyle} 
              type="email" 
              placeholder="admin@projectbroker.co.za" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Password</label>
            <input 
              style={inputStyle} 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div style={forgotPasswordRow}>
             <Link to="/auth/reset" style={linkPurple}>Forgot password?</Link>
          </div>

          <button type="submit" style={goldBtn} disabled={loading}>
            <Lock size={16} style={{ marginRight: '8px', marginBottom: '-2px' }} />
            {loading ? "Authenticating..." : "Sign In Securely"}
          </button>
        </form>

        <p style={footerLink}>
          Don't have an account? <Link to="/auth/register" style={linkGold}>Register Here</Link>
        </p>
      </div>
    </div>
  );
}

// STYLES (Perfectly matched to your updated Register page)
const pageContainer = { minHeight: "100vh", background: "#0b0d17", display: "flex", alignItems: "center", justifyContent: "center", padding: "100px 20px 40px", fontFamily: "'Inter', sans-serif" };
const glassCard = { background: "#12141c", border: "1px solid rgba(197, 160, 89, 0.2)", borderRadius: "24px", padding: "30px 40px", width: "100%", maxWidth: "450px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" };
const headerSection = { textAlign: "center", marginBottom: "20px" };
const badge = { display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", padding: "4px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", marginBottom: "10px", letterSpacing: "1px" };
const goldTitle = { fontSize: "28px", fontWeight: "800", color: "#ffffff", margin: 0, fontFamily: "'Playfair Display', serif" };
const subtitle = { color: "#94a3b8", fontSize: "14px", margin: "4px 0 0 0" };
const formStyle = { display: "flex", flexDirection: "column", gap: "20px" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "8px" };
const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#c5a059", textTransform: "uppercase", letterSpacing: "1px" };
const inputStyle = { background: "#0b0d17", border: "1px solid rgba(255,255,255,0.1)", padding: "14px", borderRadius: "10px", color: "#fff", fontSize: "14px", width: "100%", boxSizing: "border-box", outline: "none" };
const forgotPasswordRow = { display: "flex", justifyContent: "flex-end", marginTop: "-10px" };
const linkPurple = { color: "#94a3b8", fontSize: "13px", textDecoration: "none", transition: "color 0.3s" };
const goldBtn = { display: "flex", alignItems: "center", justifyContent: "center", marginTop: "10px", background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)", color: "#000000", border: "none", padding: "16px", borderRadius: "50px", fontWeight: "800", fontSize: "14px", letterSpacing: "1px", cursor: "pointer", boxShadow: "0 10px 20px rgba(197, 160, 89, 0.2)" };
const footerLink = { textAlign: "center", marginTop: "30px", fontSize: "14px", color: "#94a3b8" };
const linkGold = { color: "#c5a059", fontWeight: "700", textDecoration: "none", marginLeft: "5px" };