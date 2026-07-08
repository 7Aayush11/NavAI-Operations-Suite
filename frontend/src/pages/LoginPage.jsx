import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const history = useHistory();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await login(email, password);
    if (result.success) {
      history.push('/dashboard');
    } else {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  // Helper to prefill values for easy testing of the 4 roles
  const prefillCredentials = (selectedEmail, selectedPassword) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full filter blur-3xl animate-pulse delay-700"></div>

      {/* Main card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 rounded-xl mb-4 border border-blue-500/20">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            NavAI Operations
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Internal Operations & Insights Hub
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-sm"
                placeholder="name@company.com"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-3 rounded-xl glass-input text-sm"
                placeholder="••••••••"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium text-sm transition-all duration-150 transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isSubmitting ? 'Verifying Identity...' : 'Access Dashboard'}
          </button>
        </form>

        {/* Quick Seeding / Testing Prefills */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-xs font-medium text-center mb-3">
            Quick Testing Roles
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => prefillCredentials('admin@navadhan.com', 'adminpassword')}
              className="py-2 px-2 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-300 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-blue-400">Super Admin</div>
              <div className="text-[10px] text-slate-500">admin@navadhan.com</div>
            </button>
            <button
              onClick={() => prefillCredentials('manager@navadhan.com', 'managerpassword')}
              className="py-2 px-2 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-300 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-indigo-400">Branch Manager</div>
              <div className="text-[10px] text-slate-500">manager@navadhan.com</div>
            </button>
            <button
              onClick={() => prefillCredentials('officer@navadhan.com', 'officerpassword')}
              className="py-2 px-2 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-300 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-emerald-400">Ops Officer</div>
              <div className="text-[10px] text-slate-500">officer@navadhan.com</div>
            </button>
            <button
              onClick={() => prefillCredentials('analyst@navadhan.com', 'analystpassword')}
              className="py-2 px-2 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 text-slate-300 rounded-lg text-left transition-all"
            >
              <div className="font-bold text-amber-400">Analyst</div>
              <div className="text-[10px] text-slate-500">analyst@navadhan.com</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
