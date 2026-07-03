"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, fetchSession } = useWorkspaceStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check auth and sync state
  useEffect(() => {
    async function checkAuth() {
      const active = await fetchSession();
      if (!active) {
        router.push("/login");
      }
      setHydrated(true);
      setLoading(false);
    }
    checkAuth();
  }, [fetchSession, router]);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Prevent flash during mount / redirect
  if (!hydrated || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Authorizing security credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-950">
      {/* Sidebar for Desktop */}
      <Sidebar className="hidden md:flex" />

      {/* Mobile Sidebar Slide-in Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Overlay backdrop */}
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
          />
          {/* Drawer contents */}
          <div className="relative flex w-64 max-w-xs flex-col bg-slate-900 border-r border-slate-800">
            <Sidebar className="w-full h-full" />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Navbar 
          onMenuToggle={handleMenuToggle} 
          isMobileMenuOpen={isMobileMenuOpen} 
        />
        
        <main className="flex-1 overflow-y-auto bg-slate-950/60 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
