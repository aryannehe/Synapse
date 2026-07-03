"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { serviceLayer } from "@/services/serviceLayer";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Sparkles, 
  BookOpen, 
  Download, 
  Send, 
  Copy, 
  Check, 
  Brain, 
  Keyboard, 
  Maximize2,
  X,
  PlusCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";
import { cn } from "@/lib/utils";

export default function AssistantPage() {
  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    addMessage,
    clearAllConversations,
    addNotification
  } = useWorkspaceStore();

  const [promptInput, setPromptInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("Claude 3.5 Sonnet");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamRef = useRef<(() => void) | null>(null);

  // Cleanup running stream on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current();
      }
    };
  }, []);

  const models = ["GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Pro", "Llama 3"];

  // Fetch prompt library from mock services
  const { data: promptTemplates } = useQuery({
    queryKey: ["promptTemplates"],
    queryFn: () => serviceLayer.getPrompts(),
  });

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamingText]);

  const handleCreateNewChat = () => {
    createConversation(selectedModel);
    textareaRef.current?.focus();
    addNotification("New Session", `Created new conversation using ${selectedModel}.`, "info");
  };

  // Bind keyboard shortcuts
  useEffect(() => {
    function handleShortcuts(e: KeyboardEvent) {
      // Ctrl + Shift + N -> New Chat
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        handleCreateNewChat();
      }
      // Ctrl + K -> Focus prompt input
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [selectedModel]);

  const handleSendPrompt = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isStreaming) return;

    let currentConvId = activeConversationId;
    // Create conversation on the fly if none active
    if (!currentConvId) {
      currentConvId = createConversation(selectedModel, promptInput.slice(0, 30));
    }

    const userPromptText = promptInput;
    setPromptInput("");
    setIsStreaming(true);
    setStreamingText("");

    // Add user message to state
    addMessage(currentConvId, "user", userPromptText);

    if (streamRef.current) {
      streamRef.current();
    }

    // Call service stream generator
    streamRef.current = serviceLayer.streamAIResponse(
      selectedModel,
      userPromptText,
      (chunk) => {
        setStreamingText((prev) => prev + chunk);
      },
      (fullText) => {
        // Stream completed
        addMessage(currentConvId!, "assistant", fullText);
        setIsStreaming(false);
        setStreamingText("");
        addNotification("AI Response Loaded", `Completed generation on ${selectedModel}.`, "success");
      }
    );
  };

  // Handle Ctrl+Enter submission inside textarea
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendPrompt();
    }
  };

  const handleCopyMessage = async (text: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleExportChat = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;

    let exportContent = `# Synapse AI Chat Export\n`;
    exportContent += `**Model:** ${activeConversation.model}\n`;
    exportContent += `**Export Date:** ${new Date().toLocaleDateString()}\n\n---\n\n`;

    activeConversation.messages.forEach(msg => {
      exportContent += `### **${msg.sender === "user" ? "USER" : "ASSISTANT"}** (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      exportContent += `${msg.text}\n\n---\n\n`;
    });

    const blob = new Blob([exportContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `chat-${activeConversation.id}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addNotification("Chat Exported", "Markdown chat logs downloaded successfully.", "success");
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-6 relative">
      {/* 1. Left Sidebar: Chat Sessions History */}
      <div className="w-64 bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between hidden md:flex shrink-0 shadow-xl">
        <div className="space-y-4 overflow-hidden flex flex-col flex-1">
          {/* Action button */}
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> New Conversation
          </button>

          {/* List of sessions */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1.5">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 font-medium">
                No active conversations.
              </div>
            ) : (
              conversations.map((conv) => {
                const active = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    className={cn(
                      "group flex items-center justify-between rounded-xl p-2.5 transition-all text-xs font-semibold select-none",
                      active 
                        ? "bg-slate-800 text-white" 
                        : "text-slate-400 hover:bg-slate-850/60 hover:text-slate-200"
                    )}
                  >
                    <button
                      onClick={() => setActiveConversationId(conv.id)}
                      className="flex items-center gap-2 text-left truncate flex-1 cursor-pointer"
                    >
                      <MessageSquare className={cn("h-4 w-4 shrink-0", active ? "text-indigo-400" : "text-slate-500")} />
                      <span className="truncate">{conv.title}</span>
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-450 p-0.5 rounded transition-all shrink-0 cursor-pointer"
                      title="Delete chat log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Clear chats */}
        {conversations.length > 0 && (
          <button
            onClick={clearAllConversations}
            className="w-full text-center py-2 border border-slate-800 hover:border-rose-950 text-slate-500 hover:text-rose-400 text-[10px] font-bold rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Clear All History
          </button>
        )}
      </div>

      {/* 2. Right Workspace: Active Chat box */}
      <div className="flex-1 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between overflow-hidden shadow-xl">
        
        {/* Chat Header controls */}
        <div className="px-5 py-3 border-b border-slate-850 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Model selector dropdown */}
            <div className="flex items-center gap-1.5">
              <Brain className="h-4.5 w-4.5 text-indigo-400 shrink-0" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                className="bg-slate-950 border border-slate-850 text-slate-300 text-xs rounded-lg py-1 px-2.5 focus:outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
              >
                {models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              title="Open Prompt Library"
            >
              <BookOpen className="h-4.5 w-4.5 text-indigo-400" /> <span className="hidden sm:inline">Library</span>
            </button>

            {activeConversation && activeConversation.messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                title="Export chat log"
              >
                <Download className="h-4.5 w-4.5" /> <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Feed Display */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-950/20">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-4 max-w-md mx-auto">
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl shadow-xl">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enterprise Assistant Playground</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Select an LLM model, load prompt templates from our corporate library, or start asking questions about coding, analysis, and company operations.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-550 border border-slate-850 bg-slate-900 px-3 py-1 rounded-xl font-mono">
                <Keyboard className="h-3.5 w-3.5 text-slate-500" />
                <span>Ctrl+K focus input • Ctrl+Shift+N new chat</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeConversation.messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3 max-w-[85%] rounded-2xl p-3.5 leading-relaxed text-xs relative group",
                      isUser
                        ? "ml-auto bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/5"
                        : "bg-slate-900/60 border border-slate-850 text-slate-200 rounded-tl-none"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <MarkdownRenderer content={msg.text} />
                      )}
                    </div>

                    {/* Meta/Copy overlay actions */}
                    {!isUser && (
                      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyMessage(msg.text, msg.id)}
                          className="p-1 bg-slate-950/80 hover:bg-slate-800 rounded border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
                          title="Copy raw text"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming assistant message placeholder */}
              {isStreaming && streamingText && (
                <div className="bg-slate-900/60 border border-slate-850 text-slate-200 rounded-tl-none rounded-2xl p-3.5 max-w-[85%] leading-relaxed text-xs typing-cursor">
                  <MarkdownRenderer content={streamingText} />
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Textarea Footer */}
        <div className="p-4 border-t border-slate-850 bg-slate-900/40">
          <form onSubmit={handleSendPrompt} className="relative flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              rows={2}
              value={promptInput}
              onKeyDown={handleTextareaKeyDown}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={isStreaming}
              className="block flex-1 px-4 py-2.5 bg-slate-950 border border-slate-850 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-500 text-xs transition-all focus:outline-none resize-none font-medium pr-10"
              placeholder={isStreaming ? "AI is typing reply..." : "Write a prompt request here... (Ctrl+Enter to send)"}
            />
            <button
              type="submit"
              disabled={isStreaming || !promptInput.trim()}
              className="absolute right-3.5 bottom-3 text-slate-400 hover:text-indigo-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

      {/* 3. Slideout Drawer: Prompt templates Library */}
      <AnimatePresence>
        {isLibraryOpen && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLibraryOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-full sm:max-w-md bg-slate-900 border-l border-slate-850 z-50 flex flex-col justify-between shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-850 pb-4">
                <div className="flex items-center gap-2 text-indigo-400">
                  <BookOpen className="h-4.5 w-4.5" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Prompt Library</h3>
                </div>
                <button
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-1.5 bg-slate-950/40 hover:bg-slate-800 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* List of prompt templates */}
              <div className="flex-1 overflow-y-auto py-5 pr-1 divide-y divide-slate-800/40 space-y-3">
                {promptTemplates?.map((tmpl) => (
                  <div key={tmpl.id} className="pt-3 first:pt-0 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200">{tmpl.name}</span>
                      <span className="text-[8px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                        {tmpl.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-450 leading-relaxed">{tmpl.description}</p>
                    <button
                      onClick={() => {
                        setPromptInput(tmpl.promptText);
                        setIsLibraryOpen(false);
                        textareaRef.current?.focus();
                      }}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Insert Template <PlusCircle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="border-t border-slate-850 pt-4 text-[10px] text-slate-550 flex items-center gap-1.5 font-semibold">
                <HelpCircle className="h-4 w-4 text-slate-650" />
                <span>Select an item to load prompt boilerplate text into chat area.</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
