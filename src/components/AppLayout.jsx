import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo.png";

export default function AppLayout({ children }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <header
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "linear-gradient(90deg,#2b0033,#000)",
          color: "#fff",
        }}
      >
        {/* Logo / Home */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#d4af37",
            fontSize: 20,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
          aria-label="Project Broker home"
        >
          <img
            src={logo}
            alt="Project Broker"
            style={{ width: 28, height: 28, objectFit: "contain" }}
          />
          Project Broker
        </Link>

        {/* Actions */}
        <div style={{ display: "flex", gap: 16 }}>
          <Link to="/dashboard" style={{ color: "#fff" }}>
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: "#d4af37",
              border: "none",
              padding: "6px 12px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
