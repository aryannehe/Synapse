import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { serviceLayer } from "../services/serviceLayer";
import { mockPrompts, mockTickets, mockDocuments } from "../services/mockData";

export interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: string;
  read: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  model: string;
  messages: ChatMessage[];
  createdAt: string;
}

interface WorkspaceState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<boolean>;
  updateProfile: (name: string) => Promise<boolean>;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;

  // Notifications
  notifications: SystemNotification[];
  addNotification: (title: string, description: string, type: SystemNotification["type"]) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;

  // Knowledge Module state
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  bookmarkedDocIds: string[];
  toggleBookmark: (docId: string) => void;

  // Support Module state
  activeTicketId: string | null;
  setActiveTicketId: (id: string | null) => void;

  // Assistant Module state
  conversations: ChatConversation[];
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  createConversation: (model: string, title?: string) => string;
  deleteConversation: (id: string) => void;
  addMessage: (conversationId: string, sender: "user" | "assistant", text: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  clearAllConversations: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      // Auth Default State
      user: null,
      isAuthenticated: false,

      login: async (email: string, password?: string) => {
        try {
          const res = await axios.post("/api/auth/login", { email, password });
          if (res.data.success) {
            set({ user: res.data.user, isAuthenticated: true });
            get().addNotification("Authentication Successful", `Welcome back, ${res.data.user.name}!`, "success");
            return true;
          }
          return false;
        } catch (err) {
          const errMsg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Invalid credentials.";
          get().addNotification("Authentication Failed", errMsg, "error");
          return false;
        }
      },

      logout: async () => {
        try {
          await axios.post("/api/auth/logout");
        } catch (e) {
          // ignore
        }
        set({ user: null, isAuthenticated: false });
        get().addNotification("Logged Out", "Signed out of session successfully.", "info");
      },

      fetchSession: async () => {
        try {
          const res = await axios.get("/api/auth/me");
          if (res.data.user) {
            set({ user: res.data.user, isAuthenticated: true });
            return true;
          }
          set({ user: null, isAuthenticated: false });
          return false;
        } catch (e) {
          set({ user: null, isAuthenticated: false });
          return false;
        }
      },

      updateProfile: async (name: string) => {
        try {
          const res = await serviceLayer.updateProfile(name);
          if (res.success) {
            set({ user: res.user });
            get().addNotification("Profile Updated", "Your user profile changes were saved successfully.", "success");
            return true;
          }
          return false;
        } catch {
          get().addNotification("Update Failed", "Could not sync profile changes with the database.", "error");
          return false;
        }
      },

      // Theme Default State
      theme: "dark",
      toggleTheme: () => {
        const nextTheme = get().theme === "light" ? "dark" : "light";
        set({ theme: nextTheme });
        
        // Sync class on documentElement
        if (typeof window !== "undefined") {
          const root = window.document.documentElement;
          if (nextTheme === "dark") {
            root.classList.add("dark");
          } else {
            root.classList.remove("dark");
          }
        }
      },

      // Notifications default state
      notifications: [
        {
          id: "notif-1",
          title: "New Support Ticket Assigned",
          description: "High priority ticket SYN-1026 has been assigned to you by Support Dispatcher.",
          type: "warning",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
          read: false,
        },
        {
          id: "notif-2",
          title: "Database Sync Alert",
          description: "Stripe billing webhook sync was completed for 40 accounts.",
          type: "success",
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
          read: true,
        },
      ],

      addNotification: (title, description, type) => {
        const newNotif: SystemNotification = {
          id: `notif-${Date.now()}`,
          title,
          description,
          type,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50), // Cap at 50 notifications
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      // Knowledge Search state
      recentSearches: ["expense report", "leave policy", "gitflow standards"],
      addRecentSearch: (query) => {
        if (!query.trim()) return;
        set((state) => {
          const filtered = state.recentSearches.filter((s) => s.toLowerCase() !== query.toLowerCase());
          return {
            recentSearches: [query, ...filtered].slice(0, 10), // keep latest 10
          };
        });
      },
      clearRecentSearches: () => {
        set({ recentSearches: [] });
      },
      bookmarkedDocIds: ["doc-1"],
      toggleBookmark: (docId) => {
        set((state) => {
          const isBookmarked = state.bookmarkedDocIds.includes(docId);
          const nextBookmarks = isBookmarked
            ? state.bookmarkedDocIds.filter((id) => id !== docId)
            : [...state.bookmarkedDocIds, docId];
            
          get().addNotification(
            isBookmarked ? "Bookmark Removed" : "Bookmark Saved",
            `Document reference updated.`,
            "info"
          );
          return { bookmarkedDocIds: nextBookmarks };
        });
      },

      // Support active ticket ID
      activeTicketId: null,
      setActiveTicketId: (id) => {
        set({ activeTicketId: id });
      },

      // Chat Playground state
      conversations: [
        {
          id: "conv-1",
          title: "React TypeScript Conversion",
          model: "Claude 3.5 Sonnet",
          messages: [
            {
              id: "m-1",
              sender: "user",
              text: "Translate this simple javascript class into TS.",
              timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            },
            {
              id: "m-2",
              sender: "assistant",
              text: "Sure! Let's convert that into a typed TypeScript class:\n\n```typescript\ninterface UserConfig {\n  name: string;\n  isAdmin: boolean;\n}\n\nexport class WorkspaceUser {\n  private name: string;\n  private isAdmin: boolean;\n\n  constructor(config: UserConfig) {\n    this.name = config.name;\n    this.isAdmin = config.isAdmin;\n  }\n\n  public getProfile(): string {\n    return `${this.name} (${this.isAdmin ? 'Admin' : 'Staff'})`;\n  }\n}\n```",
              timestamp: new Date(Date.now() - 1000 * 60 * 59).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
      ],
      activeConversationId: "conv-1",
      setActiveConversationId: (id) => {
        set({ activeConversationId: id });
      },

      createConversation: (model, title) => {
        const id = `conv-${Date.now()}`;
        const newConv: ChatConversation = {
          id,
          title: title || `New Chat (${model})`,
          model,
          messages: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => {
          const nextConv = state.conversations.filter((c) => c.id !== id);
          let nextActive = state.activeConversationId;
          if (nextActive === id) {
            nextActive = nextConv.length > 0 ? nextConv[0].id : null;
          }
          return {
            conversations: nextConv,
            activeConversationId: nextActive,
          };
        });
        get().addNotification("Chat Cleared", "The selected AI chat history has been deleted.", "info");
      },

      addMessage: (conversationId, sender, text) => {
        set((state) => {
          const updatedConversations = state.conversations.map((c) => {
            if (c.id === conversationId) {
              const newMsg = {
                id: `msg-${Date.now()}`,
                sender,
                text,
                timestamp: new Date().toISOString(),
              };
              
              // Auto-generate title if this is the first message in the chat
              let title = c.title;
              if (c.messages.length === 0 && sender === "user") {
                title = text.length > 30 ? text.slice(0, 30) + "..." : text;
              }

              return {
                ...c,
                title,
                messages: [...c.messages, newMsg],
              };
            }
            return c;
          });

          return { conversations: updatedConversations };
        });
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) => (c.id === id ? { ...c, title } : c)),
        }));
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
        get().addNotification("All Chats Deleted", "Cleared entire chat conversation history library.", "info");
      },
    }),
    {
      name: "synapse-workspace-store", // name of local storage key
      partialize: (state) => ({
        // Selectively persist these properties
        theme: state.theme,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        recentSearches: state.recentSearches,
        bookmarkedDocIds: state.bookmarkedDocIds,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        notifications: state.notifications,
      }),
    }
  )
);
