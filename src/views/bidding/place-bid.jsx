
import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import BOQEditor from '../../components/BOQEditor.jsx';
import { useParams, useNavigate } from 'react-router-dom';

export default function PlaceBid(){
  const { adId } = useParams(); const [ad,setAd]=useState(null); const [amount,setAmount]=useState(''); const [days,setDays]=useState(''); const [boqItems,setBoqItems]=useState([]); const navigate = useNavigate();
  useEffect(()=>{ if(adId) load(); },[adId]);
  async function load(){ const { data } = await supabase.from('ads').select('*').eq('id', adId).single(); setAd(data); }
  function addLine(){ setBoqItems(prev=>[...prev,{item:'',qty:1,unit:'',rate:0}]); }
  const total = boqItems.reduce((s,l)=> s + (Number(l.qty||0)*Number(l.rate||0)), 0);
  const lock = ad && ad.bid_closes_at && (new Date(ad.bid_closes_at) - Date.now()) < 1000*60*60;
  async function submit(){ const { data:{ user } } = await supabase.auth.getUser(); if(!user) return alert('Login required'); const { error } = await supabase.from('bids').insert([{ ad_id: adId, contractor_id: user.id, amount, timeline_days: days, details: '' }]); if(error) return alert(error.message); const { error: qerr } = await supabase.from('contractor_boq').insert([{ ad_id: adId, contractor_id: user.id, items: JSON.stringify(boqItems), total }]); if(qerr) return alert(qerr.message); alert('Bid and BOQ submitted'); navigate('/dashboard/contractor'); }
  if(!ad) return <DashboardLayout role="contractor"><div className="p-6">Loading...</div></DashboardLayout>;
  return (<DashboardLayout role="contractor"><div className="max-w-2xl mx-auto card"><h3 className="text-xl font-semibold">Place bid for: {ad.category}</h3><p className="text-sm text-gray-300 mb-3">{ad.description}</p>{lock && <div className="p-3 bg-red-700 text-white rounded mb-3">BOQ edits locked (less than 1 hour before bids close)</div>}<label className="block mb-2">Amount<input type="number" className="w-full p-2 rounded" value={amount} onChange={e=>setAmount(e.target.value)} /></label><label className="block mb-2">Timeline (days)<input type="number" className="w-full p-2 rounded" value={days} onChange={e=>setDays(e.target.value)} /></label><div className="mb-4"><BOQEditor items={boqItems} setItems={setBoqItems} readOnly={lock} /></div><div className="text-right"><button onClick={submit} className="btn-primary" disabled={lock}>Submit Bid & BOQ</button></div></div></DashboardLayout>);
}
