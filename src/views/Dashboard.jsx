import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

import CustomerDashboard from "./dashboards/CustomerDashboard";
import ContractorDashboard from "./dashboards/ContractorDashboard";
import AdminDashboard from "./dashboards/AdminDashboard";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    setUser(session.user);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Profile load error:", error);
      setLoading(false);
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  if (loading) return <p>Loading dashboard…</p>;
  if (!user || !profile) return <p>No profile found</p>;

  if (profile.role === "Contractor") {
    return <ContractorDashboard user={user} profile={profile} />;
  }

  if (profile.role === "Admin") {
    return <AdminDashboard user={user} profile={profile} />;
  }

  return <CustomerDashboard user={user} profile={profile} />;
}
