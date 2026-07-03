# Synapse Workspace — End-to-End Master System Operational Manual

This manual details the end-to-end working of the **Synapse Workspace** enterprise-grade support and knowledge portal. It maps every user action, state change, network call, AI generation, and database query in the platform.

---

# 🌐 1. Architectural Overview & Component Topology

```
+---------------------------------------------------------------------------------------------------+
|                                       PRESENTATION LAYER                                          |
|  - React 19 Client Engine (Vite / Next.js SPA Wrapper)                                            |
|  - Tailwind CSS / Vanilla CSS Variables Theme System                                              |
|  - Zustand Stores (`useWorkspaceStore.ts`) & React Query hooks                                    |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  | HTTP REST Request / Edge Streams
                                                  v
+-------------------------------------------------+-------------------------------------------------+
|                                        GATEWAY ROUTING                                            |
|  - Next.js Global Edge Interceptor (`src/middleware.ts`)                                          |
|  - Session Cookie Validation (`synapse-token` read checks)                                        |
|  - Browser Hardening Headers (CSP, X-Frame-Options, XSS mode blocks)                              |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  | Approved Proxies
                                                  v
+-------------------------------------------------+-------------------------------------------------+
|                                      BUSINESS ROUTE LOGIC                                         |
|  - Next.js App Router Server Route Handlers (`/api/*`)                                            |
|  - Payload Validation & Sanitization Layer (`zod` schemas)                                        |
|  - Authentication Audits & JWT signature parses (`src/lib/auth.ts`)                               |
+------------------------+----------------------------------------+---------------------------------+
                         |                                        |
                         | BSON Wire protocol                     | REST API Payload
                         v                                        v
+------------------------+------------------------+      +--------+------------------------+
|                 PERSISTENCE LAYER               |      |            AI SYNTHESIS         |
|  - Mongoose ODM Client (`src/lib/db.ts`)        |      |  - Gemini 1.5 Flash API Gateway |
|  - MongoDB Datastores                           |      |    (`src/lib/ai.ts` REST client) |
|  - Indexed Collections (Users, Tickets, Docs)   |      +---------------------------------+
+-------------------------------------------------+
```

---

# 🔑 2. Core Functional Modules & Flow Details

## 2.1 User Authentication & Session Validation

```
[ User Logs In ] 
       │
       ▼
   Rate Limit Check ─── (Attempts exceeded?) ───► [ Return HTTP 429 ]
       │ No
       ▼
   Check DB User Count ─── (Empty?) ───► [ Auto-Seed Mock Accounts ]
       │
       ▼
   Query User in MongoDB (by email) 
       │ Found?
       ▼
   Verify Password Hash (bcrypt.compare) ─── (Mismatch?) ───► [ Return HTTP 401 ]
       │ Matches
       ▼
   Sign JWT Session Token (userId, email, role)
       │
       ▼
   Write JWT into httpOnly Cookie ('synapse-token', sameSite: "lax")
       │
       ▼
   [ Return HTTP 200 Success ] ───► client-side store writes user context
```

### End-to-End Execution Sequence:
1. **Frontend Submission**: The user enters their email and password on `/login`.
2. **Store Dispatch**: The login form calls `login(email, password)` on `useWorkspaceStore.ts`.
3. **HTTP Call**: An Axios POST request is fired to `/api/auth/login`.
4. **Rate Limiting**: The server executes `checkRateLimit(ip, 10, 15mins)`. If the IP address has issued more than 10 requests within 15 minutes, it blocks the request, returning an HTTP `429 Too Many Requests` error.
5. **Database Resolution**: The route handler connects to MongoDB using `connectToDatabase()` (reusing the cached connection pool). It queries the user using `User.findOne({ email })`.
6. **Bcrypt Hash Verification**: If the user is found, the server passes the plaintext password and database password hash to `bcrypt.compare`. If verification fails, it returns an HTTP `401 Unauthorized` response.
7. **Session Issuance**: Upon successful verification, the server generates a JWT using `signToken()`. The token is encrypted with `JWT_SECRET` and set as an `httpOnly`, `secure`, `sameSite: "lax"` cookie named `synapse-token` with a 7-day expiration time.
8. **Client Store Update**: The client-side Zustand store receives the authenticated user metadata (name, email, role, avatar) and updates the local state. The user is then redirected to the dashboard `/support`.

---

## 2.2 Support Ticketing & AI Analysis Flow

```
[ Form Submission ] ──► [ Zod Validation ] ──► [ Generate Unique Ticket ID ]
                                                       │
                                                       ▼
                                            [ Fire Gemini AI Analysis ]
                                                       │
                                       ┌───────────────┴───────────────┐
                                       │ API Success?                  │ API Fail?
                                       ▼                               ▼
                           [ Parse JSON Response ]         [ Local Regex Fallbacks ]
                           - Sentiment Analysis            - Check for threat keywords
                           - Priority Recommendations      - Map default priorities
                           - Suggested Tags                - Append fallback labels
                                       │                               │
                                       └───────────────┬───────────────┘
                                                       │
                                                       ▼
                                          [ Create MongoDB Document ]
                                                       │
                                                       ▼
                                          [ Return Ticket Details ]
```

### End-to-End Execution Sequence:
1. **Frontend Creation**: A client opens the ticket creation dialog, selects a category, writes a summary and a message, and submits the form.
2. **Payload Validation**: The POST request to `/api/tickets` is validated against a Zod schema `createTicketSchema` (ensuring the summary is between 3 and 250 characters, and the message is between 5 and 5000 characters) to block corrupted payloads.
3. **Ticket ID Generation**: The server generates a unique ticket ID using the current timestamp and a random suffix: `SYN-${Date.now().toString().slice(-6)}-${uniqueSuffix}`.
4. **Gemini AI Call**:
   - The route handler builds a structured prompt containing the message.
   - Calls `generateAIContent(prompt, forceJson = true)`.
   - The Gemini API returns a structured JSON string containing `sentiment`, `recommendedPriority`, and `suggestedTags`.
   - On network failure or if the API key is missing, local regex fallbacks inspect the message text for keywords like "urgent", "broken", or "solved" to determine priority and sentiment.
5. **Database Storage**: The ticket is saved in MongoDB with the `open` status and `Unassigned` agent fields.
6. **Dynamic Real-Time Polling**:
   - When an agent opens the ticket details page `/support/[ticketId]`, the client component starts polling the database.
   - TanStack React Query automatically refetches ticket details every **4000ms** (`refetchInterval: 4000`).
   - If the agent updates the status to `pending`, modifies the priority, or assigns it to themselves, these changes are pushed to MongoDB, and the client screen updates automatically.

---

## 2.3 Knowledge Base Search & AI Answer Card Synthesis

```
[ User Searches Policies ] ──► [ Escape Input Strings ] ──► [ Query Text Index ]
                                                                     │
                                                                     ▼
                                                          [ Call Gemini API ]
                                                                     │
                                                     ┌───────────────┴───────────────┐
                                                     │ API Success?                  │ API Fail?
                                                     ▼                               ▼
                                         [ Parse JSON Response ]         [ Local Regex Fallbacks ]
                                         - Markdown Answer               - Map leave/expense rules
                                         - Confidence Rating             - Return top documents
                                         - Key Takeaway Summary          - List related topics
                                         - Related Topics                │
                                                     │                               │
                                                     └───────────────┬───────────────┘
                                                                     │
                                                                     ▼
                                                      [ Render Search Results ]
```

### End-to-End Execution Sequence:
1. **Query Input**: A user enters search keywords (e.g. "reimbursement limits") in the search bar on `/knowledge`.
2. **Query Filtering & Escaping**: The request to `/api/knowledge?search=reimbursement` is processed by escaping any regex characters to block RegExp injection attacks.
3. **Database Full-Text Search**: Mongoose queries matching documents using the compound text index on `title`, `content`, and `tags`:
   `Document.find(query).sort(sortOption).skip(skip).limit(limit)`.
4. **AI Summary Generation**:
   - If matching documents are found, the server passes the search query and the top 3 document contents to the Gemini API.
   - The prompt instructs Gemini to act as the corporate AI assistant, analyze the documents, and synthesize a direct response.
   - Gemini returns a structured JSON response containing `answer` (supporting markdown), `confidence` rating, `summary` takeaway, and `relatedTopics`.
   - If the API key is missing or fails, local regex fallbacks map queries containing "leave", "vacation", or "reimburse" to static pre-coded policy summaries.
5. **UI Rendering**: The knowledge portal renders the synthesized AI Answer Card on top of matching search results, providing the user with direct answers and clickable policy documents.

---

## 2.4 Chatbot streaming Playground Flow

```
[ User Chat Prompt ] ──► [ API Gateway Stream Hook ] ──► [ Google Event-Stream ]
                                                                     │
                                                                     ▼
                                                         [ Chunk Decoder Loop ]
                                                                     │
                                                     ┌───────────────┴───────────────┐
                                                     │ API Key Configured?           │ Missing Key?
                                                     ▼                               ▼
                                         [ Read Gemini Stream Chunks ]   [ Yield Simulated Stream ]
                                         - Decode byte values            - Yield text tokens
                                         - Extract JSON text keys        - Wait 35ms per token
                                         - Stream text tokens            - Stream text tokens
                                                     │                               │
                                                     └───────────────┬───────────────┘
                                                                     │
                                                                     ▼
                                                        [ Render Stream in UI ]
```

### End-to-End Execution Sequence:
1. **User Request**: The user selects an AI model (e.g., "Gemini 1.5 Pro"), enters a prompt in the chat box on `/assistant`, and clicks send.
2. **Zustand Chat Store Action**: `createConversation` initializes a chat thread, and the frontend makes a POST request to `/api/assistant/stream`.
3. **AI Stream Pipeline**:
   - The route handler checks if the Gemini API key is configured.
   - If configured, it opens a connection using `fetchGeminiStream(prompt)`.
   - It instantiates a standard `ReadableStream`. The chunk reader loop decodes incoming buffer arrays using `TextDecoder` and parses out text keys using regex: `/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g`.
   - If the API key is missing, it falls back to a simulated stream, splitting a default text block by words and yielding each word with a 35ms delay to simulate typing.
4. **Client Stream Rendering**:
   - The frontend service `streamAIResponse` reads the response body stream chunk-by-chunk.
   - The `onChunk` callback updates the assistant's message state in real-time, rendering the text on screen word-by-word.
   - When the component unmounts, it calls the returned cancellation callback, aborting the stream reader to prevent memory leaks.

---

# 🛡️ 3. Security Audits & Mitigations Matrix

| Identified Security Threat | Risk Level | Target Entry Point | Mitigation Strategy Implementation | Code / File Reference |
| :--- | :--- | :--- | :--- | :--- |
| **NoSQL Database Injection** | High | `/api/tickets` filters | Mongoose strictly casts schema parameters, and inputs are checked against static types. | `Ticket.ts`, `Ticket/[ticketId]/route.ts` |
| **RegExp Injection & CPU Exhaustion** | High | Search endpoints | Regular expression query parameters are parsed through an escaping helper (`replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`) before query compilation. | `/api/tickets/route.ts:41-45`, `/api/knowledge/route.ts:29-33` |
| **Brute-Force Credentials Guessing** | Medium | `/api/auth/login` | Enforces rate-limiting using an in-memory IP tracking map, blocking IPs for 15 minutes after 10 failed login attempts. | `/api/auth/login/route.ts:9-37` |
| **Privilege Escalation Hacks** | High | `/api/auth/register` | Overrides any user role fields passed in the request body, hardcoding the role to `"client"` during database entry. | `/api/auth/register/route.ts:46-59` |
| **Session Cookie Hijacking (XSS)** | High | Browser cookies | Sets the session cookie properties to `httpOnly: true` (blocking access from JS code) and `sameSite: "lax"` (mitigating CSRF attacks). | `/api/auth/login/route.ts:89-98` |
| **Clickjacking & Framing Attacks** | Medium | Client Browser | Injects global security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`) in the global Edge middleware. | `src/middleware.ts:25-34` |
| **Plaintext Database Passwords** | High | MongoDB User Document | Hashes all passwords using Bcrypt with a salt round factor of 10 prior to writing records to database. | `/api/auth/register/route.ts:43`, `/api/auth/login/route.ts:48-52` |

---

# 📊 4. Database Operations & Optimization Blueprint

- **Email Uniqueness Constraint**: The `User` collection schema enforces a unique index on the `email` field:
  ```typescript
  email: { type: String, required: true, unique: true }
  ```
- **Ticket Indexing**: To optimize sorting and filtering, the `Ticket` schema declares three indexes:
  ```typescript
  TicketSchema.index({ clientId: 1 });
  TicketSchema.index({ status: 1 });
  TicketSchema.index({ lastUpdated: -1 });
  ```
- **Knowledge Base Text Search**: The `Document` schema defines a compound text index covering title, content, and tags to enable fast full-text keyword searches:
  ```typescript
  DocumentSchema.index({ title: "text", content: "text", tags: "text" });
  ```
- **Connection Pools**: Mongoose reuses active connections by caching the connection reference on the Node.js `global` object, preventing database connection exhaustion:
  ```typescript
  let cached = (global as any).mongoose;
  if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
  }
  ```

---

# 🚀 5. DevOps, Containerization & CI/CD Spec

- **Docker Multi-Stage Build Strategy**: The `Dockerfile` separates build environments from production execution environments using three stages:
  1. `deps`: Installs npm dependencies.
  2. `builder`: Compiles Next.js optimized production bundles.
  3. `runner`: Assembles the final production image, discarding build dependencies to keep the image lightweight.
- **Docker Compose Network Isolation**: Runs the Next.js app container and MongoDB database container within a private network bridge (`synapse-network`), exposing port `3000` to the host system.
- **Non-Root Execution**: Enforces container security by executing operations under a non-root user account (`nextjs`), protecting the host system from container breakout attacks.
