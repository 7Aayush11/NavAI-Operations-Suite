import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Shield, Key, Bell, Database } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-4xl mx-auto w-full">
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-indigo-400" />
            <span>Profile & Settings</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Configure system configurations, profile credentials, and adjust analytics telemetries.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Sidebar Settings sections */}
        <div className="md:col-span-1 glass-panel p-4 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
          {[
            { label: 'My Profile', icon: User, active: true },
            { label: 'Security & Access', icon: Key, active: false },
            { label: 'Role Permissions', icon: Shield, active: false },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Database Configurations', icon: Database, active: false },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left font-medium transition-all ${
                  item.active 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Configuration Detail */}
        <div className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="border-b border-slate-850 pb-4">
            <h3 className="font-bold text-slate-100 text-sm">Account Information</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">Manage your personal credential tokens.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 cursor-not-allowed text-xs"
                  value={user?.full_name || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-400 cursor-not-allowed text-xs"
                  value={user?.email || ''}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Access Role</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800 text-slate-450 cursor-not-allowed text-xs font-semibold"
                  value={user?.role?.name || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-1.5">Account Status</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800 text-emerald-400 cursor-not-allowed text-xs font-semibold"
                  value={user?.is_active ? 'Active Operation Member' : 'Inactive'}
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 flex justify-end">
            <button
              onClick={() => alert("Settings modification restricted in demo sandbox.")}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all"
            >
              Update Credentials
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Settings;
