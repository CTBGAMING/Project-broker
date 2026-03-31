import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const TABS = [
  { key: "available", label: "Available Events" },
  { key: "bids", label: "My Bids" },
  { key: "jobs", label: "My Jobs" },
  { key: "profile", label: "Profile" },
];

export default function EventVendorDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("available");
  const [loading, setLoading] = useState(true);

  const [availableEvents, setAvailableEvents] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  const [bidInputs, setBidInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // --------------------------------------------------
  // LOAD USER + PROFILE
  // --------------------------------------------------
  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

      setUser(data.user);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (!error) setProfile(profile);
      setLoading(false);
    }

    loadUser();
  }, []);

  // --------------------------------------------------
  // LOAD AVAILABLE EVENTS (FIXED QUERY)
  // --------------------------------------------------
  useEffect(() => {
    if (!profile) return;

    async function loadEvents() {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          status,
          project_event_details (
            event_name,
            event_date,
            location,
            description
          )
        `)
        .eq("project_type", "event")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (!error) setAvailableEvents(data || []);
    }

    loadEvents();
  }, [profile]);

  // --------------------------------------------------
  // LOAD BIDS + JOBS
  // --------------------------------------------------
  useEffect(() => {
    if (!user) return;

    async function loadBids() {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          id,
          price,
          status,
          project_id,
          projects (
            status,
            project_event_details (
              event_name,
              event_date,
              location
            )
          )
        `)
        .eq("contractor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return;

      setMyBids(data || []);

      const jobs =
        data?.filter(
          (b) =>
            b.status === "accepted" &&
            ["awarded", "in_progress", "completed"].includes(
              b.projects?.status
            )
        ) || [];

      setMyJobs(jobs);
    }

    loadBids();
  }, [user]);

  // --------------------------------------------------
  // SUBMIT BID
  // --------------------------------------------------
  async function submitBid(projectId) {
    const price = bidInputs[projectId];
    if (!price) {
      alert("Enter a bid amount");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("bids").insert({
      project_id: projectId,
      contractor_id: user.id,
      price,
      status: "pending",
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Bid submitted");
      setBidInputs((p) => ({ ...p, [projectId]: "" }));
    }

    setSubmitting(false);
  }

  // --------------------------------------------------
  // ACCESS CONTROL
  // --------------------------------------------------
  if (loading) return <p>Loading vendor dashboard…</p>;
  if (!profile || profile.role !== "EventVendor")
    return <p>Access denied</p>;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <h2>Event Vendor Dashboard</h2>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 24,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={
              activeTab === tab.key
                ? "button-gold"
                : "button-outline"
            }
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AVAILABLE EVENTS */}
      {activeTab === "available" && (
        <div className="card">
          <h3>Available Events</h3>

          {availableEvents.length === 0 && (
            <p className="muted">No events available.</p>
          )}

          {availableEvents.map((e) => {
            const d = e.project_event_details?.[0];

            return (
              <div
                key={e.id}
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                  marginTop: 14,
                }}
              >
                <strong>{d?.event_name}</strong>
                <div>Date: {d?.event_date}</div>
                <div>Location: {d?.location}</div>

                <input
                  type="number"
                  placeholder="Bid amount"
                  value={bidInputs[e.id] || ""}
                  onChange={(ev) =>
                    setBidInputs((p) => ({
                      ...p,
                      [e.id]: ev.target.value,
                    }))
                  }
                  style={{ marginTop: 10 }}
                />

                <button
                  className="button-gold"
                  onClick={() => submitBid(e.id)}
                  disabled={submitting}
                  style={{ marginTop: 10 }}
                >
                  Submit Bid
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MY BIDS */}
      {activeTab === "bids" && (
        <div className="card">
          <h3>My Bids</h3>

          {myBids.map((b) => {
            const d = b.projects?.project_event_details?.[0];

            return (
              <div
                key={b.id}
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                  marginTop: 14,
                }}
              >
                <strong>{d?.event_name}</strong>
                <div>Bid: R {b.price}</div>
                <div>Status: {b.status}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* MY JOBS */}
      {activeTab === "jobs" && (
        <div className="card">
          <h3>My Jobs</h3>

          {myJobs.length === 0 && (
            <p className="muted">No active jobs.</p>
          )}

          {myJobs.map((j) => {
            const d = j.projects?.project_event_details?.[0];

            return (
              <div
                key={j.id}
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: 14,
                  marginTop: 14,
                }}
              >
                <strong>{d?.event_name}</strong>
                <div>Status: {j.projects?.status}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* PROFILE */}
      {activeTab === "profile" && (
        <div className="card">
          <h3>My Profile</h3>
          <div>Name: {profile.full_name}</div>
          <div>Email: {profile.email}</div>
          <div>Status: {profile.verification_status}</div>
        </div>
      )}
    </div>
  );
}
