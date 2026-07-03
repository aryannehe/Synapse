import mongoose, { Schema, Document as MongooseDocument } from "mongoose";

export interface IUser extends MongooseDocument {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "employee" | "client";
  avatar: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee", "client"], default: "client" },
  avatar: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
