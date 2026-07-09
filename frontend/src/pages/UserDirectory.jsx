import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Users, UserPlus, Shield, Mail, Activity, CheckCircle2, XCircle } from 'lucide-react';

const UserDirectory = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/users/roles')
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      if (rolesRes.data.length > 0) {
        setRoleId(rolesRes.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load user directory data:', err);
      setError('Failed to fetch users and system roles data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !roleId) {
      setError('Please fill in all fields.');
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    
    try {
      await api.post('/api/auth/register', {
        full_name: fullName,
        email: email,
        password: password,
        role_id: parseInt(roleId, 10)
      });
      setSuccessMsg('User registered successfully.');
      setFullName('');
      setEmail('');
      setPassword('');
      fetchData(); // Reload list
    } catch (err) {
      console.error('User registration error:', err);
      setError(err.response?.data?.detail || 'Failed to register new user.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (roleName) => {
    switch (roleName) {
      case 'Super Admin': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Branch Manager': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Operations Officer': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Analyst': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <main className="p-8 space-y-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/20">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-3xl"></div>
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <span>User Directory</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Manage corporate accounts, roles, access permissions, and assign security tokens to operation field officers.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-red-200 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl text-emerald-200 text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Accounts List Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="p-5 border-b border-slate-850 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-blue-400" />
              <span>Registered Accounts</span>
            </h2>
            <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850">
              {users.length} Active Accounts
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Ingesting account directory details...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No registered user accounts found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-400 bg-slate-950/20 font-semibold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role Designation</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-4 font-bold text-slate-200">{u.full_name}</td>
                      <td className="p-4 text-slate-400">{u.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(u.role?.name)}`}>
                          {u.role?.name || 'No Role'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {u.is_active ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-slate-600" />
                              <span className="text-slate-500 font-medium">Disabled</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add User Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 h-fit space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-3">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">Register User</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                placeholder="John Doe"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs"
                  placeholder="name@company.com"
                  disabled={submitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs"
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Assigned Role
              </label>
              <select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg glass-input text-xs appearance-none"
                disabled={submitting}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-slate-100">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Add Team Member'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default UserDirectory;
