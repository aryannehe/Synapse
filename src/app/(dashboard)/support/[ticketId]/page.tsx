"use client";

import { useState, useRef, useEffect, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceLayer } from "@/services/serviceLayer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  ArrowLeft, 
  Send, 
  User, 
  Mail, 
  Clock, 
  Brain, 
  Tag, 
  CheckCircle,
  FileText,
  Smile,
  Meh,
  Frown,
  ChevronDown,
  ArrowRight,
  ClipboardCopy,
  PenTool
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SupportTicket } from "@/services/mockData";

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.ticketId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, addNotification } = useWorkspaceStore();

  const [messageText, setMessageText] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<"conversation" | "notes">("conversation");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch ticket details
  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["ticketDetail", ticketId],
    queryFn: () => serviceLayer.getTicketById(ticketId),
    refetchInterval: 4000, // Sync support thread automatically in real-time
  });

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages, activeTab]);

  // Mutations
  const sendReplyMutation = useMutation({
    mutationFn: (text: string) => serviceLayer.addTicketMessage(ticketId, text, "agent"),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticketDetail", ticketId], updatedTicket);
      queryClient.invalidateQueries({ queryKey: ["ticketsList"] });
      setMessageText("");
      addNotification("Reply Sent", `Sent message to client ${updatedTicket.customerName}.`, "success");
    },
  });

  const sendInternalNoteMutation = useMutation({
    mutationFn: (text: string) => serviceLayer.addInternalNote(ticketId, text),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticketDetail", ticketId], updatedTicket);
      setInternalNoteText("");
      addNotification("Note Saved", "Internal note added to case file.", "info");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: SupportTicket["status"]) => serviceLayer.updateTicketStatus(ticketId, status),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticketDetail", ticketId], updatedTicket);
      queryClient.invalidateQueries({ queryKey: ["ticketsList"] });
      addNotification("Ticket Status Updated", `Status is now ${updatedTicket.status.toUpperCase()}.`, "success");
    },
  });

  const updatePriorityMutation = useMutation({
    mutationFn: (priority: SupportTicket["priority"]) => serviceLayer.updateTicketPriority(ticketId, priority),
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticketDetail", ticketId], updatedTicket);
      queryClient.invalidateQueries({ queryKey: ["ticketsList"] });
      addNotification("Ticket Priority Updated", `Priority set to ${updatedTicket.priority.toUpperCase()}.`, "info");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[500px] bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-[500px] bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-450 font-bold">Failed to load support ticket details.</p>
        <p className="text-xs text-slate-500 mt-2">Check case ID or permissions.</p>
        <button onClick={() => router.push("/support")} className="mt-4 text-xs font-semibold text-indigo-400 flex items-center gap-1 mx-auto hover:text-indigo-300">
          <ArrowLeft className="h-4.5 w-4.5" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    sendReplyMutation.mutate(messageText);
  };

  const handleSendInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNoteText.trim()) return;
    sendInternalNoteMutation.mutate(internalNoteText);
  };

  // Autocomplete AI replies generator based on category
  const getAISuggestedReplies = () => {
    if (ticket.category === "Billing") {
      return [
        "Hi " + ticket.customerName.split(" ")[0] + ", I am checking our billing system now. It looks like the seats were updated on June 5th. Let me verify our active logs.",
        "Thank you for reaching out. I have credited the charge difference of 10 seats back to your payment account. It should reflect in 3-5 business days."
      ];
    }
    if (ticket.category === "Technical") {
      return [
        "Hi " + ticket.customerName.split(" ")[0] + ", I apologize for this issue. Our engineering team is currently fixing the webhook mismatch. I will message you as soon as sync is restored.",
        "I have reviewed the logs and identified a signature validation discrepancy. I am rolling out a patch to fix this immediately."
      ];
    }
    return [
      "Hello, thank you for contacting Synapse Support. I have received your request and am looking into it right now.",
      "Can you provide additional logs or error screenshots so our team can troubleshoot this faster?"
    ];
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return <Smile className="h-4.5 w-4.5 text-emerald-450 shrink-0" />;
      case "negative": return <Frown className="h-4.5 w-4.5 text-rose-450 shrink-0" />;
      default: return <Meh className="h-4.5 w-4.5 text-amber-450 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb navigation */}
      <button 
        onClick={() => router.push("/support")}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Tickets
      </button>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Area: Messages and conversations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel rounded-2xl border border-slate-850 overflow-hidden flex flex-col h-[560px] shadow-xl">
            {/* Header info */}
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/40 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400">{ticket.id}</span>
                <span className="h-3.5 w-px bg-slate-800" />
                <h3 className="text-xs font-bold text-white max-w-[200px] sm:max-w-md truncate">{ticket.summary}</h3>
              </div>

              {/* View toggle tabs - Hide from client */}
              {user?.role !== "client" && (
                <div className="bg-slate-950/60 p-0.5 border border-slate-850 rounded-lg flex shrink-0">
                  <button
                    onClick={() => setActiveTab("conversation")}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      activeTab === "conversation" ? "bg-indigo-600 text-white shadow" : "text-slate-450 hover:text-slate-250"
                    )}
                  >
                    Conversation
                  </button>
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={cn(
                      "px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer",
                      activeTab === "notes" ? "bg-indigo-650 text-white shadow" : "text-slate-450 hover:text-slate-250"
                    )}
                  >
                    Internal Notes ({ticket.internalNotes.length})
                  </button>
                </div>
              )}
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-950/20">
              {activeTab === "conversation" ? (
                ticket.messages.map((msg) => {
                  const isAgent = msg.sender === "agent";
                  const isSystem = msg.sender === "system";
                  return (
                    <div 
                      key={msg.id}
                      className={cn(
                        "flex flex-col",
                        isSystem ? "items-center" : isAgent ? "items-end" : "items-start"
                      )}
                    >
                      {/* Meta header */}
                      {!isSystem && (
                        <span className="text-[9px] text-slate-500 font-semibold mb-1 px-1">
                          {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      
                      {/* Message Bubble */}
                      <div 
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed",
                          isSystem 
                            ? "bg-slate-900 border border-slate-850 text-slate-450 py-1 font-mono text-[10px]" 
                            : isAgent 
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/5"
                              : "bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none"
                        )}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                /* Internal Notes Panel */
                <div className="space-y-4">
                  {ticket.internalNotes.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-10 font-medium">No internal staff notes created for this case.</p>
                  ) : (
                    ticket.internalNotes.map((note, idx) => (
                      <div key={idx} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold">
                          <span>Internal Staff Note #{idx + 1}</span>
                          <span>Aryan Nehe</span>
                        </div>
                        <p className="text-xs text-amber-200/90 leading-relaxed">{note}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/20">
              {activeTab === "conversation" ? (
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={sendReplyMutation.isPending}
                    className="block flex-1 px-4 py-2.5 bg-slate-950/60 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-xs transition-all focus:outline-none"
                    placeholder="Draft response reply message to customer..."
                  />
                  <button
                    type="submit"
                    disabled={sendReplyMutation.isPending || !messageText.trim()}
                    className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSendInternalNote} className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    disabled={sendInternalNoteMutation.isPending}
                    className="block flex-1 px-4 py-2.5 bg-slate-950/60 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-xs transition-all focus:outline-none"
                    placeholder="Write a private staff note only visible to Synapse team..."
                  />
                  <button
                    type="submit"
                    disabled={sendInternalNoteMutation.isPending || !internalNoteText.trim()}
                    className="px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <PenTool className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* Right Area: AI Assistant Dashboard & Properties */}
        <div className="space-y-4">
          
          {/* 1. Ticket configuration controls */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-850 space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              Case Properties
            </h4>

            {/* Customer metadata details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <User className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="font-semibold text-slate-350 truncate">{ticket.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-4 w-4 shrink-0 text-indigo-400" />
                <span className="truncate">{ticket.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Tag className="h-4 w-4 shrink-0 text-indigo-400" />
                <span>Department: {ticket.category}</span>
              </div>
            </div>

            {user?.role !== "client" ? (
              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-3">
                {/* Status Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatusMutation.mutate(e.target.value as "open" | "pending" | "resolved" | "closed")}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="pending">Pending</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Selector */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => updatePriorityMutation.mutate(e.target.value as "low" | "medium" | "high" | "urgent")}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-lg py-1 px-2 focus:outline-none focus:border-indigo-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</span>
                  <span className={cn(
                    "inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono",
                    ticket.status === "resolved" || ticket.status === "closed"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-450"
                      : ticket.status === "pending"
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-450"
                      : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                  )}>
                    {ticket.status}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Priority</span>
                  <span className={cn(
                    "inline-block text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono",
                    ticket.priority === "urgent"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-450"
                      : ticket.priority === "high"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-450"
                      : ticket.priority === "medium"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-450"
                      : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                  )}>
                    {ticket.priority}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. SupportIQ AI assistant Panel - Hide from client */}
          {user?.role !== "client" && (
            <div className="bg-gradient-to-br from-indigo-950/30 to-slate-950/60 border border-indigo-900/20 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-indigo-900/20 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Brain className="h-4.5 w-4.5 animate-pulse" /> SupportIQ Assistant</span>
                <span className="text-[8px] bg-indigo-500/15 text-indigo-350 px-1 rounded">Agent Helper</span>
              </h4>

              {/* AI Summary card */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">AI Case Synthesis</span>
                <div className="bg-slate-900/80 border border-slate-850 p-2.5 rounded-lg text-[11px] text-slate-300 leading-relaxed font-medium">
                  {ticket.summary}
                </div>
              </div>

              {/* Sentiment Meter */}
              <div className="flex items-center justify-between p-2 bg-slate-900/40 border border-slate-850 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Client Sentiment</span>
                  <span className="text-xs font-bold text-slate-200 capitalize">{ticket.sentiment}</span>
                </div>
                {getSentimentIcon(ticket.sentiment)}
              </div>

              {/* Tag helpers */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider block">Suggested Meta Tags</span>
                <div className="flex flex-wrap gap-1">
                  {ticket.suggestedTags.map(tag => (
                    <span key={tag} className="text-[8px] font-semibold text-slate-400 bg-slate-900 border border-slate-850 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <Tag className="h-2 w-2 text-indigo-400" /> {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* suggested replies list */}
              <div className="space-y-2 pt-2 border-t border-indigo-900/10">
                <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">AI Autocomplete Snippets</span>
                <div className="space-y-2">
                  {((ticket as unknown as { suggestedReplies?: string[] })?.suggestedReplies || getAISuggestedReplies()).map((reply: string, i: number) => (
                    <div 
                      key={i} 
                      className="p-2.5 bg-slate-900/80 border border-slate-850 hover:border-indigo-500/20 rounded-lg text-[10px] text-slate-300 leading-normal font-medium space-y-2 relative group"
                    >
                      <p className="line-clamp-2">{reply}</p>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setMessageText(reply)}
                          className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          Insert Snippet <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
