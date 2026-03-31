import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import UploadButton from "../../components/UploadButton.jsx";

const TABS = [
  ["available", "Available Projects"],
  ["my", "My Projects"],
  ["messages", "Messages"],
  ["finances", "Finances"],
  ["reviews", "Reviews"],
  ["notifications", "Notifications"],
  ["legal", "⚖️ Legal & T&Cs"],
];

const money = (n) =>
  `R${Number(n || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const lower = (s) => String(s || "").toLowerCase();

export default function ContractorDashboard() {
  const [tab, setTab] = useState("available");
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);
  const [profileRole, setProfileRole] = useState(null);

  // data
  const [projects, setProjects] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contractorInvoices, setContractorInvoices] = useState([]);
  const [contractorFinances, setContractorFinances] = useState([]);
  const [escrows, setEscrows] = useState([]);

  const [ratings, setRatings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // UI States
  const [expandedProjects, setExpandedProjects] = useState({});

  // browse/bid
  const [search, setSearch] = useState("");
  const [bidInputs, setBidInputs] = useState({});
  const [bidBusy, setBidBusy] = useState({});

  // messages
  const [msgProjectId, setMsgProjectId] = useState("");
  const [conversationIdByProject, setConversationIdByProject] = useState(new Map());
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState("");
  const [msgSending, setMsgSending] = useState(false);

  // photos via project_media
  const [photoKind, setPhotoKind] = useState("progress");
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setLoading(true);

    const { data, error } = await supabase.auth.getUser();
    if (error) console.error(error);
    const user = data?.user;

    if (!user) {
      setMe(null);
      setLoading(false);
      return;
    }

    setMe(user);

    let role = null;
    const prf = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
    if (!prf.error) {
      role = prf.data?.role || null;
      setProfileRole(role);
    }

    const pr = await supabase
      .from("projects")
      .select(
        `id, owner_id, project_name, location, budget, description, metadata, created_at, status, category, admin_status, payment_status, awarded_contractor_id,
         bids(id, contractor_id, price, status, created_at)`
      )
      .order("created_at", { ascending: false });

    const my = await supabase
      .from("projects")
      .select(
        `id, owner_id, project_name, location, budget, description, metadata, created_at, status, category, admin_status, payment_status, bid_amount, awarded_at, awarded_contractor_id`
      )
      .eq("awarded_contractor_id", user.id)
      .order("awarded_at", { ascending: false });

    const inv = await supabase
      .from("invoices")
      .select("id, project_id, contractor_id, base_amount, status, created_at, paid_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    const cinv = await supabase
      .from("contractor_invoices")
      .select("id, contractor_id, project_id, escrow_id, invoice_number, file_url, amount, created_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    const cfin = await supabase
      .from("contractor_finances")
      .select("id, contractor_id, escrow_id, amount, description, released_at, created_at")
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    const esc = await supabase
      .from("escrow_transactions")
      .select(
        "id, project_id, contractor_id, customer_id, bid_id, tradesafe_status, tradesafe_reference, amount, currency, is_emergency, created_at, updated_at"
      )
      .eq("contractor_id", user.id)
      .order("created_at", { ascending: false });

    const rt = await supabase
      .from("ratings")
      .select("id, project_id, rater_id, target_id, role_target, stars, review_text, created_at")
      .eq("target_id", user.id)
      .in("role_target", ["contractor", "Contractor"])
      .order("created_at", { ascending: false });

    const nt = await supabase
      .from("notifications")
      .select("id, user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    const conv = await supabase
      .from("conversations")
      .select("id, project_id, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    const allProjects = pr.data || [];
    const mine = my.data || [];
    const filteredProjects = allProjects.filter((p) => p.category === "Construction");

    setProjects(filteredProjects);
    setMyProjects(mine);
    setInvoices(inv.data || []);
    setContractorInvoices(cinv.data || []);
    setContractorFinances(cfin.data || []);
    setEscrows(esc.data || []);
    setRatings(rt.data || []);
    setNotifications(nt.data || []);

    const map = new Map();
    for (const c of conv.data || []) {
      if (c?.project_id) map.set(String(c.project_id), String(c.id));
    }
    setConversationIdByProject(map);

    const firstMy = mine[0]?.id;
    if (firstMy && !msgProjectId) setMsgProjectId(String(firstMy));
    if (firstMy) await fetchProjectMedia(String(firstMy));

    setLoading(false);
  }

  const available = useMemo(() => {
    const q = lower(search).trim();
    return (projects || [])
      .filter((p) => !p.awarded_contractor_id)
      .filter((p) => {
        const closed = p.metadata?.bidding_closed || (p.metadata?.bid_deadline && new Date(p.metadata.bid_deadline) <= new Date());
        if (closed) return false;
        if (!q) return true;
        const scope = lower(p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "");
        return lower(`${p.project_name} ${p.location} ${p.category} ${scope}`).includes(q);
      });
  }, [projects, search]);

  function toggleProjectDetails(id) {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  }

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

    if (ex.data?.[0]?.id) {
      const { error } = await supabase
        .from("bids")
        .update({ price: amt, status: "pending" })
        .eq("id", ex.data[0].id)
        .eq("contractor_id", me.id);
      if (error) alert(error.message);
    } else {
      const { error } = await supabase
        .from("bids")
        .insert([{ project_id: projectId, contractor_id: me.id, price: amt, status: "pending" }]);
      if (error) alert(error.message);
    }

    await loadAll();
    setBidBusy((p) => ({ ...p, [projectId]: false }));
  }

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
    const pid = msgProjectId || myProjects?.[0]?.id;
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

  useEffect(() => {
    if (!msgProjectId) return;
    fetchMessagesForProject(msgProjectId);
    fetchProjectMedia(String(msgProjectId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgProjectId]);

  async function fetchMessagesForProject(projectId) {
    const convId = conversationIdByProject.get(String(projectId));
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
      return alert("No conversation exists yet for this project. Ask an admin to enable conversation creation.");
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
    fetchMessagesForProject(msgProjectId);
  }

  const finance = useMemo(() => {
    const escrowTotal = escrows.reduce((s, e) => s + Number(e.amount || 0), 0);
    const releasedTotal = contractorFinances.reduce((s, r) => s + Number(r.amount || 0), 0);
    const invoiceTotal = contractorInvoices.reduce((s, i) => s + Number(i.amount || 0), 0);
    return { escrowTotal, releasedTotal, invoiceTotal };
  }, [escrows, contractorFinances, contractorInvoices]);

  const ratingSummary = useMemo(() => {
    const c = ratings.length;
    const avg = c ? ratings.reduce((s, r) => s + Number(r.stars || 0), 0) / c : 0;
    return { c, avg };
  }, [ratings]);

  function getTimeRemaining(p) {
    if (p.metadata?.bidding_closed) return "Bidding closed";
    const deadlineStr = p.metadata?.bid_deadline;
    if (!deadlineStr) return "Open";
    const diff = new Date(deadlineStr) - new Date();
    if (diff <= 0) return "Bidding closed";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours > 24) return `Closes in ${Math.floor(hours / 24)} days`;
    return `Closes in ${hours} hours`;
  }

  if (loading) {
    return (
      <DashboardLayout title="Contractor Portal">
        <div style={{ padding: 16, color: "#fff" }}>Loading…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Contractor Portal">
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px" }}>
        
        {/* TAB NAVIGATION */}
        <div style={tabsRow}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={tab === k ? tabBtnActive : tabBtn}>
              {label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={loadAll} style={darkBtn}>
            Refresh Data
          </button>
        </div>

        {/* ======================= AVAILABLE PROJECTS ======================= */}
        {tab === "available" && (
          <div>
            <div style={rowBetween}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif", letterSpacing: "1px" }}>Browse & Bid</h2>
                <div style={muted}>Construction projects currently accepting quotes.</div>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)} style={input} placeholder="Search projects…" />
            </div>

            {available.length === 0 ? (
              <Card>
                <b style={{ marginTop: 10, display: "block", color: "#c5a059" }}>No available projects found.</b>
              </Card>
            ) : (
              available.map((p) => {
                const bids = p.bids || [];
                const yourBid = bids.find((b) => String(b.contractor_id) === String(me.id));
                const isExpanded = !!expandedProjects[p.id];
                const estLow = Number(p.metadata?.expected_cost_low || 0);
                const estHigh = Number(p.metadata?.expected_cost_high || 0);

                return (
                  <Card key={p.id}>
                    <div style={rowBetween}>
                      <div>
                        <b style={{ fontSize: 18, color: "#ffffff" }}>{p.project_name || "Untitled"}</b>
                        
                        <div style={{ color: "#94a3b8", marginTop: 6, display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                          <span>{p.location || "No location"}</span>
                          <span style={{color: "#c5a059"}}>•</span>
                          <span style={{ fontWeight: 800, color: "#fcf6ba" }}>
                            {getTimeRemaining(p)}
                          </span>
                        </div>
                        
                        {(estLow > 0 || estHigh > 0) && (
                          <div style={{ color: "#c5a059", marginTop: 8, fontSize: 13, fontWeight: 700 }}>
                            🤖 AI Expected Cost: {money(estLow)} – {money(estHigh)}
                          </div>
                        )}

                        <button 
                          style={{ ...pill, marginTop: 14 }} 
                          onClick={() => toggleProjectDetails(p.id)}
                        >
                          {isExpanded ? "Hide scope ↑" : "Read full scope ↓"}
                        </button>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#94a3b8", fontSize: 14 }}>
                          <b style={{ color: "#fff" }}>{bids.length}</b> bid(s)
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={expandedScopeBox}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                          <div>
                            <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Services Requested:</strong><br/>
                            <span style={{color: "#e2e8f0", lineHeight: 1.8}}>
                              {p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 
                                ? Object.keys(p.metadata.categories).join(", ") 
                                : "—"}
                            </span>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Project Scope / Notes:</strong><br/>
                            <div style={{ whiteSpace: "pre-wrap", marginTop: 6, color: "#e2e8f0", lineHeight: 1.6 }}>
                              {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <hr style={divider} />

                    {yourBid ? (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                        <button disabled style={disabledBtn}>
                          Bid Submitted: {money(yourBid.price)} 🔒
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <input
                          style={{ ...input, padding: "12px 16px" }}
                          type="number"
                          value={bidInputs[p.id] || ""}
                          onChange={(e) => setBid(p.id, e.target.value)}
                          placeholder="Your bid (ZAR)"
                        />
                        <button style={goldBtn} disabled={!!bidBusy[p.id]} onClick={() => submitBid(p.id)}>
                          {bidBusy[p.id] ? "Saving…" : "Submit Bid"}
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ======================= MY PROJECTS ======================= */}
        {tab === "my" && (
          <div>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>My Projects (Won)</h2>
            <div style={muted}>Projects awarded to you.</div>

            {myProjects.length === 0 ? (
              <Card>
                <b style={{ marginTop: 10, display: "block", color: "#c5a059" }}>No projects awarded to you yet.</b>
              </Card>
            ) : (
              myProjects.map((p) => {
                const isExpanded = !!expandedProjects[p.id];

                return (
                  <Card key={p.id}>
                    <div style={rowBetween}>
                      <div>
                        <b style={{ fontSize: 18, color: "#fff" }}>{p.project_name || "Untitled"}</b>
                        <div style={{...muted, marginTop: 6}}>
                          {p.location || "No location"} • <span style={{color: "#fcf6ba"}}>{p.bid_amount ? `Awarded at ${money(p.bid_amount)}` : "Awarded"}</span>
                        </div>
                        <div style={{...tiny, marginTop: 8}}>
                          Status: <span style={{ textTransform: "capitalize", color: "#fff" }}>{p.status || "—"}</span> | Payment: {p.payment_status || "—"} | Category: {p.category || "—"}
                        </div>
                        
                        <button 
                          style={{ ...pill, marginTop: 14 }} 
                          onClick={() => toggleProjectDetails(p.id)}
                        >
                          {isExpanded ? "Hide scope ↑" : "Review scope ↓"}
                        </button>
                      </div>
                      
                      <button
                        style={darkBtn}
                        onClick={() => {
                          setMsgProjectId(String(p.id));
                          setTab("messages");
                        }}
                      >
                        Open Messages
                      </button>
                    </div>

                    {isExpanded && (
                      <div style={expandedScopeBox}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                          <div>
                            <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Services Requested:</strong><br/>
                            <span style={{color: "#e2e8f0"}}>{p.metadata?.categories && Object.keys(p.metadata.categories).length > 0 ? Object.keys(p.metadata.categories).join(", ") : "—"}</span>
                          </div>
                          <div style={{ marginTop: 10 }}>
                            <strong style={{ color: '#c5a059', textTransform: "uppercase", fontSize: 12, letterSpacing: "1px" }}>Project Scope / Notes:</strong><br/>
                            <div style={{ whiteSpace: "pre-wrap", marginTop: 4, color: "#e2e8f0", lineHeight: 1.6 }}>
                              {p.metadata?.description || p.description || p.metadata?.tender?.sow_markdown || "No specific details provided."}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* ======================= MESSAGES ======================= */}
        {tab === "messages" && (
          <div>
            <div style={rowBetween}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Messages & Media</h2>
                <div style={muted}>Communication & progress tracking for your active projects.</div>
              </div>
              <select value={msgProjectId} onChange={(e) => setMsgProjectId(e.target.value)} style={select}>
                <option value="" disabled>Select a project…</option>
                {myProjects.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.project_name || p.id}</option>
                ))}
              </select>
            </div>

            {!msgProjectId ? (
              <Card>
                <b style={{ marginTop: 10, display: "block", color: "#c5a059" }}>Select a project above to view messages.</b>
              </Card>
            ) : (
              <>
                <Card>
                  <b style={{color: "#fff", fontSize: 16}}>Project Photos</b>
                  <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <select value={photoKind} onChange={(e) => setPhotoKind(e.target.value)} style={selectSmall}>
                      <option value="before">Before</option>
                      <option value="progress">Progress</option>
                      <option value="after">After</option>
                    </select>
                    <UploadButton folder={`projects/${msgProjectId}`} label="Upload photo" onUpload={onPhoto} />
                  </div>

                  <div style={{ marginTop: 16 }}>
                    {photos.length === 0 ? (
                      <div style={muted}>No photos uploaded yet.</div>
                    ) : (
                      <div style={photoGrid}>
                        {photos.slice(0, 12).map((ph) => (
                          <a key={ph.id} href={ph.file_url} target="_blank" rel="noreferrer" style={photoTile}>
                            <img
                              src={ph.file_url}
                              alt="project"
                              style={{ width: "100%", height: 120, objectFit: "cover" }}
                            />
                            <div style={photoTag}>{ph.media_type || "image"}</div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                <Card>
                  <div style={chatBox}>
                    {(() => {
                      const convId = conversationIdByProject.get(String(msgProjectId));
                      if (!convId) {
                        return (
                          <div style={{...muted, textAlign: "center", marginTop: 40}}>
                            No conversation exists yet for this project.
                          </div>
                        );
                      }
                      if (msgs.length === 0) return <div style={{...muted, textAlign: "center", marginTop: 40}}>No messages yet. Start the conversation below.</div>;

                      return msgs.map((m) => (
                        <div key={m.id} style={String(m.sender_id) === String(me.id) ? msgMe : msgThem}>
                          <div style={{ fontWeight: 800, color: String(m.sender_id) === String(me.id) ? "#c5a059" : "#fff", fontSize: 12, marginBottom: 4 }}>
                            {String(m.sender_id) === String(me.id) ? "You" : "Client / Admin"}
                          </div>
                          <div style={{ lineHeight: 1.5, fontSize: 14 }}>{m.message}</div>
                          <div style={{...tiny, marginTop: 6, opacity: 0.7}}>{new Date(m.created_at).toLocaleString()}</div>
                        </div>
                      ));
                    })()}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 15, flexWrap: "wrap" }}>
                    <input
                      style={{ ...input, flex: 1, minWidth: 240 }}
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder="Type a message…"
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button style={goldBtn} disabled={msgSending} onClick={sendMessage}>
                      {msgSending ? "Sending…" : "Send Message"}
                    </button>
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {/* ======================= FINANCES ======================= */}
        {tab === "finances" && (
          <div>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Financial Overview</h2>
            <div style={muted}>Track your escrowed funds, released payments, and submitted invoices.</div>

            <div style={grid3}>
              <Card>
                <b style={{color: "#c5a059", textTransform: "uppercase", fontSize: 12, letterSpacing: "1px"}}>Secured in Escrow</b>
                <div style={big}>{money(finance.escrowTotal)}</div>
                <div style={tiny}>Funds locked via TradeSafe</div>
              </Card>
              <Card>
                <b style={{color: "#10b981", textTransform: "uppercase", fontSize: 12, letterSpacing: "1px"}}>Released to You</b>
                <div style={big}>{money(finance.releasedTotal)}</div>
                <div style={tiny}>Total paid out to your account</div>
              </Card>
              <Card>
                <b style={{color: "#94a3b8", textTransform: "uppercase", fontSize: 12, letterSpacing: "1px"}}>Uploaded Invoices</b>
                <div style={big}>{money(finance.invoiceTotal)}</div>
                <div style={tiny}>Total value of invoices submitted</div>
              </Card>
            </div>

            <Card>
              <b style={{color: "#fff", fontSize: 16}}>Latest Escrow Transactions</b>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {escrows.length === 0 ? (
                  <div style={muted}>No escrow transactions found.</div>
                ) : (
                  escrows.slice(0, 10).map((e) => (
                    <div key={e.id} style={listRow}>
                      <div>
                        <b style={{color: "#c5a059", fontSize: 16}}>{money(e.amount)}</b>
                        <div style={{...tiny, color: "#fff"}}>Status: <span style={{color: "#fcf6ba"}}>{e.tradesafe_status || "—"}</span></div>
                        <div style={tiny}>Project: {String(e.project_id).slice(0, 8)}…</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={tiny}>{new Date(e.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <b style={{color: "#fff", fontSize: 16}}>Released Payments</b>
              <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                {contractorFinances.length === 0 ? (
                  <div style={muted}>No released finance records yet.</div>
                ) : (
                  contractorFinances.slice(0, 10).map((r) => (
                    <div key={r.id} style={listRow}>
                      <div>
                        <b style={{color: "#10b981", fontSize: 16}}>{money(r.amount)}</b>
                        <div style={{...tiny, color: "#fff"}}>{r.description || "—"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={tiny}>{new Date(r.released_at || r.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ======================= REVIEWS ======================= */}
        {tab === "reviews" && (
          <div>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>My Reviews</h2>
            <div style={{...muted, fontSize: 16}}>
              Average rating: <b style={{color: "#fcf6ba"}}>{ratingSummary.avg.toFixed(1)}</b> ({ratingSummary.c} rating(s))
            </div>

            {ratings.length === 0 ? (
              <Card>
                <b style={{ marginTop: 10, display: "block", color: "#c5a059" }}>No ratings yet.</b>
              </Card>
            ) : (
              <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
                {ratings.map((r) => (
                  <Card key={r.id}>
                    <div style={rowBetween}>
                      <b style={{fontSize: 18}}>Rating: {"⭐".repeat(Math.max(1, Math.min(5, Number(r.stars || 0))))}</b>
                      <div style={tiny}>{new Date(r.created_at).toLocaleString()}</div>
                    </div>
                    {r.review_text && <div style={{ marginTop: 12, color: "#e2e8f0", lineHeight: 1.6, fontStyle: "italic" }}>"{r.review_text}"</div>}
                    <div style={{...tiny, marginTop: 12}}>Project: {String(r.project_id).slice(0, 8)}…</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= NOTIFICATIONS ======================= */}
        {tab === "notifications" && (
          <div>
            <div style={rowBetween}>
              <div>
                <h2 style={{ margin: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Notifications</h2>
                <div style={muted}>Alerts regarding your bids and projects.</div>
              </div>
              <button style={darkBtn} onClick={loadAll}>Refresh</button>
            </div>

            {notifications.length === 0 ? (
              <Card>
                <b style={{ marginTop: 10, display: "block", color: "#c5a059" }}>No notifications yet.</b>
              </Card>
            ) : (
              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {notifications.slice(0, 50).map((n) => (
                  <Card key={n.id}>
                    <div style={rowBetween}>
                      <div>
                        <b style={{color: "#fff", fontSize: 16}}>
                          {n.title || "Notification"} {!n.is_read && <span style={{ color: "#fcf6ba", marginLeft: 8 }}>(New)</span>}
                        </b>
                        {n.message && <div style={{ marginTop: 8, color: "#cbd5e1", lineHeight: 1.5 }}>{n.message}</div>}
                        <div style={{...tiny, marginTop: 8}}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================= LEGAL ======================= */}
        {tab === "legal" && (
          <div>
            <h2 style={{ marginTop: 0, color: "#fff", fontFamily: "'Playfair Display', serif" }}>Platform Policies & Agreements</h2>
            <div style={muted}>
              Below are the agreements you consented to when registering for Project Broker. 
              These protect both you and the customers on our platform.
            </div>

            <Card>
              <div style={legalContent}>
                <div style={legalSectionTitle}>1. Contractor Terms of Use (Platform Agreement)</div>
                <strong style={{color: "#fff"}}>1.1. Independent Status</strong>
                <p>You operate as an independent contractor. You are not an employee, partner, or agent of Project Broker. You are solely responsible for your own taxes, UIF, workers' compensation, and liability insurance.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#fff" }}>1.2. Platform Circumvention</strong>
                <p>You agree not to bypass the Project Broker platform or TradeSafe escrow system. Attempting to solicit direct payment from a Customer introduced through the platform will result in immediate account suspension and potential legal action to recover lost commission.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#fff" }}>1.3. Limitation of Liability</strong>
                <p>Project Broker is a lead-generation and escrow-facilitation tool. We do not guarantee you will win bids, nor do we guarantee the behavior or financial solvency of the Customers. You agree to hold Project Broker harmless for any unpaid invoices, property damage, or disputes arising with a Customer.</p>
              </div>

              <div style={legalContent}>
                <div style={legalSectionTitle}>2. Customer & Contractor Direct Service Agreement</div>
                <p style={{color: "#c5a059"}}><em>(This contract takes effect the moment a Customer accepts your bid)</em></p>
                <strong style={{ display: "block", marginTop: 12, color: "#fff" }}>2.1. Parties</strong>
                <p>This agreement is made directly between the Customer and the Contractor. Project Broker is not a party to this agreement.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#fff" }}>2.2. Scope of Work</strong>
                <p>The Contractor agrees to perform the services detailed in the accepted project listing, including any materials, labor, and timelines specified in the bid and platform messages.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#fff" }}>2.3. Warranties and Liability</strong>
                <p>The Contractor warrants that all work will be performed in a professional, workmanlike manner and in compliance with all applicable South African building codes and regulations (including issuing COCs where applicable by law). The Contractor holds the Customer harmless against any claims arising from the Contractor's negligence.</p>
              </div>

              <div style={legalContent}>
                <div style={legalSectionTitle}>3. POPIA Privacy Policy</div>
                <strong style={{color: "#fff"}}>3.1. Introduction</strong>
                <p>Project Broker respects your privacy and is committed to protecting your personal information in accordance with the Protection of Personal Information Act (POPIA) of South Africa.</p>
                
                <strong style={{ display: "block", marginTop: 16, color: "#fff" }}>3.2. Information We Collect & Share</strong>
                <p>We collect identity data, location data for project sites, and financial data necessary to facilitate secure escrow payments via TradeSafe (including FICA compliance). Your data is only shared with the specific Customer whose project you bid on, our escrow partner TradeSafe, or legal authorities if required by law.</p>
              </div>
            </Card>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

// ============================================================================
// STYLES (Updated to Premium Dark & Gold Theme)
// ============================================================================

function Card({ children }) {
  return (
    <div
      style={{
        background: "#12141c", // Dark glassmorphism background
        padding: 24,
        borderRadius: 16,
        border: "1px solid rgba(197, 160, 89, 0.2)", // Subtle gold border
        marginBottom: 16,
        marginTop: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      {children}
    </div>
  );
}

const tabsRow = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 24 };

const tabBtn = {
  padding: "10px 18px",
  borderRadius: 50,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0b0d17",
  color: "#94a3b8",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: "0.5px",
  transition: "all 0.3s"
};

const tabBtnActive = {
  ...tabBtn,
  background: "rgba(197, 160, 89, 0.1)", // Gold tint
  border: "1px solid #c5a059",
  color: "#c5a059",
};

const input = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0b0d17",
  color: "#ffffff",
  outline: "none",
  minWidth: 260,
  fontSize: 14,
};

const select = { ...input, cursor: "pointer" };

const selectSmall = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "#0b0d17",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer"
};

const goldBtn = {
  padding: "12px 24px",
  borderRadius: 50,
  border: "none",
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#000000",
  background: "linear-gradient(135deg, #b38728 0%, #fcf6ba 45%, #c5a059 55%, #b38728 100%)",
  boxShadow: "0 4px 15px rgba(197, 160, 89, 0.2)"
};

const darkBtn = {
  padding: "10px 20px",
  borderRadius: 50,
  border: "1px solid rgba(197, 160, 89, 0.3)",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
  background: "#1e2235",
  color: "#c5a059",
  transition: "all 0.3s"
};

const disabledBtn = {
  ...goldBtn,
  background: "rgba(255,255,255,0.05)",
  color: "#94a3b8",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "none",
  cursor: "not-allowed"
};

const pill = {
  padding: "8px 16px",
  borderRadius: 50,
  border: "1px solid rgba(197, 160, 89, 0.3)",
  background: "transparent",
  color: "#c5a059",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const rowBetween = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const muted = { color: "#94a3b8", fontSize: 14, marginTop: 4 };
const tiny = { fontSize: 12, color: "#94a3b8", marginTop: 6 };
const big = { fontSize: 26, fontWeight: 800, color: "#ffffff", marginTop: 12, fontFamily: "'Playfair Display', serif" };

const grid3 = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: 16,
  marginTop: 16,
  marginBottom: 16,
};

const listRow = {
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(197, 160, 89, 0.1)",
  background: "#0b0d17",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
};

const expandedScopeBox = {
  marginTop: 16, 
  padding: 20, 
  borderRadius: 12, 
  background: "#0b0d17", 
  border: "1px dashed rgba(197, 160, 89, 0.4)", 
  fontSize: 14, 
};

const divider = {
  border: "none", 
  borderTop: "1px solid rgba(255,255,255,0.05)", 
  margin: "20px 0"
};

const photoGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginTop: 12 };
const photoTile = {
  position: "relative",
  display: "block",
  borderRadius: 12,
  overflow: "hidden",
  border: "1px solid rgba(197, 160, 89, 0.3)",
  background: "#0b0d17",
};
const photoTag = {
  position: "absolute",
  left: 8,
  bottom: 8,
  padding: "4px 8px",
  borderRadius: 6,
  background: "rgba(11, 13, 23, 0.85)",
  border: "1px solid rgba(197, 160, 89, 0.4)",
  color: "#c5a059",
  fontWeight: 800,
  fontSize: 10,
  textTransform: "uppercase"
};

const chatBox = {
  height: 400,
  overflow: "auto",
  padding: 16,
  borderRadius: 12,
  border: "1px solid rgba(197, 160, 89, 0.2)",
  background: "#0b0d17",
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const msgBase = { maxWidth: "75%", padding: "12px 16px", borderRadius: 16 };
const msgMe = { ...msgBase, marginLeft: "auto", background: "rgba(197, 160, 89, 0.15)", color: "#ffffff", border: "1px solid rgba(197, 160, 89, 0.3)", borderBottomRightRadius: 4 };
const msgThem = { ...msgBase, marginRight: "auto", background: "#1e2235", color: "#ffffff", border: "1px solid rgba(255,255,255,0.05)", borderBottomLeftRadius: 4 };

const linkBtn = {
  display: "inline-block",
  marginTop: 8,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid rgba(197, 160, 89, 0.3)",
  background: "transparent",
  fontWeight: 700,
  fontSize: 12,
  textDecoration: "none",
  color: "#c5a059",
}; 

const legalContent = {
  padding: 24,
  background: "#0b0d17",
  borderRadius: 12,
  border: "1px solid rgba(197, 160, 89, 0.2)",
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.7,
  marginBottom: 20,
};

const legalSectionTitle = {
  fontSize: 18,
  fontWeight: 800,
  color: "#c5a059",
  fontFamily: "'Playfair Display', serif",
  marginTop: 10,
  marginBottom: 16,
};