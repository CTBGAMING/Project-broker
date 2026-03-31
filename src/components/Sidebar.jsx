
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from '../assets/projectbroker-logo.png';
import { Home, Folder, Users, Wrench, Shield, LogOut } from 'lucide-react';
export default function Sidebar({ role='customer' }) {
  const location = useLocation();
  const linkClass = (path) => `sidebar-link ${location.pathname.startsWith(path) ? 'sidebar-active' : 'text-gray-300 hover:bg-white/10'}`;
  const nav = {
    customer: [{to:'/dashboard/customer',label:'Overview',icon:<Home size={18}/>},{to:'/dashboard/customer/create',label:'Create Project',icon:<Folder size={18}/> }],
    contractor: [{to:'/dashboard/contractor',label:'Overview',icon:<Wrench size={18}/>},{to:'/dashboard/contractor/finances',label:'Finances',icon:<Users size={18}/> }],
    admin: [{to:'/dashboard/admin',label:'Overview',icon:<Users size={18}/> }],
    scoper: [{to:'/dashboard/scoper',label:'Pre-Inspections',icon:<Shield size={18}/> }],
    inspector: [{to:'/dashboard/inspector',label:'Inspections',icon:<Shield size={18}/> }],
    corporate: [{to:'/dashboard/corporate',label:'Overview',icon:<Users size={18}/> }]
  };
  const items = nav[role] || nav.customer;
  return (
    <div className="w-72 bg-[#0C0C0C] border-r border-white/5 p-6 flex flex-col">
      <Link to="/" className="flex items-center gap-3 mb-10">
        <img src={Logo} className="w-12" alt="Project Broker Logo" />
        <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-purple-500">Project Broker</span>
      </Link>
      <nav className="flex flex-col gap-3">{items.map(i=> <Link key={i.to} to={i.to} className={linkClass(i.to)}>{i.icon}<span>{i.label}</span></Link>)}</nav>
      <div className="mt-auto"><Link to="/auth" className="flex items-center gap-3 px-5 py-3 rounded-lg text-red-400 hover:bg-red-900/40 transition"><LogOut size={18}/> Logout</Link></div>
    </div>
  );
}
