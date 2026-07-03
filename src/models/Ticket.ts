import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface ITicketMessage {
  id: string;
  sender: "customer" | "agent" | "system";
  senderName: string;
  text: string;
  timestamp: string;
}

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

const TicketMessageSchema = new Schema<ITicketMessage>({
  id: { type: String, required: true },
  sender: { type: String, enum: ["customer", "agent", "system"], required: true },
  senderName: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
});

const TicketSchema = new Schema<ITicket>({
  id: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  clientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  assignedAgent: { type: String, default: "Unassigned" },
  assignedAgentId: { type: Schema.Types.ObjectId, ref: "User" },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high", "urgent"], 
    default: "medium" 
  },
  status: { 
    type: String, 
    enum: ["open", "pending", "resolved", "closed"], 
    default: "open" 
  },
  category: { 
    type: String, 
    enum: ["Billing", "Technical", "Account", "Feedback"], 
    required: true 
  },
  lastUpdated: { type: String, required: true },
  createdAt: { type: String, required: true },
  summary: { type: String, default: "" },
  sentiment: { type: String, enum: ["positive", "neutral", "negative"], default: "neutral" },
  recommendedPriority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  suggestedTags: { type: [String], default: [] },
  internalNotes: { type: [String], default: [] },
  messages: { type: [TicketMessageSchema], default: [] },
});

// Configure indexes for fast filtering and sorting
TicketSchema.index({ clientId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ lastUpdated: -1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>("Ticket", TicketSchema);
