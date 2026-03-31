import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, ArrowRight, Shield } from "lucide-react";

export default function ProjectCheckout() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("projects").select("*").eq("id", projectId).single();
      if (data) setProject(data);
      setLoading(false);
    }
    load();
  }, [projectId]);

  if (loading) return <div style={{textAlign: 'center', padding: 100, color: '#fff'}}>Loading...</div>;

  return (
    <div style={container}>
      <header style={{textAlign: 'center', marginBottom: 30}}>
        <Shield color="#D4AF37" size={40} style={{margin: '0 auto 15px'}} />
        <h1 style={title}>Activate Event</h1>
        <p style={subtitle}>{project?.project_name}</p>
      </header>

      <div style={premiumCard}>
        <div style={goldBadge}>STEP 1: LISTING FEE</div>
        <h2 style={{color: '#fff', fontSize: '22px', marginBottom: 10}}>Activate Your Listing</h2>
        <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: 20}}>
          Pay the R50 administrative fee to go live and start receiving bids from planners.
        </p>
        
        <div style={invoice}>
          <div style={row}><span>Listing Activation</span><span>R 50.00</span></div>
          <div style={totalRow}><span>Total Due</span><span>R 50.00</span></div>
        </div>

        <form action="https://sandbox.payfast.co.za/eng/process" method="post">
          <input type="hidden" name="merchant_id" value="10000100" />
          <input type="hidden" name="merchant_key" value="46f0cd694581a" />
          <input type="hidden" name="amount" value="50.00" />
          <input type="hidden" name="item_name" value={`Listing: ${project?.project_name}`} />
          
          {/* CRITICAL: Tell PayFast where to go back to */}
          <input type="hidden" name="return_url" value={`${window.location.origin}/payment-success?id=${projectId}`} />
          <input type="hidden" name="cancel_url" value={`${window.location.origin}/payment-cancel`} />
          
          <button type="submit" style={payBtn}>
            Pay R50 via PayFast <ArrowRight size={18} />
          </button>
        </form>

        <div style={{textAlign: 'center', color: '#475569', fontSize: '11px', marginTop: 20}}>
          <Lock size={10} /> Secure Encryption via PayFast
        </div>
      </div>
    </div>
  );
}

// STYLES
const container = { maxWidth: '450px', margin: '60px auto', padding: '20px' };
const title = { color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0 };
const subtitle = { color: '#94a3b8', marginTop: 5 };
const premiumCard = { background: '#1e293b', padding: '40px', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' };
const goldBadge = { background: '#D4AF37', color: '#1a0b2e', fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '12px', display: 'inline-block', marginBottom: '15px' };
const invoice = { background: 'rgba(15, 23, 42, 0.6)', padding: '20px', borderRadius: '20px', marginBottom: '25px' };
const row = { display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '10px' };
const totalRow = { display: 'flex', justifyContent: 'space-between', fontWeight: '900', color: '#fff', fontSize: '20px', borderTop: '1px solid #334155', paddingTop: '10px' };
const payBtn = { width: '100%', padding: '18px', borderRadius: '15px', background: '#fff', color: '#000', border: 'none', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 };