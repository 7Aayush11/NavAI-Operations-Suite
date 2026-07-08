import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, ShieldCheck } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="h-16 bg-slate-900/40 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search assets, flows, reports..."
            className="w-full pl-10 pr-4 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs focus:outline-none focus:border-blue-500 text-slate-300 placeholder-slate-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
            API Sync Online
          </span>
        </div>

        <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg relative transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 border border-slate-900"></span>
        </button>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <div className="text-right">
            <div className="text-xs font-bold text-slate-300">
              {user.role?.name} Session
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              Secure Channel
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
