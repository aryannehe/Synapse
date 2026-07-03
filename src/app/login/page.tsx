"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useWorkspaceStore();
  
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  const [email, setEmail] = useState(isDemoMode ? "aryan.nehe@synapse.com" : "");
  const [password, setPassword] = useState(isDemoMode ? "emp#123" : "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync password default values based on demo selection for tester convenience
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (!isDemoMode) return;
    const eLower = newEmail.toLowerCase().trim();
    if (eLower === "aryan.nehe@synapse.com") {
      setPassword("emp#123");
    } else if (eLower === "admin@synapse.com") {
      setPassword("admin@1234");
    } else if (eLower === "sarah.j@techcorp.com") {
      setPassword("cli@123");
    }
  }, [isDemoMode]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email.trim()) {
      setError("Please enter your corporate or client email address.");
      setLoading(false);
      return;
    }

    try {
      const success = await login(email, password);
      if (success) {
        // Give a short delay for animation
        setTimeout(() => {
          router.push("/");
        }, 800);
      } else {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("An unexpected authentication error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Synapse <span className="text-indigo-400">Workspace</span>
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your Synapse corporate email to access the dashboard.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="glass-panel py-8 px-4 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-950/40 border border-red-500/50 rounded-xl p-4 flex gap-3 text-red-200 text-sm">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-200">
                Email Address
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm transition-all focus:outline-none"
                  placeholder="aryan.nehe@synapse.com / sarah.j@techcorp.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-200">
                Security Password
              </label>
              <div className="mt-1.5 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-slate-900/60 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-sm transition-all focus:outline-none"
                  placeholder="password123"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            <p>Protected by Synapse Technologies Identity Service.</p>
            {isDemoMode && (
              <p className="mt-1 font-semibold text-indigo-400/80">Demo: aryan.nehe@synapse.com (emp#123), admin@synapse.com (admin@1234), or sarah.j@techcorp.com (cli@123)</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
