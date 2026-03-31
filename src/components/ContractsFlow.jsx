
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
export default function ContractsFlow({ jobId }){
  const [contract,setContract]=useState(null);
  async function load(){ const { data } = await supabase.from('contracts').select('*').eq('job_id', jobId).maybeSingle(); setContract(data); }
  useEffect(()=>{ if(jobId) load(); },[jobId]);
  async function create(){ const { error } = await supabase.from('contracts').insert([{ job_id: jobId, contract_text: 'Standard Project Broker contract', customer_id: null, contractor_id: null }]); if(error) return alert(error.message); load(); }
  async function sign(as){ const user = (await supabase.auth.getUser()).data.user; if(!user) return alert('Login required'); const payload = as==='customer' ? { signed_by_customer:true, signed_at_customer:new Date().toISOString() } : { signed_by_contractor:true, signed_at_contractor:new Date().toISOString() }; const { error } = await supabase.from('contracts').update(payload).eq('id', contract.id); if(error) return alert(error.message); load(); }
  if(!contract) return (<div className="card"><p>No contract yet</p><button onClick={create} className="btn-primary">Create Contract</button></div>);
  return (<div className="card"><pre className="bg-black/20 p-4 rounded">{contract.contract_text}</pre><div>Customer signed: {contract.signed_by_customer ? 'Yes':'No'}</div><div>Contractor signed: {contract.signed_by_contractor ? 'Yes':'No'}</div><div className="mt-2"><button onClick={()=>sign('customer')} className="btn-primary mr-2">Sign as Customer</button><button onClick={()=>sign('contractor')} className="btn-primary">Sign as Contractor</button></div></div>);
}
