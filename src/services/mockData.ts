export interface Document {
  id: string;
  title: string;
  category: "HR" | "Engineering" | "Finance" | "Legal" | "Marketing";
  content: string;
  date: string;
  tags: string[];
  views: number;
  isBookmarked: boolean;
}

export interface TicketMessage {
  id: string;
  sender: "customer" | "agent" | "system";
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  customerName: string;
  customerEmail: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "pending" | "resolved" | "closed";
  category: "Billing" | "Technical" | "Account" | "Feedback";
  assignedAgent: string;
  lastUpdated: string;
  createdAt: string;
  messages: TicketMessage[];
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  recommendedPriority: "low" | "medium" | "high" | "urgent";
  suggestedTags: string[];
  internalNotes: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  promptText: string;
  category: "Writing" | "Development" | "Analysis" | "Business";
  tokensUsed: number;
}

export interface AnalyticsStats {
  searchesToday: number;
  ticketsResolved: number;
  activeUsers: number;
  promptUsage: number;
  averageResolutionTime: string;
  ticketsTrend: { date: string; resolved: number; open: number }[];
  searchesDistribution: { name: string; value: number }[];
}

// 1. Mock Documents (KnowledgeAI)
export const mockDocuments: Document[] = [
  {
    id: "doc-1",
    title: "Synapse Employee Leave & Vacation Policy",
    category: "HR",
    content: `
# Synapse Employee Leave & Vacation Policy
**Document Reference: HR-POL-042**  
**Effective Date: January 1, 2026**

## 1. Overview
Synapse Technologies Pvt. Ltd. believes in maintaining a healthy work-life balance for all employees. This document outlines the categories of leaves available, eligibility criteria, and the approval workflow.

## 2. Leave Categories
*   **Annual Paid Leave (Privilege Leave - PL):** 18 days per calendar year. Accrued monthly.
*   **Sick & Casual Leave (SCL):** 12 days per calendar year. Granted upfront.
*   **Maternity Leave:** 26 weeks of paid leave for female employees.
*   **Paternity Leave:** 10 working days of paid leave for new fathers.
*   **Bereavement Leave:** Up to 5 days of paid leave in the event of a death in the immediate family.

## 3. Applying for Leave
1.  Log in to the **Synapse HR Portal**.
2.  Navigate to **Leave Management** and select "Apply for Leave".
3.  Choose the leave dates, category, and provide a backup contact or project hand-over note if applying for PL longer than 3 consecutive days.
4.  Submit for manager approval. Approval should be sought at least **2 weeks in advance** for planned PL.

## 4. Carry Forward Guidelines
A maximum of 10 unused Privilege Leaves can be carried forward to the next calendar year. Casual leaves cannot be carried forward and will lapse on December 31st.
    `,
    date: "2026-01-15",
    tags: ["leave", "hr policy", "holiday", "employee benefits"],
    views: 1240,
    isBookmarked: false,
  },
  {
    id: "doc-2",
    title: "Expense Reimbursement & Travel Policy Guidelines",
    category: "Finance",
    content: `
# Expense Reimbursement & Travel Policy Guidelines
**Document Reference: FIN-POL-018**  
**Effective Date: March 1, 2026**

## 1. General Principles
Employees will be reimbursed for reasonable business-related expenses incurred on behalf of Synapse Technologies. All claims must be accompanied by valid tax invoices or payment receipts.

## 2. Eligible Expenses
*   **Business Travel:** Flights must be booked through the company portal (Synapse Travel Desk). Economy class is standard.
*   **Accommodation:** Maximum booking rates depend on the city tier (Tier 1: $150/night, Tier 2: $100/night).
*   **Client Meals:** Reimbursable up to $50 per head, subject to approval from the department head.
*   **Local Conveyance:** Business cabs or personal vehicle mileage ($0.60 per mile).

## 3. Reimbursement Submission Process
1.  Save all receipt PDFs or images.
2.  Create an expense claim form in the **Synapse Finance Platform**.
3.  Group expenses by client project or department budget code.
4.  Submit within **30 days** of incurring the expense.
5.  Reimbursements are processed on the **10th and 25th** of each month after approval.
    `,
    date: "2026-03-01",
    tags: ["finance", "reimbursement", "travel", "expense claims"],
    views: 940,
    isBookmarked: false,
  },
  {
    id: "doc-3",
    title: "Production Deployment Pipeline & Coding Standards",
    category: "Engineering",
    content: `
# Production Deployment Pipeline & Coding Standards
**Document Reference: ENG-REF-001**  
**Effective Date: February 10, 2026**

## 1. Code Quality & Formatting
*   All code must follow the established ESLint and Prettier configs.
*   TypeScript is mandatory. Avoid using the \`any\` type unless absolutely justified with a comment.
*   Run unit tests locally (\`npm test\`) before pushing. Minimum test coverage requirement is **80%**.

## 2. Branching Strategy
We use GitFlow:
*   \`main\`: Production-ready code.
*   \`develop\`: Integration branch for features.
*   \`feature/*\`: Individual feature branches branch off \`develop\`.
*   PRs require at least **two engineering approvals** before merging to \`develop\`.

## 3. CI/CD Deployment Flow
Our pipeline runs on GitHub Actions and deploys to AWS/Vercel:
1.  **Commit Hook:** Run lint check and type compilation.
2.  **Pull Request Build:** Run tests and build static bundle.
3.  **Merge to develop:** Automated deploy to the Staging Environment.
4.  **Tag Release (\`vX.Y.Z\`):** Trigger automated deploy to the Production Environment after manual manager approval.
    `,
    date: "2026-02-10",
    tags: ["git", "deployment", "cicd", "coding standards", "engineering"],
    views: 2010,
    isBookmarked: false,
  },
  {
    id: "doc-4",
    title: "Employee Non-Disclosure & Intellectual Property Agreement",
    category: "Legal",
    content: `
# Employee Non-Disclosure & Intellectual Property Agreement (NDA)
**Document Reference: LGL-AGR-003**  
**Effective Date: On Hire**

## 1. Confidentiality obligations
All employees are required to protect proprietary information belonging to Synapse Technologies Pvt. Ltd. and its clients. This includes:
*   Source code, algorithms, and design systems.
*   Client list, business strategies, and marketing plans.
*   Unpublished financial data.

## 2. Intellectual Property (IP) Ownership
Any code, design, report, document, or invention developed by an employee during their employment with Synapse Technologies is the sole intellectual property of the company. 

## 3. Post-Employment Clauses
Confidentiality obligations persist for **3 years** post-termination. The NDA forbids recruiting Synapse employees or soliciting clients for **1 year** after leaving the company.
    `,
    date: "2026-01-02",
    tags: ["legal", "contract", "nda", "intellectual property", "ip"],
    views: 450,
    isBookmarked: false,
  },
  {
    id: "doc-5",
    title: "Synapse Brand Voice & Social Media Guidelines",
    category: "Marketing",
    content: `
# Synapse Brand Voice & Social Media Guidelines
**Document Reference: MKT-BRD-005**  
**Effective Date: April 12, 2026**

## 1. Brand Personality
Our brand voice is **Helpful, Innovative, Professional, and Transparent**. We avoid corporate jargon, but maintain a clear, authoritative, and polite tone.

## 2. Channel Guidelines
*   **LinkedIn:** Focus on engineering culture, product milestones, thought leadership articles, and customer success stories.
*   **Twitter/X:** Fast, conversational updates, developer relations, participating in technical threads, retweeting industry news.
*   **Blog:** Deep-dive engineering tutorials, AI integration patterns, and operational dashboard strategies.

## 3. Social Media Code of Conduct
*   Never speak on behalf of clients without explicit legal approval.
*   Do not engage in flame wars or negative commentary about competitors.
*   Always route media requests to \`pr@synapse.com\`.
    `,
    date: "2026-04-12",
    tags: ["marketing", "social media", "brand voice", "guidelines"],
    views: 620,
    isBookmarked: false,
  },
];

// 2. Mock Tickets (SupportIQ)
export const mockTickets: SupportTicket[] = [
  {
    id: "SYN-1024",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@techcorp.com",
    priority: "high",
    status: "open",
    category: "Technical",
    assignedAgent: "Aryan Nehe",
    lastUpdated: "2026-07-02T08:30:00Z",
    createdAt: "2026-07-01T10:15:00Z",
    summary: "Customer reporting 500 error when uploading invoice documents to Synapse Portal.",
    sentiment: "negative",
    recommendedPriority: "high",
    suggestedTags: ["API Error", "Document Upload", "500 Internal Error"],
    internalNotes: [
      "Customer is on Enterprise Tier. Urgent attention needed.",
      "Checked backend logs. S3 signature mismatch error occurred on upload endpoint around 10:20 AM.",
    ],
    messages: [
      {
        id: "msg-101",
        sender: "customer",
        senderName: "Sarah Jenkins",
        text: "Hi, I am trying to upload our monthly invoice spreadsheet to the Synapse portal, but every time I submit, I receive a '500 Server Error' message. We need this processed by end of day today. Please help!",
        timestamp: "2026-07-01T10:15:00Z",
      },
      {
        id: "msg-102",
        sender: "agent",
        senderName: "Aryan Nehe",
        text: "Hi Sarah, I apologize for the inconvenience. Our engineering team is currently looking into this signature mismatch error on our S3 upload endpoint. I will update you as soon as I have a fix.",
        timestamp: "2026-07-01T11:00:00Z",
      },
      {
        id: "msg-103",
        sender: "customer",
        senderName: "Sarah Jenkins",
        text: "Thanks Alex. Do you have an ETA? Our accounting team is waiting to close the books.",
        timestamp: "2026-07-02T08:30:00Z",
      },
    ],
  },
  {
    id: "SYN-1025",
    customerName: "David Miller",
    customerEmail: "d.miller@financesolutions.co",
    priority: "medium",
    status: "pending",
    category: "Billing",
    assignedAgent: "Jessica Chen",
    lastUpdated: "2026-07-02T07:15:00Z",
    createdAt: "2026-07-01T14:20:00Z",
    summary: "Discrepancy in June subscription charge. Charged for 50 seats instead of 40.",
    sentiment: "neutral",
    recommendedPriority: "medium",
    suggestedTags: ["Billing Dispute", "Seat Allocation", "Stripe Charge"],
    internalNotes: [
      "Stripe logs show seat count updated from 40 to 50 on June 5th. Need customer to confirm user logs.",
    ],
    messages: [
      {
        id: "msg-201",
        sender: "customer",
        senderName: "David Miller",
        text: "Hello, our latest invoice lists 50 active seats, but our admin portal shows only 40 users registered last month. We would like a credit for the extra 10 seats that were charged.",
        timestamp: "2026-07-01T14:20:00Z",
      },
      {
        id: "msg-202",
        sender: "agent",
        senderName: "Jessica Chen",
        text: "Hello David, I am investigating this for you. According to our billing system, the subscription seat allocation was increased on June 5th. I will check the user registration history logs to see if those seats were actually occupied or created in error. Will get back to you shortly.",
        timestamp: "2026-07-02T07:15:00Z",
      },
    ],
  },
  {
    id: "SYN-1026",
    customerName: "Markus Aurel",
    customerEmail: "markus@gladiustech.io",
    priority: "urgent",
    status: "open",
    category: "Technical",
    assignedAgent: "Aryan Nehe",
    lastUpdated: "2026-07-02T09:00:00Z",
    createdAt: "2026-07-02T08:45:00Z",
    summary: "API Webhooks failing to deliver events to client servers, blocking sync.",
    sentiment: "negative",
    recommendedPriority: "urgent",
    suggestedTags: ["Webhook Failure", "Sync Blocked", "High Priority"],
    internalNotes: [
      "Webhook logs show 403 Forbidden responses from customer endpoint, but customer claims no firewall changes.",
    ],
    messages: [
      {
        id: "msg-301",
        sender: "customer",
        senderName: "Markus Aurel",
        text: "URGENT: All webhooks from Synapse to our server are failing. This is blocking our core production synchronization. We are getting zero data syncs for the last hour.",
        timestamp: "2026-07-02T08:45:00Z",
      },
    ],
  },
  {
    id: "SYN-1027",
    customerName: "Linda Thompson",
    customerEmail: "linda.t@marketspace.org",
    priority: "low",
    status: "resolved",
    category: "Account",
    assignedAgent: "Jessica Chen",
    lastUpdated: "2026-07-01T16:00:00Z",
    createdAt: "2026-06-30T09:00:00Z",
    summary: "Requesting instruction on how to enable MFA for team members.",
    sentiment: "positive",
    recommendedPriority: "low",
    suggestedTags: ["MFA Setup", "Security", "How-To"],
    internalNotes: [
      "Resolved by sharing the Security Setup document.",
    ],
    messages: [
      {
        id: "msg-401",
        sender: "customer",
        senderName: "Linda Thompson",
        text: "Hi, we want to enforce Multi-Factor Authentication (MFA) for our entire company profile. Can you guide me on where this option is in the admin panel?",
        timestamp: "2026-06-30T09:00:00Z",
      },
      {
        id: "msg-402",
        sender: "agent",
        senderName: "Jessica Chen",
        text: "Hi Linda! Sure thing. The owner or admin of the workspace can toggle MFA by going to Settings > Security > Multi-Factor Authentication and switching it to 'Enforced'. I have attached our security guide document.",
        timestamp: "2026-06-30T10:30:00Z",
      },
      {
        id: "msg-403",
        sender: "customer",
        senderName: "Linda Thompson",
        text: "Got it, worked perfectly. Thanks for the quick response, you can close this ticket!",
        timestamp: "2026-07-01T15:30:00Z",
      },
      {
        id: "msg-404",
        sender: "system",
        senderName: "System",
        text: "Ticket marked as RESOLVED by Jessica Chen.",
        timestamp: "2026-07-01T16:00:00Z",
      },
    ],
  },
];

// 3. Mock Prompt Templates (PromptForge AI)
export const mockPrompts: PromptTemplate[] = [
  {
    id: "p-1",
    name: "Summarize Enterprise Article",
    description: "Generates a structured TL;DR summary, key takeaways, and action items from documentation.",
    category: "Writing",
    promptText: "Summarize the following document into a single short paragraph, followed by a bulleted list of the 3 most important takeaways, and any action items:\n\n[Paste Document Here]",
    tokensUsed: 420,
  },
  {
    id: "p-2",
    name: "Refactor JavaScript to TypeScript",
    description: "Converts plain JavaScript code block to typed TypeScript, defining interfaces where appropriate.",
    category: "Development",
    promptText: "Convert this JavaScript code block into clean, robust TypeScript. Define interfaces for any objects, use strict type annotations, and explain any design choices you make:\n\n```javascript\n\n```",
    tokensUsed: 780,
  },
  {
    id: "p-3",
    name: "Draft Customer Ticket Reply",
    description: "Drafts a professional support response based on customer ticket details and troubleshooting logs.",
    category: "Business",
    promptText: "You are an expert customer support agent for Synapse Technologies. Draft a helpful, polite, and technical reply to the following customer message. Be transparent about issues, offer clear solutions, and maintain a friendly tone:\n\nCustomer Issue:\n",
    tokensUsed: 350,
  },
  {
    id: "p-4",
    name: "Generate SQL Database Query",
    description: "Write clean SQL queries based on database schema definitions and plain english requests.",
    category: "Development",
    promptText: "Given a schema with tables `users` (id, name, email, created_at), `tickets` (id, user_id, priority, status, created_at), and `replies` (id, ticket_id, text, sent_at), write an SQL query that:\n\n",
    tokensUsed: 620,
  },
  {
    id: "p-5",
    name: "Analyze Customer Sentiment",
    description: "Inspect customer messages for underlying sentiment markers, reporting emotional rating and tone analysis.",
    category: "Analysis",
    promptText: "Perform a sentiment analysis on the following customer message. Provide a rating (Positive, Neutral, Negative), identify key emotional trigger words, and recommend a response strategy:\n\nMessage:\n",
    tokensUsed: 290,
  },
];

// 4. Mock Analytics (Analytics Hub)
export const mockAnalytics: AnalyticsStats = {
  searchesToday: 342,
  ticketsResolved: 24,
  activeUsers: 87,
  promptUsage: 145,
  averageResolutionTime: "2.4 hrs",
  ticketsTrend: [
    { date: "June 26", resolved: 15, open: 12 },
    { date: "June 27", resolved: 18, open: 15 },
    { date: "June 28", resolved: 22, open: 10 },
    { date: "June 29", resolved: 20, open: 8 },
    { date: "June 30", resolved: 25, open: 14 },
    { date: "July 1", resolved: 28, open: 18 },
    { date: "July 2", resolved: 24, open: 15 },
  ],
  searchesDistribution: [
    { name: "HR", value: 35 },
    { name: "Engineering", value: 45 },
    { name: "Finance", value: 20 },
    { name: "Legal", value: 10 },
    { name: "Marketing", value: 15 },
  ],
};
