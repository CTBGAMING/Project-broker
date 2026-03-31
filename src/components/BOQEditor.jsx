
import React from 'react';
export default function BOQEditor({ items, setItems, readOnly=false }){
  function addLine(){ setItems(prev=>[...prev,{item:'',qty:1,unit:'',rate:0}]); }
  function update(i,k,v){ const a=[...items]; a[i][k]=v; setItems(a); }
  function remove(i){ setItems(prev=>prev.filter((_,idx)=>idx!==i)); }
  const total = items.reduce((s,l)=> s + (Number(l.qty||0)*Number(l.rate||0)), 0);
  return (<div><h4 className="font-semibold mb-2">BOQ</h4>{items.map((l,i)=>(<div key={i} className="mb-2 grid grid-cols-4 gap-2"><input placeholder='Item' value={l.item} onChange={e=>update(i,'item',e.target.value)} disabled={readOnly} className="p-2 rounded"/><input type="number" value={l.qty} onChange={e=>update(i,'qty',e.target.value)} disabled={readOnly} className="p-2 rounded"/><input placeholder='Unit' value={l.unit} onChange={e=>update(i,'unit',e.target.value)} disabled={readOnly} className="p-2 rounded"/><input type="number" value={l.rate} onChange={e=>update(i,'rate',e.target.value)} disabled={readOnly} className="p-2 rounded"/></div>))}{!readOnly && <div className="mt-2"><button type="button" onClick={addLine} className="px-3 py-2 rounded bg-white/10">Add Line</button></div>}<div className="mt-3 text-right">Total: R{total.toFixed(2)}</div></div>);
}
