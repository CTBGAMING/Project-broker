import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Hammer, Sparkles, LogOut } from "lucide-react";

export default function CustomerHome() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div style={containerStyle}>
      {/* LUXURY LOGOUT */}
      <button onClick={handleLogout} style={logoutBtnStyle}>
        <LogOut size={16} />
        Sign Out
      </button>

      {/* LEFT SIDE: CONSTRUCTION */}
      <div 
        style={panelStyle} 
        className="group"
        onClick={() => navigate("/customer/construction")}
      >
        <video style={videoStyle} autoPlay muted loop playsInline>
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        <div style={overlayDark} />
        
        <div style={contentStyle}>
          <div style={badgeStyle}><Hammer size={14} /> CONSTRUCTION</div>
          <h1 style={titleStyle}>The Master<br />Builder</h1>
          <p style={descStyle}>
            Renovations, repairs, and grand designs. Manage contractors 
            and secure your investment through elite escrow.
          </p>
          <button style={goldBtnStyle}>Enter Portal</button>
        </div>
      </div>

      {/* RIGHT SIDE: EVENTS */}
      <div 
        style={{...panelStyle, borderLeft: '1px solid rgba(197, 160, 89, 0.2)'}} 
        onClick={() => navigate("/customer/events")}
      >
        <video style={videoStyle} autoPlay muted loop playsInline>
          <source src="/events.mp4" type="video/mp4" />
        </video>
        <div style={overlayGoldTint} />

        <div style={contentStyle}>
          <div style={badgeStyle}><Sparkles size={14} /> EVENTS & PLANNING</div>
          <h1 style={titleStyle}>The Elegant<br />Occasion</h1>
          <p style={descStyle}>
            Weddings, corporate galas, and celebrations. Book bespoke 
            talent and venues in one secure destination.
          </p>
          <button style={goldBtnStyle}>Enter Portal</button>
        </div>
      </div>
    </div>
  );
}

/* =================================================
   PREMIUM STYLES
   ================================================= */

const containerStyle = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  background: '#0b0d17',
  position: 'relative'
};

const panelStyle = {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  overflow: 'hidden',
  transition: 'flex 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
};

const videoStyle = {
  position: 'absolute',
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 1
};

const overlayDark = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(11, 13, 23, 0.4), rgba(11, 13, 23, 0.9))',
  zIndex: 2
};

const overlayGoldTint = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(to bottom, rgba(11, 13, 23, 0.3), rgba(11, 13, 23, 0.85))',
  zIndex: 2
};

const contentStyle = {
  position: 'relative',
  zIndex: 10,
  textAlign: 'center',
  padding: '0 40px',
  maxWidth: '500px'
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 15px',
  borderRadius: '50px',
  background: 'rgba(197, 160, 89, 0.1)',
  border: '1px solid #c5a059',
  color: '#c5a059',
  fontSize: '11px',
  fontWeight: '800',
  letterSpacing: '2px',
  marginBottom: '20px',
  textTransform: 'uppercase'
};

const titleStyle = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '3.5rem',
  lineHeight: '1.1',
  color: '#ffffff',
  marginBottom: '20px'
};

const descStyle = {
  color: '#94a3b8',
  fontSize: '15px',
  lineHeight: '1.6',
  marginBottom: '30px',
  fontWeight: '400'
};

const goldBtnStyle = {
  padding: "14px 40px",
  borderRadius: "50px",
  border: "none",
  cursor: "pointer",
  fontWeight: "800",
  fontSize: "13px",
  letterSpacing: "2px",
  textTransform: "uppercase",
  color: "#000",
  background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
  boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
  transition: "transform 0.3s ease"
};

const logoutBtnStyle = {
  position: 'absolute',
  top: '40px',
  right: '40px',
  zIndex: 100,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(197, 160, 89, 0.3)',
  color: '#c5a059',
  padding: '10px 20px',
  borderRadius: '30px',
  cursor: 'pointer',
  fontWeight: '700',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backdropFilter: 'blur(10px)',
  textTransform: 'uppercase',
  letterSpacing: '1px'
};