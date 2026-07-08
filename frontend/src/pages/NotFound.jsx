import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center space-y-6">
        <div className="inline-flex items-center justify-center p-3 bg-slate-800 rounded-xl border border-slate-700">
          <HelpCircle className="w-8 h-8 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Node Not Found
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The page node or path sequence you are trying to resolve does not exist in this active branch.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
