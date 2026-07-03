"use client";

import { usePathname, useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import { 
  Bell, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  User, 
  ShieldCheck,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export function Navbar({ onMenuToggle, isMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    user, 
    logout, 
    notifications, 
    markAllAsRead, 
    clearNotifications 
  } = useWorkspaceStore();

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotifDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = () => {
    if (pathname === "/") return "Analytics Hub";
    if (pathname.startsWith("/knowledge")) return "Knowledge Intelligent Search";
    if (pathname.startsWith("/support")) return "Customer Support Dashboard";
    if (pathname.startsWith("/assistant")) return "AI Enterprise Assistant";
    if (pathname.startsWith("/profile")) return "Employee Profile Settings";
    if (pathname.startsWith("/settings")) return "Workspace Preferences";
    return "Synapse Workspace";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case "error": return <XCircle className="h-4 w-4 text-rose-500" />;
      default: return <Info className="h-4 w-4 text-indigo-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left Area - Mobile Burger & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 bg-slate-800 rounded-lg md:hidden text-slate-350 hover:bg-slate-700 transition-all"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        
        {/* Mobile Logo */}
        <div className="flex md:hidden items-center gap-1.5 mr-2">
          <div className="p-1 bg-indigo-600 rounded-md text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="font-bold text-white text-xs tracking-tight">Synapse</span>
        </div>

        <h1 className="text-base md:text-lg font-bold text-white hidden sm:block">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right Area - Alerts and Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-100 transition-all relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 min-w-max px-1 bg-indigo-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center border border-slate-900 animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
                <span className="text-xs font-bold text-slate-200">System Activity Logs</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={markAllAsRead}
                    title="Mark all as read"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={clearNotifications}
                    title="Clear all logs"
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-450 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/50">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-500">
                    No alerts in history logs.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-3 flex gap-3 hover:bg-slate-850/60 transition-colors text-left",
                        !notif.read ? "bg-slate-850/30" : ""
                      )}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold text-slate-200 truncate", !notif.read ? "font-bold text-white" : "")}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                          {notif.description}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown Trigger */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded-xl transition-all"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-850"
              />
              <span className="text-xs font-semibold text-slate-300 hidden md:block select-none max-w-[100px] truncate">
                {user.name.split(" ")[0]}
              </span>
            </button>

            {/* Profile Dropdown Panel */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden">
                <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/20">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
                </div>

                <Link 
                  href="/profile" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-350 hover:bg-slate-850 hover:text-white transition-colors"
                >
                  <User className="h-4 w-4" /> Account Profile
                </Link>

                <Link 
                  href="/settings" 
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-350 hover:bg-slate-850 hover:text-white transition-colors"
                >
                  <Settings className="h-4 w-4" /> Settings
                </Link>

                <div className="border-t border-slate-800 mt-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-400 hover:bg-slate-850 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
