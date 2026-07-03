"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  LayoutDashboard, 
  Search, 
  Ticket, 
  MessageSquare, 
  Settings, 
  User, 
  Sun, 
  Moon, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme, logout, user } = useWorkspaceStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: "Analytics Hub", href: "/", icon: LayoutDashboard, roles: ["admin"] },
    { name: "Knowledge Search", href: "/knowledge", icon: Search, roles: ["admin", "employee", "client"] },
    { name: "Support Tickets", href: "/support", icon: Ticket, roles: ["admin", "employee", "client"] },
    { name: "AI Assistant", href: "/assistant", icon: MessageSquare, roles: ["admin", "employee"] },
    { name: "User Profile", href: "/profile", icon: User, roles: ["admin", "employee", "client"] },
    { name: "Settings", href: "/settings", icon: Settings, roles: ["admin", "employee", "client"] },
  ];

  const userRole = user?.role || "client";
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between transition-all duration-300 relative z-30 shrink-0",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Top Section - Brand */}
      <div>
        <div className={cn("p-4 flex items-center border-b border-slate-800", isCollapsed ? "justify-center" : "gap-3")}>
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-white leading-tight">Synapse Tech</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Workspace</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                  active
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "hover:bg-slate-800/60 hover:text-slate-100 text-slate-400"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-105", active ? "text-white" : "text-slate-400 group-hover:text-slate-300")} />
                {!isCollapsed && <span>{item.name}</span>}
                
                {/* Tooltip for collapsed mode */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-950 text-slate-200 text-xs font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg border border-slate-800 z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Theme / User */}
      <div className="p-3 border-t border-slate-800 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-all",
            isCollapsed ? "justify-center" : ""
          )}
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-5 w-5 text-amber-400 animate-pulse" />
              {!isCollapsed && <span>Light Mode</span>}
            </>
          ) : (
            <>
              <Moon className="h-5 w-5 text-indigo-400" />
              {!isCollapsed && <span>Dark Mode</span>}
            </>
          )}
        </button>

        {/* User Card */}
        {user && (
          <div className={cn("flex items-center rounded-xl p-1.5 bg-slate-950/40 border border-slate-850", isCollapsed ? "justify-center" : "gap-3")}>
            <img
              src={user.avatar}
              alt={user.name}
              className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-800"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.role}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex items-center justify-center w-full py-1 text-slate-500 hover:text-slate-350 transition-all"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
