"use client";

import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Sun, 
  Moon, 
  Trash2, 
  Keyboard, 
  RotateCcw,
  Sliders
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function SettingsPage() {
  const { theme, toggleTheme, addNotification } = useWorkspaceStore();
  const [resetting, setResetting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const handleResetWorkspace = () => {
    setResetting(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("synapse-workspace-store");
        addNotification("Workspace Reset", "Reset workspace cache variables to default settings.", "warning");
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }, 1000);
  };

  const shortcutList = [
    { keys: "Ctrl + Enter", desc: "Submit active prompt template in Assistant Playground" },
    { keys: "Ctrl + K", desc: "Focus cursor on active prompt text area input" },
    { keys: "Ctrl + Shift + N", desc: "Open a brand new AI Conversation session log" },
    { keys: "Escape", desc: "Close slide-out drawer menus (Prompt library / Doc viewers)" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">Workspace Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure appearance preferences, keyboard shortcut bindings, and local workspace cache control.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side menu description */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-850 flex items-start gap-3">
            <Sliders className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Preferences Panel</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                These adjustments are stored locally inside the browser&apos;s session buffer and are tied to your Synapse active login node.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side Settings Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Theme Selector */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              Workspace Appearance
            </h3>

            <div className="flex justify-between items-center text-xs">
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-205">Interface Color Preference</p>
                <p className="text-[11px] text-slate-500">Toggle between dark mode slate tones or clean white interfaces.</p>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-850 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 text-amber-400" /> <span>Light theme</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 text-indigo-400" /> <span>Dark theme</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Keyboard Shortcuts Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel p-6 rounded-2xl border border-slate-850 space-y-4"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Keyboard className="h-4.5 w-4.5 text-indigo-400" /> Keyboard Shortcuts Reference
            </h3>

            <div className="divide-y divide-slate-800/40 text-xs">
              {shortcutList.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <span className="text-slate-400">{item.desc}</span>
                  <kbd className="px-2 py-0.5 bg-slate-950 border border-slate-850 rounded text-[10px] font-mono text-indigo-400 font-bold select-none shadow">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Data Reset */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl border border-slate-850 border-rose-950/20 space-y-4"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5 text-rose-400">
              <RotateCcw className="h-4.5 w-4.5" /> Maintenance & Cache Reset
            </h3>

            <div className="flex justify-between items-center text-xs gap-6">
              <div className="space-y-0.5 flex-1">
                <p className="font-semibold text-slate-205">Wipe Local Storage Data</p>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Resets the theme state, clears all active conversation logs, bookmarks, and restores the original ticket list configuration.
                </p>
              </div>

              <button
                onClick={() => setShowConfirm(true)}
                disabled={resetting}
                className="flex items-center gap-1.5 px-4 py-2 border border-transparent rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors disabled:opacity-40 shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> {resetting ? "Resetting..." : "Reset Workspace"}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
      {/* 4. Reset Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-amber-500">
              <RotateCcw className="h-6 w-6 text-rose-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Reset Workspace?</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to clear your local workspace cache? This will wipe your theme, notification feeds, active conversation logs, and settings parameters.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1.5 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-250 hover:bg-slate-800 transition-all cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleResetWorkspace();
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs text-white transition-all cursor-pointer font-bold"
              >
                Yes, Reset Cache
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
