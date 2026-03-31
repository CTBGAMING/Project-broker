import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile?.role) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const role = String(profile.role).trim().toLowerCase();
    if (role !== "admin") {
      alert("Unauthorized access");
      navigate("/", { replace: true });
      return;
    }

    setLoading(false);
  }

  if (loading) return <div style={{ padding: 40 }}>Verifying Admin Access...</div>;

  const menuItems = [
    { label: "Project Overview", path: "/dashboard/admin/projects" },
    { label: "User Management", path: "/dashboard/admin/users" },
    { label: "Scoper Assignments", path: "/dashboard/admin/assignments" },
    { label: "Scoper Database", path: "/dashboard/admin/scopers" },
    { label: "Corporate Vetting", path: "/dashboard/admin/approvals" },
    { label: "Inspection Fees", path: "/dashboard/admin/inspection-fees" },
    { label: "Coupon Manager", path: "/dashboard/admin/coupons" },
    { label: "Platform Financials", path: "/dashboard/admin/settings" },
  ];

  return (
    <div style={layoutContainer}>
      {/* SIDEBAR */}
      <aside style={sidebar}>
        <div style={logoArea}>
          <div style={logoIcon}>A</div>
          <span style={logoText}>Admin Panel</span>
        </div>

        <nav style={navStack}>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                style={isActive ? activeNavLink : navLink}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => supabase.auth.signOut().then(() => navigate("/", { replace: true }))}
          style={logoutBtn}
        >
          Sign Out
        </button>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main style={mainArea}>
        <Outlet />
      </main>
    </div>
  );
}

/* =======================
   STYLES
======================= */
const layoutContainer = { display: "flex", minHeight: "100vh", background: "#0b1220" };

const sidebar = {
  width: "280px",
  background: "#0f172a",
  color: "#fff",
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  padding: "28px 18px",
  borderRight: "1px solid rgba(255,255,255,0.08)",
};

const logoArea = { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 };
const logoIcon = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "#D4AF37",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 900,
};
const logoText = { fontSize: 16, fontWeight: 900 };

const navStack = { display: "flex", flexDirection: "column", gap: 8, marginTop: 16 };

const navLink = {
  padding: "12px 12px",
  borderRadius: 12,
  color: "rgba(255,255,255,0.85)",
  textDecoration: "none",
  fontWeight: 800,
};

const activeNavLink = {
  ...navLink,
  background: "rgba(212,175,55,0.18)",
  color: "#D4AF37",
  border: "1px solid rgba(212,175,55,0.30)",
};

const logoutBtn = {
  marginTop: "auto",
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  background: "transparent",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.14)",
  cursor: "pointer",
  fontWeight: 900,
};

const mainArea = {
  flex: 1,
  marginLeft: "280px",
  padding: "34px",
  background: "radial-gradient(1200px 600px at 20% 0%, rgba(212,175,55,0.08), transparent 60%)",
};