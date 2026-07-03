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

// Configure text search index for fast keyword matching
DocumentSchema.index({ title: "text", content: "text", tags: "text" });

export const Document = mongoose.models.Document || mongoose.model<IDocument>("Document", DocumentSchema);
