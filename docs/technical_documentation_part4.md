# Synapse Workspace — Principal Technical & Architectural Documentation (Part 4)

This manual covers the **Frontend State Stores**, **Client Services**, **Docker Setup**, **Unit Tests**, and **Key Technical Interview & Viva Questions**.

---

# 📂 Frontend State & Service Integration Layer

---

# File: src/store/useWorkspaceStore.ts

### 1. Purpose of the File
`src/store/useWorkspaceStore.ts` manages client-side global state. It belongs to the **Frontend State Management Layer**.
- **Responsibilities**:
  - Persists authenticated user sessions across page reloads using browser local storage.
  - Controls systemic notification lists (success, error, information).
  - Handles AI chatbot conversation historical sequences.
- **Inputs**: User UI events, state mutations, and API responses.
- **Outputs**: Active state bindings accessed by React components.
- **Dependencies**: `zustand`, `zustand/middleware`.

### 2. High-Level Overview
Manages global state using Zustand. It stores user states, session details, active templates, and AI conversation messages. It persists selected variables to the browser's local storage so that sessions are preserved across reloads.

### 3. Detailed Code Walkthrough
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { serviceLayer } from "@/services/serviceLayer";
```
- **Line 1-4**: Imports Zustand state creator, persistence middlewares, Axios, and service layer utilities.

```typescript
export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  type: "success" | "error" | "info";
  read: boolean;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  model: string;
  title: string;
  messages: { sender: "user" | "assistant"; text: string; timestamp: string }[];
}
```
- **Line 6-22**: Defines systemic notifications and AI conversation message thread interfaces.

```typescript
interface WorkspaceState {
  user: any | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchSession: () => Promise<boolean>;
  updateProfile: (name: string) => Promise<boolean>;
...
```
- **Line 24-52**: Outlines the global state properties, actions, and getters.

```typescript
export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
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
        } catch (err: any) {
          get().addNotification("Authentication Failed", err.response?.data?.error || "Invalid credentials", "error");
          return false;
        }
      },
```
- **Line 54-85**: Creates the Zustand store wrapped with the `persist` middleware, and implements login request flows.

```typescript
      logout: async () => {
        try {
          await axios.post("/api/auth/logout");
        } catch (e) {
          console.error("Logout API failed:", e);
        }
        set({ user: null, isAuthenticated: false });
        get().addNotification("Logged Out", "You have been logged out of your session.", "info");
      },

      fetchSession: async () => {
        try {
          const res = await axios.get("/api/auth/me");
          if (res.data?.user) {
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
        } catch (err: any) {
          get().addNotification("Profile Update Failed", err.response?.data?.error || "Failed to update profile", "error");
          return false;
        }
      },
```
- **Line 87-133**: Implements session validation, profile update actions, and logouts.

```typescript
      // Notifications Actions
      notifications: [],
      addNotification: (title, description, type) => {
        const newNotif = {
          id: `notif-${Date.now()}`,
          title,
          description,
          type,
          read: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },
```
- **Line 135-156**: Appends operational notifications to state arrays.

```typescript
      // AI Conversations actions
      conversations: [],
      activeConversationId: null,
      setActiveConversationId: (id) => set({ activeConversationId: id }),
      createConversation: (model, title) => {
        const id = `conv-${Date.now()}`;
        const newConv = {
          id,
          model,
          title: title || `Chat with ${model}`,
          messages: [],
        };
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },
```
- **Line 158-185**: Implements chatbot history trackers and conversation initializers.

---

# File: src/services/serviceLayer.ts

### 1. Purpose of the File
`src/services/serviceLayer.ts` is the API request client. It belongs to the **Frontend Services Layer**.
- **Responsibilities**:
  - Handles client-side API requests.
  - Reads readable byte streams from `/api/assistant/stream` and runs callback routines.
- **Inputs**: Data payloads, query arguments.
- **Outputs**: Resolved API responses.
- **Dependencies**: `axios`.

### 2. High-Level Overview
Wraps the Axios HTTP client. It exposes functions to fetch support tickets, add internal notes, and stream responses from the AI chatbot assistant.

### 3. Detailed Code Walkthrough
```typescript
import axios from "axios";

export const serviceLayer = {
  // Support Tickets Services
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await axios.get<{ tickets: SupportTicket[] }>("/api/tickets");
    return response.tickets || response.data.tickets || [];
  },

  getTicketById: async (id: string): Promise<SupportTicket & { suggestedReplies?: string[] }> => {
    const response = await axios.get<SupportTicket & { suggestedReplies?: string[] }>(`/api/tickets/${id}`);
    return response.data;
  },

  createTicket: async (category: string, summary: string, message: string): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>("/api/tickets", { category, summary, message });
    return response.data;
  },

  updateTicketStatus: async (ticketId: string, status: string): Promise<SupportTicket> => {
    const response = await axios.patch<SupportTicket>(`/api/tickets/${ticketId}`, { status });
    return response.data;
  },

  updateTicketPriority: async (ticketId: string, priority: string): Promise<SupportTicket> => {
    const response = await axios.patch<SupportTicket>(`/api/tickets/${ticketId}`, { priority });
    return response.data;
  },

  updateTicketAssignment: async (ticketId: string, assignedAgent: string): Promise<SupportTicket> => {
    const response = await axios.patch<SupportTicket>(`/api/tickets/${ticketId}`, { assignedAgent });
    return response.data;
  },

  addMessage: async (ticketId: string, text: string): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>(`/api/tickets/${ticketId}`, { text, type: "message" });
    return response.data;
  },

  addInternalNote: async (ticketId: string, text: string): Promise<SupportTicket> => {
    const response = await axios.post<SupportTicket>(`/api/tickets/${ticketId}`, { text, type: "note" });
    return response.data;
  },
```
- **Line 1-44**: Outlines Axios HTTP request wrapper methods.

```typescript
  streamAIResponse: (
    model: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    onComplete: (fullText: string) => void
  ) => {
    let active = true;
    let fullText = "";

    const fetchStream = async () => {
      try {
        const response = await fetch("/api/assistant/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, model }),
        });

        if (!response.ok) {
          throw new Error("Stream response failed");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Body reader unavailable");

        const decoder = new TextDecoder();

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          onChunk(chunk);
        }

        if (active) {
          onComplete(fullText);
        }
      } catch (err) {
        console.error("Chat stream fetch failed:", err);
        onChunk("An error occurred connecting to the streaming assistant. Please verify your connection.");
        onComplete("An error occurred connecting to the streaming assistant. Please verify your connection.");
      }
    };

    fetchStream();

    // Return simple cancel callback to terminate downstream loop on unmount
    return () => {
      active = false;
    };
  },
```
- **Line 46-104**: Stream Response Reader. Pulls streaming response byte chunks from `/api/assistant/stream` in real-time, decoding and passing them to callback listeners. Returns a cancellation callback to abort processing on unmount.

---

# 🐳 Deployment & Container Infrastructure

---

# File: Dockerfile

### 1. Purpose of the File
`Dockerfile` maps multi-stage compilation specifications for the portal. It belongs to the **DevOps & Infrastructure Layer**.
- **Responsibilities**:
  - Builds thin, optimized production images.
  - Minimizes image sizes using multi-stage builds.
  - Resolves caching hierarchies.
- **Inputs**: Node.js base images, code files.
- **Outputs**: Optimized Docker production images.
- **Dependencies**: `node:18-alpine`.

### 2. High-Level Overview
Speeds up builds using Docker's multi-stage compiler.
- **Stage 1 (deps)**: Installs npm dependencies.
- **Stage 2 (builder)**: Compiles Next.js optimized production bundles.
- **Stage 3 (runner)**: Assembles the final production image, discarding build dependencies to keep the image lightweight.

### 3. Detailed Code Walkthrough
```dockerfile
# Stage 1: Install dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Build code
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["npm", "start"]
```
- Enforces strict security by executing container operations under a non-root user account (`nextjs`), protecting the host system from container breakout attacks.

---

# File: docker-compose.yml

### 1. Purpose of the File
`docker-compose.yml` configures multi-container setups. It belongs to the **DevOps & Infrastructure Layer**.
- **Responsibilities**:
  - Configures the Next.js app container and MongoDB database container.
  - Sets up shared network bridges.
  - Mounts database data volumes to prevent data loss across restarts.
- **Inputs**: Environment variable configurations (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`).
- **Outputs**: Running multi-container networks.
- **Dependencies**: Docker Engine.

### 3. Detailed Code Walkthrough
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: synapse-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - synapse-network

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: synapse-web
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/synapse-workspace
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
    depends_on:
      - mongodb
    networks:
      - synapse-network

volumes:
  mongo-data:

networks:
  synapse-network:
    driver: bridge
```
- Sets up a private network bridge (`synapse-network`) to let the app service access the database container, exposing port `3000` to the host system.

---

# 🎓 University-Level Viva Questions & Answers

### Q1: Explain the purpose of a multi-stage Dockerfile and how it benefits deployment.
**Answer**: Multi-stage Dockerfiles allow separating build environments from production execution environments. By using temporary build stages to compile assets and install devDependencies, we can discard them in the final runner stage, leaving only production code. This reduces production image sizes from over 1GB to under 200MB, minimizing network transfer times and security vulnerability footprints.

### Q2: What is connection pooling in Mongoose, and how do we implement it in serverless environments?
**Answer**: Connection pooling maintains a cache of active database sockets, letting incoming API requests reuse existing connections instead of establishing a new TCP handshake for each query. In serverless systems like Next.js, we implement this by caching the connection reference on the Node.js `global` object. This prevents hot-reloading compiler cycles from exhausting database socket limits.

### Q3: How does JWT session verification protect against session hijacking, and what are its trade-offs?
**Answer**: JWTs are signed cryptographically with a server-side secret key (`JWT_SECRET`). If an attacker alters payload keys (like changing their user role to `"admin"`), the signature verification fails. However, because JWTs are stateless, they cannot be easily revoked before expiration. To mitigate this, we set a reasonable expiration time (e.g. 7 days) and use the `httpOnly` cookie flag to block client-side scripts from reading the token.

### Q4: Explain the difference between database text indexes and standard filter indexes.
**Answer**: Standard indexes (like B-Trees) index fields sequentially to optimize sorting and range queries (like status filters). Text indexes split text fields into word tokens, apply stemming algorithms, and build an inverted index. This enables full-text keyword searches across multiple fields (such as document titles, contents, and tags) using the `$text` query operator.

---

# 🔑 Key Takeaways
- **Stateless Global State**: Zustand simplifies client-side state management while maintaining synchronization with backend APIs.
- **Efficient Streaming**: Using `ReadableStream` enables real-time AI streaming outputs without consuming excessive server memory.
- **Secure Containerization**: Multi-stage builds and non-root users provide secure and optimized production deployments.
