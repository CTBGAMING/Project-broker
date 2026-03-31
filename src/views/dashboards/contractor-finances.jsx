import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import { supabase } from "../../lib/supabase.js";
import UploadButton from "../../components/UploadButton.jsx";

/*
  Contractor Finances Page
  - Shows totals from contractor_finances, invoices, contractor_boq as applicable
  - Allows uploading receipts/invoices
  - Simple SVG earnings sparkline (small)
  - Export CSV
*/

function formatZAR(n){
  return `R${Number(n||0).toLocaleString('en-ZA', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
}

export default function ContractorFinances(){
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [balance, setBalance] = useState(0);
  const [withdrawable, setWithdrawable] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll(){
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if(!userId){ setLoading(false); return; }

    // finances: positive = earnings, negative = expense
    const { data: finData, error: finErr } = await supabase
      .from('contractor_finances')
      .select('*')
      .eq('contractor_id', userId)
      .order('created_at', { ascending: true });

    // invoices
    const { data: invData } = await supabase
      .from('invoices')
      .select('*')
      .eq('contractor_id', userId)
      .order('created_at', { ascending: false });

    // compute totals
    const totalEarnings = (finData || []).reduce((s,row)=> s + (row.type==='earning' ? Number(row.amount||0) : 0), 0);
    const totalExpenses = (finData || []).reduce((s,row)=> s + (row.type==='expense' ? Number(row.amount||0) : 0), 0);
    const pending = (finData || []).filter(r=> r.type==='pending').reduce((s,row)=> s + Number(row.amount||0), 0);

    setFinances(finData || []);
    setInvoices(invData || []);
    setBalance(totalEarnings - totalExpenses);
    setWithdrawable((totalEarnings - totalExpenses) - pending);
    setExpenses((finData||[]).filter(r=> r.type==='expense'));
    setChartPoints((finData||[]).map(r => ({ date: r.created_at, val: r.type==='earning' ? Number(r.amount||0) : -Number(r.amount||0)})));
    setLoading(false);
  }

  // Upload invoice file (stores in invoices table, and uploads file to storage)
  async function handleInvoiceUpload(url, originalName){
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { error } = await supabase.from('invoices').insert([{ contractor_id: userId, file_url: url, created_at: new Date().toISOString() }]);
    if(error) return alert('Invoice save failed: '+error.message);
    await loadAll();
    alert('Invoice uploaded');
  }

  // Upload receipt (stores as expense row)
  async function handleReceiptUpload(url, originalName){
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    const { error } = await supabase.from('contractor_finances').insert([{
      contractor_id: userId,
      amount: 0,
      type: 'expense',
      description: `Receipt: ${originalName}`,
      file_url: url,
      created_at: new Date().toISOString()
    }]);
    if(error) return alert('Receipt save failed: '+error.message);
    await loadAll();
    alert('Receipt saved');
  }

  function exportCSV(){
    // Simple CSV exporter
    const rows = [
      ['Date','Type','Amount','Description','File URL'],
      ...(finances||[]).map(r=> [r.created_at, r.type, r.amount, (r.description || '').replace(/,/g,' '), r.file_url || ''])
    ];
    const csv = rows.map(r=> r.map(cell=> `"${String(cell||'').replace(/"/g,'""')}"`).join(',')).join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `finances_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // render small sparkline from chartPoints
  function Sparkline({points}){
    if(!points || points.length===0) return <div className="text-sm text-gray-400">No history</div>;
    const vals = points.map(p=> p.val);
    const max = Math.max(...vals); const min = Math.min(...vals);
    const w = 240, h = 60;
    const norm = vals.map((v,i)=> {
      const x = (i/(vals.length-1 || 1)) * (w-4) + 2;
      const y = max === min ? h/2 : h - ((v - min)/(max-min)) * (h-6) - 3;
      return `${x},${y}`;
    }).join(' ');
    return (<svg width={w} height={h}><polyline fill="none" stroke="#B8860B" strokeWidth="2" points={norm} strokeLinejoin="round" strokeLinecap="round"/></svg>);
  }

  return (
    <DashboardLayout role="contractor">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Finances</h1>
          <div className="flex gap-3">
            <button onClick={exportCSV} className="px-4 py-2 rounded bg-white/10">Export CSV</button>
            <button onClick={loadAll} className="px-4 py-2 rounded bg-white/10">Refresh</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="text-sm text-gray-300">Total Balance</div>
            <div className="text-2xl font-bold mt-2">{formatZAR(balance)}</div>
            <div className="text-xs text-gray-400 mt-1">Withdrawable: <strong>{formatZAR(withdrawable)}</strong></div>
            <div className="mt-4"><button className="btn-primary px-4 py-2 rounded">Request Withdrawal</button></div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-300">Pending Approvals</div>
            <div className="text-xl font-bold mt-2">{formatZAR(finances.filter(f=> f.type==='pending').reduce((s,r)=> s + Number(r.amount||0),0))}</div>
            <div className="text-xs text-gray-400 mt-1">These are amounts not yet released from escrow.</div>
          </div>

          <div className="card">
            <div className="text-sm text-gray-300">Earnings History</div>
            <div className="mt-2"><Sparkline points={chartPoints} /></div>
            <div className="text-xs text-gray-400 mt-1">Small trend of earnings/expenses</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            <h3 className="font-semibold mb-3">Invoices</h3>
            <div className="mb-3">
              <UploadButton folder={`invoices/${Date.now()}`} label="Upload Invoice (PDF)" onUpload={(url)=>handleInvoiceUpload(url,'invoice')}/>
            </div>
            <div className="space-y-2">
              {invoices.length===0 && <div className="text-sm text-gray-400">No invoices uploaded yet.</div>}
              {invoices.map(inv=> (
                <div key={inv.id} className="p-2 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">Invoice {inv.id?.slice(0,8)}</div>
                    <div className="text-sm text-gray-400">{new Date(inv.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    {inv.file_url && <a href={inv.file_url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded border">View</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-3">Expenses & Receipts</h3>
            <div className="mb-3">
              <UploadButton folder={`receipts/${Date.now()}`} label="Upload Receipt" onUpload={(url)=>handleReceiptUpload(url,'receipt')}/>
            </div>

            <div className="space-y-2">
              {(expenses||[]).length===0 && <div className="text-sm text-gray-400">No expenses recorded.</div>}
              {expenses.map(e => (
                <div key={e.id} className="p-2 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.description || 'Expense'}</div>
                    <div className="text-sm text-gray-400">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm">{formatZAR(e.amount)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">All Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-xs text-gray-400">
                <tr><th>Date</th><th>Type</th><th>Amount</th><th>Description</th><th>File</th></tr>
              </thead>
              <tbody>
                {(finances||[]).slice().reverse().map(f=>(
                  <tr key={f.id} className="border-t">
                    <td className="py-2">{new Date(f.created_at).toLocaleDateString()}</td>
                    <td>{f.type}</td>
                    <td>{formatZAR(f.amount)}</td>
                    <td>{f.description || '-'}</td>
                    <td>{f.file_url ? <a className="text-yellow-300" href={f.file_url} target="_blank" rel="noreferrer">Open</a> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
