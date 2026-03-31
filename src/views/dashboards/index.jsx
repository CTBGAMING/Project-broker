import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate, Navigate } from "react-router-dom"; // ✅ Added Navigate here

// Customer landing
import CustomerHome from "../customer/Home";

// Dashboards
import ContractorDashboard from "./ContractorDashboard";
import InspectorDashboard from "./InspectorDashboard";
import ScoperDashboard from "./scoper";
import CorporateDashboard from "./corporate";
import EventPlannerDashboard from "./EventPlannerDashboard";

export default function DashboardRouter() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        navigate("/auth/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("id, role, banned")
        .eq("id", session.user.id)
        .single();

      if (cancelled) return;

      if (error || !data?.role || data.banned) {
        navigate("/auth/login", { replace: true });
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) return <p className="p-6">Loading dashboard…</p>;
  if (!profile) return <p className="p-6">Profile not found</p>;

  const role = String(profile.role).trim().toLowerCase();

  switch (role) {
    case "admin":
      // ✅ Using the safe, native React Router Navigate component to prevent loops
      return <Navigate to="/dashboard/admin" replace />;

    case "customer":
      return <CustomerHome />;

    case "contractor":
      return <ContractorDashboard />;

    case "inspector":
      return <InspectorDashboard />;

    case "scoper":
      return <ScoperDashboard />;

    case "corporate_user":
    case "corporate_admin":
      return <CorporateDashboard />;

    case "event_planner":
      return <EventPlannerDashboard />;

    default:
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold">Access issue</h2>
          <p>Unknown role: <b>{profile.role}</b></p>
        </div>
      );
  }
}