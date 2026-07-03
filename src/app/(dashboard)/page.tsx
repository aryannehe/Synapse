"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceLayer } from "@/services/serviceLayer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Search, 
  Ticket, 
  Users, 
  Clock, 
  Terminal, 
  TrendingUp, 
  FileText, 
  Zap, 
  ArrowRight,
  Eye
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { mockDocuments, mockPrompts } from "@/services/mockData";

export default function AnalyticsHubPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const user = useWorkspaceStore((state) => state.user);

  useEffect(() => {
    if (user && user.role !== "admin") {
      if (user.role === "client") {
        router.push("/support");
      } else {
        router.push("/knowledge");
      }
    }
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, [user, router]);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["analyticsStats"],
    queryFn: () => serviceLayer.getAnalyticsStats(),
  });

  if (isLoading || !mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-450 font-bold">Failed to load workspace analytics stats.</p>
        <p className="text-xs text-slate-500 mt-2">Check internet connection or server configurations.</p>
      </div>
    );
  }

  // Curated Color palette for PieChart
  const COLORS = ["#6366f1", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"];

  // Fetch top 3 documents based on view count
  const popularDocs = [...mockDocuments].sort((a, b) => b.views - a.views).slice(0, 3);
  // Fetch top 3 prompt templates based on tokens used
  const activePrompts = [...mockPrompts].slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header welcome info */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
          Welcome back, {user?.name.split(" ")[0]}!
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Here is your operational snapshot of **Synapse Technologies Pvt. Ltd.** for today.
        </p>
      </div>

      {/* 1. KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.0 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Searches Today</span>
            <p className="text-2xl font-extrabold text-white font-mono">{stats.searchesToday}</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
            <Search className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 2 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tickets Resolved</span>
            <p className="text-2xl font-extrabold text-white font-mono">{stats.ticketsResolved}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
            <Ticket className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 3 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Users</span>
            <p className="text-2xl font-extrabold text-white font-mono">{stats.activeUsers}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
            <Users className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 4 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Prompt Usage</span>
            <p className="text-2xl font-extrabold text-white font-mono">{stats.promptUsage}</p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
            <Terminal className="h-5 w-5" />
          </div>
        </motion.div>

        {/* KPI 5 */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-center justify-between shadow-lg"
        >
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg Resolution</span>
            <p className="text-2xl font-extrabold text-white font-mono">{stats.averageResolutionTime}</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Clock className="h-5 w-5" />
          </div>
        </motion.div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Volume LineChart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ticket SLA Metrics</h3>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Last 7 Days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.ticketsTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                  itemStyle={{ color: "#a5b4fc" }}
                />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="open" name="Active Open" stroke="#6366f1" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Search Category PieChart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Search className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Knowledge Search Category Share</h3>
            </div>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.searchesDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.searchesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }}
                />
                <Legend 
                  layout="horizontal" 
                  align="center" 
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* 3. Feeds Grid (Most Viewed Documents & Recent Prompt Templates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Viewed Documents */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-indigo-450" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Most Viewed Documents</h3>
            </div>
            <Link 
              href="/knowledge" 
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
            >
              Search All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {popularDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-800 transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                    {doc.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-semibold font-mono">
                      {doc.category}
                    </span>
                    <span className="text-[9px] text-slate-500">{doc.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 font-mono">
                  <Eye className="h-3 w-3 text-slate-500" />
                  <span>{doc.views}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Prompt Templates */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl border border-slate-850"
        >
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-indigo-455" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Standard AI Templates</h3>
            </div>
            <Link 
              href="/assistant" 
              className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-all"
            >
              Open Assistant <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {activePrompts.map((prompt) => (
              <div 
                key={prompt.id} 
                className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl hover:border-slate-800 transition-all group"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                    {prompt.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                    {prompt.description}
                  </span>
                </div>
                <div className="shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-md font-semibold font-mono">
                    {prompt.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
