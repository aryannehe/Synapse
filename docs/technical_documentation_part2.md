# Synapse Workspace — Principal Technical & Architectural Documentation (Part 2)

This manual covers the **Mongoose Database Schemas** and **Authentication API Endpoints** in detail.

---

# 📂 Batch 2: Database Schema Models

---

# File: src/models/User.ts

### 1. Purpose of the File
`src/models/User.ts` declares the Mongoose entity schema representing registered accounts inside MongoDB. It belongs to the **Database Model Layer**.
Without this file, the application would have no formal database mapping structure for user accounts, preventing session logins, registration indexing, and role audits.
- **Responsibilities**:
  - Defines the `IUser` TypeScript interface matching database parameters.
  - Generates the MongoDB `User` collection schema.
  - Enforces database-level uniqueness on user emails.
- **Inputs**: Document fields compiled during signup or seeding.
- **Outputs**: Instantiated User database document structures.
- **Dependencies**: `mongoose`.

### 2. High-Level Overview
This file translates user metadata (name, email, hashed password, security role, avatar URL) into Mongoose models. It coordinates schema validation rules (e.g. valid role enums: `"admin"`, `"employee"`, `"client"`) before changes are persisted to MongoDB.

### 3. Detailed Code Walkthrough
```typescript
import mongoose, { Schema, Document as MongooseDocument } from "mongoose";
```
- **Line 1**: Imports the standard Mongoose client types and schema decorators.

```typescript
export interface IUser extends MongooseDocument {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "employee" | "client";
  avatar: string;
  createdAt: Date;
}
```
- **Line 3-10**: Declares the TypeScript interface representing a MongoDB User document, inheriting from the standard `MongooseDocument` base class.

```typescript
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee", "client"], default: "client" },
  avatar: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
```
- **Line 12-19**: Instantiates the schema mapping fields to Mongoose data types, and configures database indexing options (`unique: true` on `email`).

```typescript
export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
```
- **Line 21**: Hot-reloading safe model compilation. Reuses compiled schemas to prevent model recompilation errors in Next.js development.

### 4. Function-Level Analysis
*(No executable functions are declared; it compiles database models).*

### 5. Class-Level Analysis
*(No Classes are declared; Mongoose handles document instantiations).*

### 6. Algorithms Used
- **Schema Mapping Compilation**: Generates standard JSON schemas for database storage.

### 7. Mathematical Concepts
*(No mathematical concepts exist inside this schema).*

### 8. Data Structures
- **Mongoose Document Model**: Handles MongoDB data mappings.

### 9. Libraries and Frameworks
- **Mongoose**: Standard MongoDB ORM wrapper.

### 10. Design Patterns
- **Active Record / Model Pattern**: Maps data objects directly to database tables.

### 11. Architecture Contribution
- **Upstream**: Imported by auth routines (`auth.ts`), registration/login API routes, and profile controllers.
- **Downstream**: Persists changes to the `users` MongoDB collection.

### 12. Execution Flow
- Module imported ➔ Check cache in `mongoose.models` ➔ Return model reference.

### 13. Database Analysis
- Configures the `users` collection.
- Enforces a unique index on the `email` column to optimize queries.

### 14. API Analysis
- Provides structural type definitions for the API payloads.

### 15. Security Analysis
- Enforces email uniqueness, blocking duplicate registration attempts.

### 16. Networking and Communication
- Maps Javascript objects into BSON parameters transmitted over Mongoose sockets.

### 17. Performance Analysis
- The unique index on `email` provides fast $O(\log N)$ BSON query operations.

### 18. Scalability Analysis
- Allows horizontal query distribution across MongoDB database shards.

### 19. Error Handling
- Invalid enum fields throw a validation exception on `.save()` operations.

### 20. Project Workflow
- Register endpoint processes JSON payload ➔ Instantiates `User` model ➔ Saves to database.

### 21. System Architecture
- Sits at the **Data Persistence Layer**.

### 22. Communication Between Components
- Bridges database fields with active route handlers.

### 23. Code Quality Review
- Implements strict Typescript constraints, avoiding compiler errors.

### 24. Possible Improvements
- Add email format regex validation inside the schema definition to enforce clean inputs early.

### 25. Testing Strategy
- Covered by `db.test.ts` imports.

### 26. Interview Questions
- *Q*: Why is `mongoose.models.User || mongoose.model(...)` used instead of just `mongoose.model(...)`?
- *A*: Next.js hot-reloads modules in development. Re-declaring a model with the same name throws a Mongoose compile exception; this fallback prevents recompilation.

### 27. Viva Questions
- *Q*: What does `enum` accomplish inside the schema?
- *A*: It enforces validation constraints at the ODM level, rejecting values that don't match the allowed roles.

### 28. Key Takeaways
- Enforces model interfaces, unique database indexes, and role enum validation constraints.

---

# File: src/models/Ticket.ts

### 1. Purpose of the File
`src/models/Ticket.ts` declares the Mongoose database schema mapping support tickets. It belongs to the **Database Model Layer**.
Without this file, the application would have no structure to save user help requests, notes, or messages.
- **Responsibilities**:
  - Outlines the nested ticket message structure (`ITicketMessage`).
  - Creates the main `Ticket` database schema.
  - Declares filter indexes on query fields (`clientId`, `status`, `lastUpdated`).
- **Inputs**: User ticket registration configurations.
- **Outputs**: Instantiated Ticket database objects.
- **Dependencies**: `mongoose`.

### 2. High-Level Overview
Translates support ticket metadata (summaries, categories, sentiment scores, message history, agent assignments) into MongoDB documents. It handles nested message sub-documents within the parent ticket document, enabling atomic updates.

### 3. Detailed Code Walkthrough
```typescript
import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface ITicketMessage {
  id: string;
  sender: "customer" | "agent" | "system";
  senderName: string;
  text: string;
  timestamp: string;
}
```
- **Line 1-9**: Imports and defines the schema representing a message thread node inside the ticket.

```typescript
export interface ITicket extends MongooseDocument {
  id: string;
  customerName: string;
  customerEmail: string;
  clientId: mongoose.Types.ObjectId;
  assignedAgent: string;
  assignedAgentId?: mongoose.Types.ObjectId;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "resolved" | "closed";
  category: "Billing" | "Technical" | "Account" | "Feedback";
  lastUpdated: string;
  createdAt: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  recommendedPriority: "low" | "medium" | "high" | "urgent";
  suggestedTags: string[];
  internalNotes: string[];
  messages: ITicketMessage[];
}
```
- **Line 11-29**: Declares the ticket document property structure.

```typescript
const TicketSchema = new Schema<ITicket>({
  id: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedAgent: { type: String, default: "Unassigned" },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: "User" },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["open", "pending", "resolved", "closed"], default: "open" },
  category: { type: String, enum: ["Billing", "Technical", "Account", "Feedback"], required: true },
  lastUpdated: { type: String, required: true },
  createdAt: { type: String, required: true },
  summary: { type: String, default: "" },
  sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
  recommendedPriority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  suggestedTags: { type: [String], default: [] },
  internalNotes: { type: [String], default: [] },
  messages: { type: [TicketMessageSchema], default: [] },
});
```
- **Line 39-69**: Main schema declaration. Defines data types, enums, defaults, and the nested `messages` array schema.

```typescript
TicketSchema.index({ clientId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ lastUpdated: -1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);
```
- **Line 71-77**: Indexes setup. Creates database indexes for rapid sorting and filtering by `clientId`, `status`, and `lastUpdated` fields.

### 4. Function-Level Analysis
*(No executable functions are declared; it compiles database models).*

### 5. Class-Level Analysis
*(No Classes are declared; Mongoose handles document instantiations).*

### 6. Algorithms Used
- **Schema Mapping Compilation**: Generates standard JSON schemas for database storage.

### 7. Mathematical Concepts
*(No mathematical concepts exist inside this schema).*

### 8. Data Structures
- **Nested Schema Array**: Mongoose uses arrays of sub-documents (`messages`) to embed chat threads inside the parent document, avoiding expensive database joins.

### 9. Libraries and Frameworks
- **Mongoose**: Standard MongoDB ORM wrapper.

### 10. Design Patterns
- **Active Record / Model Pattern**: Maps data objects directly to database tables.

### 11. Architecture Contribution
- **Upstream**: Loaded by support ticketing list and details API route handlers.
- **Downstream**: Persists changes to the `tickets` MongoDB collection.

### 12. Execution Flow
- Module imported ➔ Check cache in `mongoose.models` ➔ Return model reference.

### 13. Database Analysis
- Configures the `tickets` collection.
- Sets up indexes for quick queries:
  - `clientId: 1` (queries tickets for a specific user)
  - `status: 1` (filters by status: open/closed)
  - `lastUpdated: -1` (sorts tickets by most recent updates)

### 14. API Analysis
- Provides structural type definitions for the API payloads.

### 15. Security Analysis
- The `clientId` field uses a reference type (`Schema.Types.ObjectId`), allowing Mongoose to populate client details securely.

### 16. Networking and Communication
- Maps Javascript objects into BSON parameters transmitted over Mongoose sockets.

### 17. Performance Analysis
- Using database indexes for sorting and filtering prevents slow collections scans.

### 18. Scalability Analysis
- Allows horizontal query distribution across MongoDB database shards.

### 19. Error Handling
- Invalid enum fields throw a validation exception on `.save()` operations.

### 20. Project Workflow
- Ticketing route processes JSON payload ➔ Instantiates `Ticket` model ➔ Saves to database.

### 21. System Architecture
- Sits at the **Data Persistence Layer**.

### 22. Communication Between Components
- Bridges database fields with active route handlers.

### 23. Code Quality Review
- Implements strict Typescript constraints, avoiding compiler errors.

### 24. Possible Improvements
- Add maximum length constraints to the `summary` and message texts to prevent oversized documents.

### 25. Testing Strategy
- Covered by `db.test.ts` imports.

### 26. Interview Questions
- *Q*: Why did we embed messages as sub-documents inside the ticket schema instead of using a separate collection?
- *A*: Embedding is the standard MongoDB design pattern for one-to-many relationships where the child data (messages) is always fetched with the parent (ticket), avoiding expensive database joins.

### 27. Viva Questions
- *Q*: What does `ref: "User"` mean in `clientId`?
- *A*: It tells Mongoose that `clientId` references a document in the `User` collection, enabling populating client details with `.populate()`.

### 28. Key Takeaways
- Enforces model interfaces, unique database indexes, and role enum validation constraints.

---

# File: src/models/Document.ts

### 1. Purpose of the File
`src/models/Document.ts` declares the Mongoose database schema mapping compliance guidelines. It belongs to the **Database Model Layer**.
Without this file, the application would have no structure to save search policies, HR guidelines, or view counts.
- **Responsibilities**:
  - Defines the `IDocument` interface.
  - Instantiates the `Document` database model.
  - Sets up a text search index on title, content, and tags.
- **Inputs**: Policy guidelines configurations.
- **Outputs**: Instantiated Document database objects.
- **Dependencies**: `mongoose`.

### 2. High-Level Overview
Translates corporate guidelines and policies into MongoDB documents. It sets up a text search index covering titles, content, and tags, enabling full-text keyword searches across documents.

### 3. Detailed Code Walkthrough
```typescript
import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IDocument extends MongooseDocument {
  title: string;
  category: "HR" | "Engineering" | "Finance" | "Legal" | "Marketing";
  content: string;
  date: string;
  tags: string[];
  views: number;
  isPublic: boolean;
}
```
- **Line 1-11**: Imports and defines the schema representing a compliance policy document.

```typescript
const DocumentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["HR", "Engineering", "Finance", "Legal", "Marketing"], 
    required: true 
  },
  content: { type: String, required: true },
  date: { type: String, required: true },
  tags: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
});
```
- **Line 13-25**: Main schema declaration. Defines data types, categories, view counts, and publishing states.

```typescript
DocumentSchema.index({ title: "text", content: "text", tags: "text" });

export const Document = mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
```
- **Line 27-29**: Indexes setup. Configures text search indexes for rapid keyword searches across documents.

### 4. Function-Level Analysis
*(No executable functions are declared; it compiles database models).*

### 5. Class-Level Analysis
*(No Classes are declared; Mongoose handles document instantiations).*

### 6. Algorithms Used
- **Text Search Indexing**: Uses Mongoose's internal indexing algorithm to enable fast text searches.

### 7. Mathematical Concepts
*(No mathematical concepts exist inside this schema).*

### 8. Data Structures
- **Text Index**: Used to speed up text queries.

### 9. Libraries and Frameworks
- **Mongoose**: Standard MongoDB ORM wrapper.

### 10. Design Patterns
- **Active Record / Model Pattern**: Maps data objects directly to database tables.

### 11. Architecture Contribution
- **Upstream**: Loaded by knowledge-base search API route handlers.
- **Downstream**: Persists changes to the `documents` MongoDB collection.

### 12. Execution Flow
- Module imported ➔ Check cache in `mongoose.models` ➔ Return model reference.

### 13. Database Analysis
- Configures the `documents` collection.
- Sets up a compound text index on `title`, `content`, and `tags` to support keyword-based text searches.

### 14. API Analysis
- Provides structural type definitions for the API payloads.

### 15. Security Analysis
- The text index uses standard Mongoose configuration, ensuring secure queries.

### 16. Networking and Communication
- Maps Javascript objects into BSON parameters transmitted over Mongoose sockets.

### 17. Performance Analysis
- Using a text index prevents slow collection scans on text queries.

### 18. Scalability Analysis
- Allows horizontal query distribution across MongoDB database shards.

### 19. Error Handling
- Invalid enum fields throw a validation exception on `.save()` operations.

### 20. Project Workflow
- Search route processes keyword query ➔ Runs a text index search ➔ Returns matching documents.

### 21. System Architecture
- Sits at the **Data Persistence Layer**.

### 22. Communication Between Components
- Bridges database fields with active route handlers.

### 23. Code Quality Review
- Implements strict Typescript constraints, avoiding compiler errors.

### 24. Possible Improvements
- Configure text index weights (e.g. give title matches higher priority than content matches) to improve search relevance.

### 25. Testing Strategy
- Covered by `db.test.ts` imports.

### 26. Interview Questions
- *Q*: Why did we create a text search index on the document schema?
- *A*: To enable fast full-text keyword searches across documents, avoiding slow collection scans on text queries.

### 27. Viva Questions
- *Q*: What does `DocumentSchema.index({ title: "text", content: "text", tags: "text" })` accomplish?
- *A*: It creates a compound text index on MongoDB, letting us perform keyword queries like `{ $text: { $search: query } }`.

### 28. Key Takeaways
- Enforces model interfaces, unique database indexes, and role enum validation constraints.

---

# 🌐 Batch 3: Core Authentication API Endpoints

---

# File: src/app/api/auth/login/route.ts

### 1. Purpose of the File
`src/app/api/auth/login/route.ts` manages user authentication request routing. It belongs to the **Authentication API Layer**.
Without this file, the application would have no login API route, preventing users from logging into their accounts.
- **Responsibilities**:
  - Enforces login rate limiting.
  - Auto-seeds default accounts if the database is fresh.
  - Verifies passwords using `bcrypt`.
  - Sets signed session tokens inside secure cookies.
- **Inputs**: HTTP POST request containing `email` and `password`.
- **Outputs**: JSON success response with user metadata, or error details.
- **Dependencies**: `bcryptjs`, `jsonwebtoken`, `next/server`, `@/models/User`, `@/lib/auth`, `@/lib/db`.

### 2. High-Level Overview
Handles login requests. It checks the rate limiter, connects to the database, auto-seeds default user accounts if the database is unseeded, verifies user credentials using `bcrypt.compare`, signs a JWT session token, and sets it as an HTTP-only cookie.

### 3. Detailed Code Walkthrough
```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { signToken } from "@/lib/auth";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
```
- **Line 1-7**: Imports, and instantiates the login rate limiting storage map in memory.

```typescript
function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  record.count += 1;
  return record.count <= limit;
}
```
- **Line 9-27**: Rate Limiting Logic. Tracks failed attempts by IP address. If the rate limit is exceeded, it rejects the request, protecting the system from brute-force attacks.

```typescript
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    
    // Rate limit check: 10 attempts per 15 minutes
    const isAllowed = checkRateLimit(ip, 10, 15 * 60 * 1000);
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many login attempts. Please try again in 15 minutes." }, { status: 429 });
    }
```
- **Line 29-37**: Checks the rate limiter (max 10 login attempts per 15 minutes per IP address).

```typescript
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();
```
- **Line 39-44**: Parses incoming request parameters and connects to MongoDB.

```typescript
    // Auto-seed database if User collection is empty to prevent login failures
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const hashedClientPassword = await bcrypt.hash("cli@123", 10);
      const hashedEmployeePassword = await bcrypt.hash("emp#123", 10);
      const hashedAdminPassword = await bcrypt.hash("admin@1234", 10);

      await User.create([
        { name: "Sarah Jenkins", email: "sarah.j@techcorp.com", password: hashedClientPassword, role: "client", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
        { name: "Aryan Nehe", email: "aryan.nehe@synapse.com", password: hashedEmployeePassword, role: "employee", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aryan" },
        { name: "Global Admin", email: "admin@synapse.com", password: hashedAdminPassword, role: "admin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" }
      ]);
    }
```
- **Line 46-59**: Auto-seeding block. If no accounts exist in the database, it hashes default passwords and seeds client, employee, and admin accounts to ensure immediate system usability.

```typescript
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
```
- **Line 61-71**: Authentication checks. Finds the user by email, and compares the password hash using `bcrypt.compare`.

```typescript
    // Generate JWT
    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      } 
    });

    response.cookies.set("synapse-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
```
- **Line 73-104**: Session setup. Generates a signed JWT token, wraps user metadata in the JSON response, and sets the token cookie with security settings (`httpOnly`, `secure`, `sameSite: "lax"`, `maxAge: 7 days`).

### 4. Function-Level Analysis
#### `checkRateLimit`
- **Purpose**: Tracks failed attempts by IP, blocking brute-force attacks.
- **Parameters**: `ip: string`, `limit: number`, `windowMs: number`.
- **Return**: Boolean indicating if the request is allowed.

#### `POST`
- **Purpose**: Authenticate login requests and issue session cookies.
- **Parameters**: `req: Request`.
- **Return**: NextResponse.

### 5. Class-Level Analysis
*(No Classes are declared in this functional API endpoint).*

### 6. Algorithms Used
- **Bcrypt Password Salting & Hashing**:
  - Uses the Bcrypt adaptive hashing algorithm to verify passwords securely, protecting hashes from rainbow-table attacks.
  - **Complexity**: Execution takes ~80ms (deliberately slow to block brute-force attacks).

### 7. Mathematical Concepts
*(No mathematical concepts exist inside this login helper).*

### 8. Data Structures
- **In-Memory Rate Limiting Map**: Key-value store keyed by client IP addresses.

### 9. Libraries and Frameworks
- **Bcryptjs**: JavaScript implementation of the Bcrypt hashing algorithm.
- **NextResponse**: Next.js HTTP response helpers.

### 10. Design Patterns
- **Active Record / ORM Model pattern**: Locates and updates user documents.
- **In-Memory Cache Rate Limiter**: Limits access requests.

### 11. Architecture Contribution
- **Upstream**: Intercepted by global middleware.
- **Downstream**: Resolves database mappings using User schema models.

### 12. Execution Flow
- POST request starts ➔ Rate limit check ➔ Parse credentials ➔ Connect to DB ➔ Seed DB if empty ➔ Find User ➔ Verify password hash ➔ Sign JWT token ➔ Set cookie ➔ Return success response.

### 13. Database Analysis
- Reads: `User.findOne({ email })`. Uses unique email indexes for fast lookups.
- Writes: Seeds initial accounts if database is fresh.

### 14. API Analysis
- Endpoint: `POST /api/auth/login`.
- Security: Requires credentials payloads, setting `httpOnly` session cookies.

### 15. Security Analysis
- Protects against brute-force attacks using rate limiting.
- Secure hashing prevents plaintext password leaks.
- Secure cookies (`httpOnly: true`) prevent XSS-based session hijacking.

### 16. Networking and Communication
- Writes HTTP headers (`Set-Cookie`) to set the session token.

### 17. Performance Analysis
- The Bcrypt hashing algorithm is CPU-intensive (usually takes ~80ms), which is the primary bottleneck. This delay is intended to slow down brute-force attacks.

### 18. Scalability Analysis
- Uses stateless session cookies, allowing horizontally scaled servers to verify tokens without querying a session database.

### 19. Error Handling
- Wrap operations in try-catch blocks to catch database exceptions, returning HTTP 500 responses.

### 20. Project Workflow
- User enters credentials ➔ Login route verifies credentials ➔ Sets cookie ➔ Redirects user to dashboard.

### 21. System Architecture
- Sits at the **Authentication Layer**.

### 22. Communication Between Components
- Connects frontend forms with backend database models.

### 23. Code Quality Review
- Implements strict validation, preventing empty field submissions.

### 24. Possible Improvements
- Move the auto-seeding logic to an independent script (`npm run seed`) to keep the login route clean.

### 25. Testing Strategy
- Covered by `auth.test.ts` imports.

### 26. Interview Questions
- *Q*: Why did we set `httpOnly: true` on the session cookie?
- *A*: To block client-side scripts from reading the cookie, protecting it from session hijacking via XSS attacks.

### 27. Viva Questions
- *Q*: What does `bcrypt.compare` accomplish?
- *A*: It hashes the incoming password and compares it to the saved database hash using a constant-time comparison algorithm, protecting it from timing attacks.

### 28. Key Takeaways
- Enforces login rate limiting, Bcrypt verification, and secure cookie creation.
