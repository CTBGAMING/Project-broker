import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import UploadButton from "../../components/UploadButton.jsx";

const TABS = [
  ["marketplace", "Project Marketplace"],
  ["my_bids", "My Active Bids"],
  ["my_projects", "Won Projects"],
  ["messages", "Messages"],
  ["finances", "Finances"],
  ["reviews", "Reviews"],
  ["notifications", "Notifications"],
  ["profile", "Planner Profile"],
];

const money = (n) =>
  `R${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const lower = (s) => String(s || "").toLowerCase();

/* ---------------- PREMIUM DARK THEME STYLES ---------------- */
const styles = {
  pageContainer: { maxWidth: 1200, margin: "0 auto", padding: "0 10px", fontFamily: "'Inter', sans-serif" },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30, flexWrap: "wrap", gap: 20
  },
  logoHomeBtn: {
    display: "flex", alignItems: "center", gap: 10, textDecoration: "none", cursor: "pointer"
  },
  logoImg: {
    height: 48, width: "auto", objectFit: "contain"
  },
  tabs: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 },
  tabBtn: {
    padding: "10px 20px", borderRadius: 50, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)", color: "#94a3b8", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "0.3s"
  },
  activeTabBtn: {
    padding: "10px 20px", borderRadius: 50, border: "1px solid #c5a059",
    background: "rgba(197, 160, 89, 0.15)", color: "#c5a059", fontWeight: 800, fontSize: 13,
  },
  panel: {
    background: "#12141c", padding: 24, borderRadius: 20, marginBottom: 20,
    border: "1px solid rgba(197, 160, 89, 0.2)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  card: { 
    background: "#12141c", padding: 20, borderRadius: 16, marginBottom: 16, 
    border: "1px solid rgba(255,255,255,0.05)", position: "relative" 
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16
  },
  input: {
    width: "100%", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", outline: "none", fontSize: "14px"
  },
  select: {
    width: "100%", padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
    background: "#0b0d17", color: "#ffffff", outline: "none", fontSize: "14px", cursor: "pointer"
  },
  pill: {
    padding: "8px 16px", borderRadius: 50, border: "1px solid rgba(197, 160, 89, 0.3)",
    background: "transparent", color: "#c5a059", cursor: "pointer", fontSize: 12, fontWeight: 700,
  },
  submitBtn: {
    width: "100%", padding: 14, borderRadius: 50,
    background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
    fontWeight: 800, border: "none", cursor: "pointer", fontSize: 13, textTransform: "uppercase", letterSpacing: "1px",
    color: "#000", boxShadow: "0 4px 15px rgba(197, 160, 89, 0.2)", transition: "transform 0.2s"
  },
  badge: {
    padding: "6px 12px", borderRadius: 50, background: "rgba(197, 160, 89, 0.1)", color: "#c5a059", fontSize: 11, fontWeight: 800, display: "inline-block", textTransform: "uppercase", border: "1px solid rgba(197, 160, 89, 0.3)"
  },
  table: {
    width: "100%", borderCollapse: "collapse", color: "#fff", fontSize: 14
  },
  th: {
    textAlign: "left", padding: 14, borderBottom: "1px solid rgba(255,255,255,0.1)", color: "#c5a059", fontWeight: 800, textTransform: "uppercase", fontSize: 12
  },
  td: {
    padding: 14, borderBottom: "1px solid rgba(255,255,255,0.05)"
  },
  chatBox: {
    height: 400, overflowY: "auto", padding: 16, borderRadius: 16, background: "#0b0d17", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 12
  },
  msgBubbleMe: {
    maxWidth: "75%", padding: 12, borderRadius: 16, background: "rgba(197, 160, 89, 0.1)", border: "1px solid rgba(197, 160, 89, 0.2)", color: "#fff", marginLeft: "auto", fontSize: 14
  },
  msgBubbleOther: {
    maxWidth: "75%", padding: 12, borderRadius: 16, background: "#1e2235", border: "1px solid rgba(255,255,255,0.05)", color: "#fff", marginRight: "auto", fontSize: 14
  },
  photoGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 16
  },
  photoTile: {
    position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(197,160,89,0.3)", display: "block"
  },
  statCard: {
    background: "#0b0d17", padding: 20, borderRadius: 16, border: "1px solid rgba(255, 255, 255, 0.05)", textAlign: "center"
  },
  statValue: {
    fontSize: 32, fontFamily: "'Playfair Display', serif", color: "#c5a059", fontWeight: 800
  },
  statLabel: {
    fontSize: 12, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginTop: 8
  }
};

export default function EventPlannerDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("marketplace");
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);

  // data
  const [availableProjects, setAvailableProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [wonProjects, setWonProjects] = useState([]);

  // messaging
  const [msgProjectId, setMsgProjectId] = useState("");
  const [conversationIdByProject, setConversationIdByProject] = useState(new Map());
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);

  // photos
  const [photoKind, setPhotoKind] = useState("progress");
  const [photos, setPhotos] = useState([]);

  // bidding
  const [search, setSearch] = useState("");
  const [bidInputs, setBidInputs] = useState({});
  const [bidBusy, setBidBusy] = useState({});

  // finances
  const [contractorInvoices, setContractorInvoices] = useState([]);
  const [contractorFinances, setContractorFinances] = useState([]);
  const [escrows, setEscrows] = useState([]);

  // reviews/ratings
  const [ratings, setRatings] = useState([]);

  // notifications
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);

    const { data: authRes, error: authErr } = await supabase.auth.getUser();
    if (authErr) console.error(authErr);

    const user = authRes?.user;
    if (!user) {
      setMe(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setMe(user);

    // profile
    const prf = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (prf.error) console.error("Profile load error:", prf.error);
    setProfile(prf.data || null);

    // hard gate
    const role = String(prf.data?.role || "").toLowerCase();
    if (role !== "event_planner") {
      setLoading(false);
      return;
    }

    // --- marketplace (Events only; open + approved if you want that) ---
    const mp = await supabase
      .from("projects")
      .select(
        `id, owner_id, project_name, location, budget, description, created_at, status, category, admin_status, payment_status, awarded_contractor_id,
         metadata,
         bids(id, contractor_id, price, status, created_at)`
      )
      .eq("category", "Events")
      .eq("status", "open")
      .eq("admin_status", "approved")
      .order("created_at", { ascending: false });

    // --- my bids ---
    const bd = await supabase
      .from("bids")
      .select("id, project_id, contractor_id, price, status, created_at, projects(id, project_name, category, status, admin_status, metadata, location)")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    // --- won projects ---
    const won = await supabase
      .from("projects")
      .select(
        `id, owner_id, project_name, location, budget, description, created_at, status, category, admin_status, payment_status, bid_amount, awarded_at, awarded_contractor_id, metadata`
      )
      .eq("awarded_contractor_id", user.id)
      .eq("category", "Events")
      .order("awarded_at", { ascending: false });

    // --- contractor_invoices ---
    const cinv = await supabase
      .from("contractor_invoices")
      .select("id, contractor_id, project_id, escrow_id, invoice_number, file_url, amount, created_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    // --- contractor_finances ---
    const cfin = await supabase
      .from("contractor_finances")
      .select("id, contractor_id, escrow_id, amount, description, released_at, created_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    // --- escrow_transactions ---
    const esc = await supabase
      .from("escrow_transactions")
      .select(
        "id, project_id, contractor_id, customer_id, bid_id, tradesafe_status, tradesafe_reference, amount, currency, is_emergency, created_at, updated_at"
      )
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    // --- ratings ---
    const rt = await supabase
      .from("ratings")
      .select("id, project_id, rater_id, target_id, role_target, stars, review_text, created_at")
      .eq("target_id", user.id)
      .eq("role_target", "event_planner")
      .order("created_at", { ascending: false });

    // --- notifications (self) ---
    const nt = await supabase
      .from("notifications")
      .select("id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    // --- conversations (read only) ---
    const conv = await supabase
      .from("conversations")
      .select("id, project_id, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    // apply data
    setAvailableProjects(mp.data || []);
    setMyBids(bd.data || []);
    setWonProjects(won.data || []);
    setContractorInvoices(cinv.data || []);
    setContractorFinances(cfin.data || []);
    setEscrows(esc.data || []);
    setRatings(rt.data || []);
    setNotifications(nt.data || []);

    // map conversations by project
    const map = new Map();
    for (const c of conv.data || []) {
      if (c?.project_id) map.set(String(c.project_id), String(c.id));
    }
    setConversationIdByProject(map);

    // default messages project: first won project
    const firstWon = (won.data || [])[0]?.id;
    if (firstWon && !msgProjectId) setMsgProjectId(String(firstWon));

    // preload photos/messages
    if (firstWon) {
      await fetchProjectMedia(String(firstWon));
      await fetchMessagesForProject(String(firstWon), map);
    }

    setLoading(false);
  }

  // marketplace search filter
  const marketplaceFiltered = useMemo(() => {
    const q = lower(search).trim();
    return (availableProjects || []).filter((p) => {
      if (!q) return true;
      return lower(`${p.project_name} ${p.location} ${p.description} ${p.metadata?.event_type || ""}`).includes(q);
    });
  }, [availableProjects, search]);

  // ---------- BIDDING ----------
  const setBid = (pid, v) => setBidInputs((p) => ({ ...p, [pid]: v }));

  async function submitBid(projectId) {
    const amt = Number(bidInputs[projectId] || 0);
    if (!amt || amt <= 0) return alert("Enter a valid bid amount.");
    if (!me?.id) return alert("Please sign in.");

    setBidBusy((p) => ({ ...p, [projectId]: true }));

    const ex = await supabase
      .from("bids")
      .select("id")
      .eq("project_id", projectId)
      .eq("contractor_id", me.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (ex.error) {
      setBidBusy((p) => ({ ...p, [projectId]: false }));
      return alert(ex.error.message);
    }

    // UPDATED LOGIC: If a bid already exists, do NOT allow an update. Alert the user instead.
    if (ex.data?.[0]?.id) {
      setBidBusy((p) => ({ ...p, [projectId]: false }));
      return alert("You have already placed a bid on this project.");
    } else {
      const { error } = await supabase
        .from("bids")
        .insert([{ project_id: projectId, contractor_id: me.id, price: amt, status: "pending" }]);

      if (error) alert(error.message);
    }

    await loadAll();
    setBidBusy((p) => ({ ...p, [projectId]: false }));
  }

  // ---------- PROJECT MEDIA ----------
  async function fetchProjectMedia(projectId) {
    const res = await supabase
      .from("project_media")
      .select("id, project_id, uploaded_by, file_url, media_type, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (res.error) console.error(res.error);
    setPhotos(res.data || []);
  }

  async function onPhoto(url) {
    const pid = msgProjectId || wonProjects?.[0]?.id;
    if (!url || !pid || !me?.id) return;

    const { error } = await supabase.from("project_media").insert([
      {
        project_id: String(pid),
        uploaded_by: me.id,
        file_url: url,
        media_type: photoKind || "image",
      },
    ]);

    if (error) return alert(error.message);
    fetchProjectMedia(String(pid));
  }

  // ---------- MESSAGES ----------
  useEffect(() => {
    if (!msgProjectId) return;
    fetchProjectMedia(String(msgProjectId));
    fetchMessagesForProject(String(msgProjectId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgProjectId]);

  async function fetchMessagesForProject(projectId, existingMap) {
    const map = existingMap || conversationIdByProject;
    const convId = map.get(String(projectId));

    if (!convId) {
      setMsgs([]);
      return;
    }

    const res = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, message, file_url, file_type, is_read, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(500);

    if (res.error) console.error(res.error);
    setMsgs(res.data || []);
  }

  async function sendMessage() {
    const text = msgText.trim();
    if (!text || !me?.id || !msgProjectId) return;

    const convId = conversationIdByProject.get(String(msgProjectId));
    if (!convId) {
      return alert(
        "No conversation exists yet for this project. Create/backfill conversations + participants, or allow the parties to create them (RLS)."
      );
    }

    setMsgSending(true);
    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: convId,
        sender_id: me.id,
        message: text,
      },
    ]);
    setMsgSending(false);

    if (error) return alert(error.message);

    setMsgText("");
    fetchMessagesForProject(String(msgProjectId));
  }

  // ---------- FINANCE SUMMARY ----------
  const finance = useMemo(() => {
    const escrowTotal = (escrows || []).reduce((s, e) => s + Number(e.amount || 0), 0);
    const releasedTotal = (contractorFinances || []).reduce((s, r) => s + Number(r.amount || 0), 0);
    const invoiceTotal = (contractorInvoices || []).reduce((s, i) => s + Number(i.amount || 0), 0);
    return { escrowTotal, releasedTotal, invoiceTotal };
  }, [escrows, contractorFinances, contractorInvoices]);

  const ratingSummary = useMemo(() => {
    const c = (ratings || []).length;
    const avg = c ? ratings.reduce((s, r) => s + Number(r.stars || 0), 0) / c : 0;
    return { c, avg };
  }, [ratings]);

  // ---------- UI STATES ----------
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0b0d17", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#c5a059", fontFamily: "'Playfair Display', serif" }}>Loading Planner Portal…</div>
          <div style={{ marginTop: 10, color: "#94a3b8" }}>Fetching your bids, projects, and messages.</div>
        </div>
      </div>
    );
  }

  if (!profile || String(profile.role || "").toLowerCase() !== "event_planner") {
    return (
      <div style={{ padding: 50, textAlign: "center", color: "white", background: "#0b0d17", minHeight: "100vh" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#ef4444" }}>Access Denied</h2>
        <p style={{ color: "#94a3b8" }}>This portal is reserved for verified Event Planners.</p>
      </div>
    );
  }

  return (
    <DashboardLayout title="Event Planner Portal">
      <div style={styles.pageContainer}>
        
        {/* HEADER WITH LOGO */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a onClick={(e) => { e.preventDefault(); navigate("/"); }} href="/" style={styles.logoHomeBtn}>
              {/* Replace /logo.png with your actual logo path */}
              <img src="/logo.png" alt="Project Broker Logo" style={styles.logoImg} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
              <span style={{ display: "none", fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#c5a059", fontWeight: 900, letterSpacing: "-1px" }}>PB.</span>
            </a>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#fff", margin: 0, fontSize: 28 }}>Event Planner Portal</h1>
              <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 4 }}>Welcome back, {profile.full_name || "Planner"}.</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", color: "#c5a059", fontWeight: 800 }}>{myBids.length}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>My Bids</div>
            </div>
            <div style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", color: "#c5a059", fontWeight: 800 }}>{wonProjects.length}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>Won</div>
            </div>
            <button onClick={loadAll} style={{ ...styles.pill, marginLeft: 10 }}>
              Refresh
            </button>
          </div>
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={tab === k ? styles.activeTabBtn : styles.tabBtn}>
              {label}
            </button>
          ))}
        </div>

        {/* MARKETPLACE */}
        {tab === "marketplace" && (
          <div style={styles.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20, alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#fff" }}>Project Marketplace</h2>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Approved & open Events available for bidding.</div>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} style={{...styles.input, maxWidth: 300}} placeholder="Search projects..." />
            </div>

            {marketplaceFiltered.length === 0 ? (
              <div style={styles.card}>
                <b style={{ color: "#fff" }}>No approved events available for bidding yet.</b>
              </div>
            ) : (
              <div style={styles.grid}>
                {marketplaceFiltered.map((p) => {
                  const bids = p.bids || [];
                  const yourBid = bids.find((b) => String(b.contractor_id) === String(me.id));

                  return (
                    <div key={p.id} style={styles.card}>
                      <div style={styles.badge}>{p.metadata?.event_type || "Event"}</div>

                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{p.project_name || "Untitled"}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                          Location: {p.location || "TBD"} • Status: <span style={{color: "#c5a059", textTransform: "uppercase"}}>{p.status || "—"}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: 12, color: "#cbd5e1", fontSize: 13, lineHeight: 1.5, background: "rgba(255,255,255,0.02)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                        {p.metadata?.description || p.description || "No description provided."}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16, fontSize: 13, color: "#94a3b8" }}>
                        <div><b style={{color: "#fff"}}>Date:</b> {p.metadata?.event_date || "TBD"}</div>
                        <div><b style={{color: "#fff"}}>Guests:</b> {p.metadata?.guest_count || "N/A"}</div>
                        <div><b style={{color: "#fff"}}>Budget:</b> <span style={{color: "#4ade80"}}>{p.metadata?.budget ? money(p.metadata.budget) : p.budget ? money(p.budget) : "Negotiable"}</span></div>
                        <div><b style={{color: "#fff"}}>Total Bids:</b> {bids.length}</div>
                      </div>

                      {/* UPDATED UI: Hide inputs if already bid */}
                      {yourBid ? (
                        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(197, 160, 89, 0.1)", border: "1px solid rgba(197, 160, 89, 0.2)", fontSize: 13, color: "#fff" }}>
                          You have already placed a bid of <b style={{ color: "#c5a059", fontSize: 15 }}>{money(yourBid.price)}</b>.
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                          <input style={styles.input} value={bidInputs[p.id] || ""} onChange={(e) => setBid(p.id, e.target.value)} placeholder="Your bid (ZAR)" type="number" />
                          <button style={{...styles.submitBtn, width: "auto", padding: "0 24px"}} disabled={!!bidBusy[p.id]} onClick={() => submitBid(p.id)}>
                            {bidBusy[p.id] ? "Saving…" : "Submit"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MY BIDS */}
        {tab === "my_bids" && (
          <div style={styles.panel}>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>My Active Bids</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Event Name</th>
                    <th style={styles.th}>My Bid</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {myBids.map((bid) => (
                    <tr key={bid.id}>
                      <td style={styles.td}>{bid.projects?.project_name || bid.project_id}</td>
                      <td style={{...styles.td, color: "#c5a059", fontWeight: 700}}>{money(bid.price)}</td>
                      <td style={styles.td}>
                        <span style={String(bid.status) === "pending" ? { padding: "4px 10px", borderRadius: 50, background: "rgba(255,255,255,0.05)", color: "#94a3b8", fontSize: 11, fontWeight: 800, textTransform: "uppercase" } : { padding: "4px 10px", borderRadius: 50, background: "rgba(197, 160, 89, 0.2)", color: "#c5a059", fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
                          {bid.status}
                        </span>
                      </td>
                      <td style={{...styles.td, color: "#94a3b8"}}>{bid.created_at ? new Date(bid.created_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                  {myBids.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ ...styles.td, color: "#94a3b8", textAlign: "center", padding: 20 }}>
                        You have no active bids yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WON PROJECTS */}
        {tab === "my_projects" && (
          <div style={styles.panel}>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Won Projects</h2>
            <div style={{ color: "#94a3b8", marginBottom: 20, fontSize: 13 }}>Projects awarded to you (Events only).</div>
            
            {wonProjects.length === 0 ? (
              <div style={styles.card}>
                <b style={{ color: "#fff" }}>No won projects yet.</b>
              </div>
            ) : (
              <div style={styles.grid}>
                {wonProjects.map((p) => (
                  <div key={p.id} style={styles.card}>
                    <div style={{ fontWeight: 900, color: "#fff", fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{p.project_name || "Untitled"}</div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 12, lineHeight: 1.8 }}>
                      <strong>Status:</strong> <span style={{color: "#c5a059", textTransform: "uppercase"}}>{p.status || "—"}</span><br/>
                      <strong>Payment:</strong> {p.payment_status || "—"}<br/>
                      <strong>Bid Amount:</strong> {p.bid_amount ? money(p.bid_amount) : "—"}
                    </div>
                    <button 
                      style={{ ...styles.submitBtn, marginTop: 16, background: "rgba(255,255,255,0.05)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "none" }} 
                      onClick={() => { setMsgProjectId(String(p.id)); setTab("messages"); }}
                    >
                      Open Workspace
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MESSAGES + PHOTOS */}
        {tab === "messages" && (
          <div style={styles.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16, alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Project Workspace</h2>
                <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 4 }}>Chat and share photos for your won projects.</div>
              </div>
              <select value={msgProjectId} onChange={(e) => setMsgProjectId(e.target.value)} style={{...styles.select, width: "auto", minWidth: 240}}>
                <option value="" disabled>Select a won project…</option>
                {wonProjects.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.project_name || p.id}</option>
                ))}
              </select>
            </div>

            {!msgProjectId ? (
              <div style={styles.card}>
                <b style={{ color: "#fff" }}>Please select a project above to view messages.</b>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* PHOTOS AREA */}
                <div style={styles.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <b style={{ color: "#c5a059", fontSize: 14, textTransform: "uppercase", fontWeight: 800 }}>Project Media</b>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <select value={photoKind} onChange={(e) => setPhotoKind(e.target.value)} style={{...styles.select, padding: "10px 14px", width: "auto"}}>
                        <option value="before">Before</option>
                        <option value="progress">Progress</option>
                        <option value="after">After</option>
                      </select>
                      <UploadButton folder={`projects/${msgProjectId}`} label="Upload Photo" onUpload={onPhoto} />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 16 }}>
                    {photos.length === 0 ? (
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>No photos uploaded yet.</div>
                    ) : (
                      <div style={styles.photoGrid}>
                        {photos.slice(0, 12).map((ph) => (
                          <a key={ph.id} href={ph.file_url} target="_blank" rel="noreferrer" style={styles.photoTile}>
                            <img src={ph.file_url} alt="project" style={{ width: "100%", height: 100, objectFit: "cover" }} />
                            <div style={{ position: "absolute", bottom: 6, left: 6, padding: "4px 8px", borderRadius: 4, background: "rgba(0,0,0,0.8)", color: "#c5a059", fontSize: 9, fontWeight: 900, textTransform: "uppercase" }}>
                              {ph.media_type || "image"}
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CHAT AREA */}
                <div style={styles.card}>
                  <b style={{ color: "#c5a059", fontSize: 14, textTransform: "uppercase", fontWeight: 800, display: "block", marginBottom: 12 }}>Conversation</b>
                  <div style={styles.chatBox}>
                    {(() => {
                      const convId = conversationIdByProject.get(String(msgProjectId));
                      if (!convId) return <div style={{ color: "#94a3b8", textAlign: "center", marginTop: 20 }}>No conversation exists yet for this project.</div>;
                      if (msgs.length === 0) return <div style={{ color: "#94a3b8", textAlign: "center", marginTop: 20 }}>No messages yet. Say hello!</div>;
                      
                      return msgs.map((m) => {
                        const isMe = String(m.sender_id) === String(me?.id);
                        return (
                          <div key={m.id} style={isMe ? styles.msgBubbleMe : styles.msgBubbleOther}>
                            <div style={{ fontWeight: 800, fontSize: 11, marginBottom: 4, color: isMe ? "#c5a059" : "#94a3b8", textTransform: "uppercase" }}>
                              {isMe ? "You" : "Customer"}
                            </div>
                            {m.message}
                          </div>
                        );
                      });
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                    <input 
                      style={styles.input} 
                      value={msgText} 
                      onChange={(e) => setMsgText(e.target.value)} 
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type your message..." 
                      disabled={msgSending}
                    />
                    <button style={{ ...styles.submitBtn, width: "auto", padding: "0 30px" }} onClick={sendMessage} disabled={msgSending || !msgText.trim()}>
                      {msgSending ? "..." : "Send"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINANCES */}
        {tab === "finances" && (
          <div style={styles.panel}>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Financial Overview</h2>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 30 }}>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{money(finance.escrowTotal)}</div>
                <div style={styles.statLabel}>Funds in Escrow</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{money(finance.releasedTotal)}</div>
                <div style={styles.statLabel}>Total Released</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statValue}>{money(finance.invoiceTotal)}</div>
                <div style={styles.statLabel}>Total Invoiced</div>
              </div>
            </div>

            <h3 style={{ color: "#c5a059", fontFamily: "'Playfair Display', serif", marginBottom: 16 }}>Escrow Transactions</h3>
            <div style={{ overflowX: "auto", marginBottom: 30 }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Reference</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.length === 0 ? (
                    <tr><td colSpan={4} style={{...styles.td, textAlign: "center", color: "#94a3b8"}}>No escrow records found.</td></tr>
                  ) : (
                    escrows.map(e => (
                      <tr key={e.id}>
                        <td style={styles.td}>{e.tradesafe_reference || "—"}</td>
                        <td style={{...styles.td, color: "#4ade80", fontWeight: 700}}>{money(e.amount)}</td>
                        <td style={styles.td}><span style={styles.badge}>{e.tradesafe_status || "Pending"}</span></td>
                        <td style={{...styles.td, color: "#94a3b8"}}>{new Date(e.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === "reviews" && (
          <div style={styles.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
              <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>My Reviews</h2>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#c5a059" }}>{ratingSummary.avg.toFixed(1)} <span style={{fontSize: 14, color: "#94a3b8"}}>/ 5.0</span></div>
                <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>Based on {ratingSummary.c} reviews</div>
              </div>
            </div>

            {ratings.length === 0 ? (
              <div style={styles.card}>
                <b style={{ color: "#fff" }}>You don't have any reviews yet.</b>
              </div>
            ) : (
              <div style={styles.grid}>
                {ratings.map((r) => (
                  <div key={r.id} style={styles.card}>
                    <div style={{ color: "#c5a059", fontSize: 20, marginBottom: 12, letterSpacing: "2px" }}>
                      {"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}
                    </div>
                    <div style={{ color: "#fff", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>"{r.review_text}"</div>
                    <div style={{ color: "#94a3b8", fontSize: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>{new Date(r.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div style={styles.panel}>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Notifications</h2>
            
            {notifications.length === 0 ? (
              <div style={styles.card}>
                <b style={{ color: "#fff" }}>You're all caught up!</b>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: 16, borderRadius: 12, background: n.is_read ? "#0b0d17" : "rgba(197, 160, 89, 0.1)", border: n.is_read ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(197, 160, 89, 0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <strong style={{ color: n.is_read ? "#fff" : "#c5a059", fontSize: 15 }}>{n.title}</strong>
                      <span style={{ color: "#94a3b8", fontSize: 12 }}>{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: "#cbd5e1", fontSize: 14 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE */}
        {tab === "profile" && (
          <div style={styles.panel}>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Planner Profile</h2>
            <div style={styles.card}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, color: "#fff" }}>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Full Name</div>
                  <div style={{ fontSize: 16, marginTop: 6, fontWeight: 600 }}>{profile.full_name || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Email</div>
                  <div style={{ fontSize: 16, marginTop: 6, fontWeight: 600 }}>{me?.email || "—"}</div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Role</div>
                  <div style={{ fontSize: 14, marginTop: 6, textTransform: "uppercase", color: "#c5a059", fontWeight: 800, padding: "4px 10px", background: "rgba(197, 160, 89, 0.1)", display: "inline-block", borderRadius: 4 }}>
                    {profile.role?.replace("_", " ") || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", fontWeight: 800 }}>Account ID</div>
                  <div style={{ fontSize: 14, marginTop: 6, color: "#94a3b8", fontFamily: "monospace" }}>{me?.id || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}