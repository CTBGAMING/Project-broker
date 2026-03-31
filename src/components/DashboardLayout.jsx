import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";
import { LogOut, ArrowLeft } from "lucide-react"; // Adding some premium icons

export default function DashboardLayout({ title, children }) {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0d17", fontFamily: "'Inter', sans-serif" }}>
      {/* PREMIUM HEADER */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          background: "rgba(11, 13, 23, 0.95)", // Deep navy with slight transparency
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(197, 160, 89, 0.15)", // Subtle gold border
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* LOGO */}
        <div
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
          aria-label="Project Broker home"
        >
          {/* Using the updated transparent logo, sized perfectly for the dashboard header */}
          <img
            src={logo}
            alt="Project Broker"
            style={{ height: 45, width: "auto", objectFit: "contain", transform: "scale(1.2)", transformOrigin: "left center" }}
          />
        </div>

        {/* NAVIGATION BUTTONS */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <button 
            onClick={() => navigate(-1)}
            style={navBtn}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button 
            onClick={logout}
            style={navBtn}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* DASHBOARD CONTENT WRAPPER */}
      <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Title */}
        <div style={{ marginBottom: 30, paddingBottom: 15, borderBottom: "1px solid rgba(197, 160, 89, 0.1)" }}>
          <h1 style={{ 
            fontFamily: "'Playfair Display', serif", 
            color: "#ffffff", 
            fontSize: "2.2rem",
            margin: 0,
            letterSpacing: "1px"
          }}>
            {title}
          </h1>
        </div>
        
        {/* Dashboard Components Inject Here */}
        {children}
      </main>
    </div>
  );
}

// STYLES
const navBtn = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 16px",
  borderRadius: "50px",
  border: "1px solid rgba(197, 160, 89, 0.3)",
  background: "#1e2235",
  color: "#c5a059",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "13px",
  letterSpacing: "0.5px",
  transition: "all 0.3s ease",
};