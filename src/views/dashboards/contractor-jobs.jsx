import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout.jsx";
import { supabase } from "../../lib/supabase.js";
import { useNavigate } from "react-router-dom";

export default function ContractorJobs(){
  const [jobs,setJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{ load(); },[]);

  async function load(){
    const { data: user } = await supabase.auth.getUser();
    const uid = user?.user?.id;
    if(!uid) return;
    // show jobs assigned to contractor or open jobs (depending on your model)
    const { data } = await supabase.from('ads').select('*, projects(project_name)').or(`contractor_id.eq.${uid},is_emergency.eq.true`);
    setJobs(data || []);
  }

  return (<DashboardLayout role="contractor"><div className="max-w-6xl mx-auto"><h1 className="text-2xl font-bold mb-4">Jobs</h1>
    <div className="grid md:grid-cols-2 gap-4">
      {jobs.map(j=> (<div key={j.id} className="card">
        <div className="flex justify-between">
          <div>
            <div className="font-semibold">{j.category}</div>
            <div className="text-sm text-gray-300">{j.projects?.project_name}</div>
            <div className="text-xs text-gray-400 mt-2">{j.description?.slice(0,120)}</div>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={()=>navigate(`/bidding/place/${j.id}`)} className="px-3 py-1 rounded bg-white/10">Place Bid</button>
            <button onClick={()=>navigate(`/dashboard/contractor/finances`)} className="px-3 py-1 rounded bg-white/10">Finances</button>
          </div>
        </div>
      </div>))}
      {jobs.length===0 && <div className="card">No jobs found.</div>}
    </div></div></DashboardLayout>);
}
