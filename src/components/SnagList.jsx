
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import UploadButton from './UploadButton.jsx';
export default function SnagList({ adId }){
  const [items,setItems]=useState([]); const [text,setText]=useState(''); const [photos,setPhotos]=useState([]);
  useEffect(()=>{ if(adId) load(); },[adId]);
  async function load(){ const { data } = await supabase.from('snag_list').select('*').eq('ad_id', adId).order('created_at',{ascending:false}); setItems(data||[]); }
  async function create(){ const user = (await supabase.auth.getUser()).data.user; const { error } = await supabase.from('snag_list').insert([{ ad_id: adId, inspector_id: user?.id || null, description: text, photos }]); if(error) return alert(error.message); setText(''); setPhotos([]); load(); }
  async function resolve(id){ const { error } = await supabase.from('snag_list').update({ is_resolved:true, resolved_at: new Date().toISOString() }).eq('id', id); if(error) return alert(error.message); load(); }
  return (<div className="card"><h4>Snag List</h4><textarea value={text} onChange={e=>setText(e.target.value)} className="w-full p-2 mb-2"/><div className="mb-2"><UploadButton folder={`snags/${adId}`} onUpload={(url)=>setPhotos(p=>[...p,url])} label="Add Photo" /></div><div className="flex gap-2 mb-3">{photos.map((p,i)=>(<img key={i} src={p} className="w-20 h-20 object-cover rounded"/>) )}</div><div><button onClick={create} className="btn-primary">Create Snag</button></div><div className="mt-4">{items.map(i=> (<div key={i.id} className="p-2 border rounded mb-2"><div>{i.description}</div><div>Resolved: {i.is_resolved ? 'Yes':'No'}</div>{!i.is_resolved && <button onClick={()=>resolve(i.id)} className="px-2 py-1 rounded bg-green-600 mt-2">Mark Resolved</button>}</div>))}</div></div>);
}
