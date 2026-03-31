import "./auth.css";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navigation from "../../components/navigation"; // Pulls in your new global navbar

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function redirectIfLoggedIn() {
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      const session = sessionData?.session;

      // Not logged in -> allow auth pages
      if (!session || sessionErr) return;

      const userId = session.user.id;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, banned")
        .eq("id", userId)
        .single();

      if (cancelled) return;

      // If profile missing / banned -> do not redirect (stay on auth)
      if (error || !profile?.role || profile.banned) return;

      // ✅ Normalize role to avoid casing/spaces issues
      const role = String(profile.role).trim().toLowerCase();

      // ✅ IMPORTANT: send everyone through /dashboard so DashboardRouter decides
      if (role === "admin") {
        navigate("/dashboard/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }

    redirectIfLoggedIn();

    return () => {
      cancelled = true;
    };
  }, [navigate, location.pathname]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0d17", position: "relative" }}>
      {/* 1. We render the Navigation Bar here so it shows on all auth pages */}
      <Navigation />

      {/* 2. We render the Login or Register page cleanly without wrapping them in a second card */}
      <div style={{ position: "relative", zIndex: 10 }}>
        <Outlet />
      </div>
    </div>
  );
}