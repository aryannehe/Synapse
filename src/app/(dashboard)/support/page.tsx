"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceLayer } from "@/services/serviceLayer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  PlusCircle, 
  Search, 
  ChevronRight, 
  AlertCircle,
  Inbox,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/services/mockData";

export default function SupportTicketsPage() {
  const router = useRouter();
  const user = useWorkspaceStore((state) => state.user);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Create ticket form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("Technical");
  const [newSummary, setNewSummary] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data: tickets, isLoading, isError, refetch } = useQuery({
    queryKey: ["ticketsList"],
    queryFn: () => serviceLayer.getTickets(),
  });

  const getPriorityBadge = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500/10 border-rose-500/30 text-rose-450";
      case "high":
        return "bg-amber-500/10 border-amber-500/30 text-amber-450";
      case "medium":
        return "bg-blue-500/10 border-blue-500/30 text-blue-450";
      default:
        return "bg-slate-500/10 border-slate-500/30 text-slate-400";
    }
  };

  const getStatusBadge = (status: SupportTicket["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-450";
      case "pending":
        return "bg-purple-500/10 border-purple-500/30 text-purple-450";
      case "closed":
        return "bg-slate-700/20 border-slate-800 text-slate-500";
      default:
        return "bg-indigo-500/10 border-indigo-500/30 text-indigo-400";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !tickets) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-450 font-bold">Failed to load support ticket list.</p>
        <p className="text-xs text-slate-500 mt-2">Could not retrieve records from Synapse CRM.</p>
      </div>
    );
  }

  // Calculate ticket statistics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const pendingCount = tickets.filter(t => t.status === "pending").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  // Filter logic
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.summary.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "All" || ticket.status === statusFilter.toLowerCase();
    const matchesPriority = priorityFilter === "All" || ticket.priority === priorityFilter.toLowerCase();
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Customer Support Tickets</h2>
          <p className="text-sm text-slate-400 mt-1">
            Review customer cases, assign priority levels, and draft responses using AI summaries.
          </p>
        </div>
        {user?.role === "client" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs text-white font-bold inline-flex items-center gap-1.5 transition-all shadow-lg hover:shadow-indigo-600/15 cursor-pointer shrink-0"
          >
            <PlusCircle className="h-4.5 w-4.5" /> File New Ticket
          </button>
        )}
      </div>

      {/* 1. Statistics Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Total Cases</span>
            <span className="text-lg font-bold text-white font-mono">{totalCount}</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-450 border border-rose-500/20">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Active Open</span>
            <span className="text-lg font-bold text-white font-mono">{openCount}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Pending</span>
            <span className="text-lg font-bold text-white font-mono">{pendingCount}</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-4 rounded-xl border border-slate-850 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Closed / Resolved</span>
            <span className="text-lg font-bold text-white font-mono">{resolvedCount}</span>
          </div>
        </div>
      </div>

      {/* 2. Search & Filters controls */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-850 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-xs transition-all focus:outline-none"
            placeholder="Search by Ticket ID, client name, keywords..."
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-350 text-[11px] font-semibold rounded-lg py-1 px-2.5 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-350 text-[11px] font-semibold rounded-lg py-1 px-2.5 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Tickets Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] uppercase tracking-wider text-slate-450 font-bold">
                <th className="py-3.5 px-4 font-semibold">ID</th>
                <th className="py-3.5 px-4 font-semibold">Customer</th>
                <th className="py-3.5 px-4 font-semibold">Category</th>
                <th className="py-3.5 px-4 font-semibold">Summary</th>
                <th className="py-3.5 px-4 font-semibold">Priority</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Last Updated</th>
                <th className="py-3.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-medium">
                    No tickets found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket, idx) => (
                  <motion.tr 
                    key={ticket.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      {ticket.id}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {ticket.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {ticket.category}
                    </td>
                    <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-400">
                      {ticket.summary}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-[9px] px-2 py-0.5 border rounded font-semibold font-mono uppercase tracking-wider", getPriorityBadge(ticket.priority))}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn("text-[9px] px-2 py-0.5 border rounded font-semibold font-mono uppercase tracking-wider", getStatusBadge(ticket.status))}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[10px]">
                      {new Date(ticket.lastUpdated).toLocaleDateString()} {new Date(ticket.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button 
                        onClick={() => router.push(`/support/${ticket.id}`)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-0.5 hover:translate-x-0.5 transition-all cursor-pointer"
                      >
                        Open Case <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Ticket Creation Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">File Support Case</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newSummary.trim() || !newMessage.trim()) return;
              setIsCreating(true);
              try {
                await serviceLayer.createTicket(newCategory, newSummary, newMessage);
                setNewSummary("");
                setNewMessage("");
                setIsModalOpen(false);
                refetch();
              } catch (err) {
                console.error(err);
              } finally {
                setIsCreating(false);
              }
            }} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer animate-none"
                >
                  <option value="Technical">Technical Support</option>
                  <option value="Billing">Billing & Invoices</option>
                  <option value="Account">Account Access</option>
                  <option value="Feedback">Feedback & Suggestions</option>
                </select>
              </div>

              {/* Summary */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Brief Summary</label>
                <input
                  type="text"
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-650"
                  placeholder="e.g. 500 error when uploading quarterly invoice logs"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">Detailed Description</label>
                <textarea
                  required
                  rows={4}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-200 text-xs rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500 transition-all placeholder-slate-650 resize-none"
                  placeholder="Explain the technical problem, including links, steps to reproduce, or exact browser warnings..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newSummary.trim() || !newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs text-white font-bold transition-all shadow-md hover:shadow-indigo-600/10"
                >
                  {isCreating ? "Filing Case..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
