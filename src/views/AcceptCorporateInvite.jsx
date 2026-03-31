import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AcceptCorporateInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invite, setInvite] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }

    loadInvite();
  }, [token]);

  async function loadInvite() {
    try {
      const { data, error } = await supabase
        .from("corporate_invites")
        .select("*")
        .eq("token", token)
        .single();

      if (error || !data) throw new Error("Invite not found.");

      if (data.status !== "pending")
        throw new Error("This invite has already been used.");

      if (new Date(data.expires_at) < new Date())
        throw new Error("This invite has expired.");

      setInvite(data);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  }

  async function acceptInvite() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate(`/auth?redirect=/accept-invite?token=${token}`);
        return;
      }

      // Check already linked
      const { data: existing } = await supabase
        .from("corporate_users")
        .select("id")
        .eq("corporate_id", invite.corporate_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from("corporate_users").insert({
          corporate_id: invite.corporate_id,
          user_id: user.id,
          role: invite.role,
        });
      }

      await supabase
        .from("corporate_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  if (loading) return <p>Loading invite…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: 40 }}>
      <h2>Accept Corporate Invitation</h2>

      <p>
        You’ve been invited to join a corporate account as{" "}
        <strong>{invite.role}</strong>.
      </p>

      <button onClick={acceptInvite}>Accept Invite</button>
    </div>
  );
}
