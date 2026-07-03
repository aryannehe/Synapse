"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { User, Mail, Shield, Save, Key, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { user, updateProfile } = useWorkspaceStore();

  const [name, setName] = useState(user?.name || "");
  const [role, setRole] = useState(user?.role || "");
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;
    
    const success = await updateProfile(name);
    if (success) {
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Account Profile Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Manage your Synapse Technologies employee profile information and display options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Avatar details */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center border border-slate-800"
        >
          <img
            src={user?.avatar}
            alt={user?.name}
            className="h-28 w-28 rounded-2xl object-cover ring-4 ring-indigo-500/20 shadow-xl bg-slate-900"
          />
          <h3 className="text-base font-bold text-white mt-4">{user?.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{user?.role}</p>
          <div className="mt-2.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[10px] uppercase tracking-wider font-semibold">
            Employee Status: Active
          </div>
          
          <div className="w-full border-t border-slate-800/80 mt-6 pt-4 space-y-3 text-left">
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-400">
              <Shield className="h-4 w-4 shrink-0" />
              <span>Access Level: Staff Admin</span>
            </div>
          </div>
        </motion.div>

        {/* Right Form: Details editor */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800"
        >
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800/80 pb-2">Profile Details</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-250 text-xs rounded-xl">
                Profile details updated and broadcasted to Workspace services successfully.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Display Name</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-white placeholder-slate-600 text-xs transition-all focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 mb-1">Job Designation</label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Shield className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    disabled
                    value={role}
                    className="block w-full pl-9 pr-3 py-2 bg-slate-950/20 border border-slate-900 rounded-lg text-slate-500 placeholder-slate-600 text-xs transition-all focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1">Corporate Email Address (Read-only)</label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="block w-full pl-9 pr-3 py-2 bg-slate-900/40 border border-slate-850 rounded-lg text-slate-500 text-xs cursor-not-allowed select-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/80 mt-6">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-lg shadow-sm text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> Save Changes
              </button>
            </div>
          </form>

          {/* Security Credentials Section */}
          <div className="mt-8">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-slate-800/80 pb-2">Identity Credentials</h3>
            <div className="bg-slate-950/40 border border-slate-850/60 rounded-xl p-4 flex gap-3 text-slate-400 text-xs">
              <Key className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-200">Corporate Identity Verification</p>
                <p>Security credentials, MFA status, and keys are managed by Synapse Active Directory. Direct password changes are restricted within this workspace.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
