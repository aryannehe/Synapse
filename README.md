# Synapse Workspace — Corporate Command Portal
**Synapse Technologies Pvt. Ltd. Internal Operations Control Center**

Welcome to the official repository of **Synapse Workspace**, the centralized command center built for employees of **Synapse Technologies Pvt. Ltd.** This single Next.js enterprise SaaS application unifies three separate operational dimensions under a shared authentication session, global appearance standard, and unified state store.

---

## 🚀 Key Modules & SaaS Features

1. **Analytics Hub (Homepage)**:
   - Dynamic KPI performance meters summarizing daily search counts, ticketing SLA statistics, prompt usage counters, and average resolution times.
   - Interactive SVG charting using `recharts` detailing weekly resolved ticket metrics and search query distributions by department.
   - Live activity feeds mapping most popular HR/Engineering documents and recent prompt executions.

2. **Knowledge (Intelligent Search)**:
   - Natural language search bar with autocomplete dropdown suggestions sourced from recent employee searches.
   - Custom **AI Answer Cards** synthesizing response summaries with circular confidence ratings, references, and related follow-up prompts.
   - Live **Intelligent Document Generation**: If a search query matches no archived records, our service layers dynamically draft a customized operational policy document and render it in real-time.
   - Slide-out reading drawer rendering rich Markdown articles, complete with bookmarking/favoriting flags.

3. **Support (Customer Tickets Board)**:
   - Priority-categorized summary statistics and interactive data tables supporting deep-filtering and string searches.
   - Dual-tab conversation panels letting agents toggle between the client message thread and private internal staff notes.
   - **SupportIQ AI Assistant Panel**: Summarizes the ticket context, rates customer sentiment, recommends priority level, suggests tags, and drafts autocomplete replies that can be inserted into the textarea.

4. **Assistant (AI Prompt Playground)**:
   - Sidebar history logger managing multiple distinct chat conversations.
   - Multi-Model LLM Selector to compare outputs across Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, and Llama 3.
   - Real-time word-by-word streaming animation with Markdown rendering.
   - Custom code block components with a one-click copy to clipboard action.
   - Slide-out Prompt Template library for writing, development, business, and SQL queries.
   - Keyboard shortcuts (`Ctrl+K` to focus textarea, `Ctrl+Shift+N` to open a new chat, `Ctrl+Enter` to submit) and export capabilities to Markdown.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **UI Core**: React 19, Lucide React (Icons), Framer Motion (Transitions)
- **Styling**: Tailwind CSS (Tailwind v4 theme variables integration)
- **State Management**: Zustand (Local Storage State Persistence)
- **Server Cache & HTTP**: TanStack Query v5, Axios
- **Markdown Parsing**: React Markdown, React Syntax Highlighter (atomDark theme integration)
- **Language**: TypeScript (Strict type checks)

---

## 💻 Running the System

### 1. Environment Configuration
Copy the template environment configuration file to create your local variables setup:
```bash
cp .env.example .env
```
Ensure you have a running MongoDB instance (e.g. locally at `mongodb://127.0.0.1:27017/synapse-workspace`). The application checks for these variables on startup:
- `MONGODB_URI`: Connection string to MongoDB
- `JWT_SECRET`: Signing key for JWT session cookies
- `NEXT_PUBLIC_DEMO_MODE`: Gating flag to show demo credentials auto-fill buttons (set to `true` for reviewers)

### 2. Install Project Dependencies
Run npm installations to load libraries and devDependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Running Unit Tests
Execute the Vitest automated test suite to verify JWT authentication helpers, Mongoose connectivity exports, and class merging utilities:
```bash
npm run test
```

### 4. Running Locally
Launch the Next.js development server:
```bash
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- **Seeding note**: Visiting the app and clicking "Sign In" will automatically seed default accounts on the fly. To manually wipe and reset database mock data at any time, log in as **Admin Manager** and query the confirmation seed URL:
  👉 `http://localhost:3000/api/seed?confirm=true`

### 5. Running with Docker (Recommended)
You can launch the entire application stack (Next.js web container + MongoDB container) using Docker Compose:
```bash
docker-compose up --build
```
This boots the containers, binds internal ports, maps database volumes for persistence, and serves the application at [http://localhost:3000](http://localhost:3000).

---

## 🔑 Demo Access Credentials
For reviewer validation and demonstration purposes, please use the following pre-configured database credentials to bypass the identity gate:

- **Admin Manager:** `admin@synapse.com` / Password: `admin@1234`
- **Employee Agent:** `aryan.nehe@synapse.com` / Password: `emp#123`
- **Customer Client:** `sarah.j@techcorp.com` / Password: `cli@123`

### 6. Production Compilation
To bundle the optimized static pages and server route handlers:
```bash
npm run build
```
