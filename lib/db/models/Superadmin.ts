import mongoose, { Schema, Model } from "mongoose"

export type SuperadminRole = "ADMIN" | "BILLING" | "SUPPORT"

export interface ISuperadmin {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  role: SuperadminRole
  createdAt: Date
}

const SuperadminSchema = new Schema<ISuperadmin>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "BILLING", "SUPPORT"], required: true, default: "SUPPORT" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const Superadmin: Model<ISuperadmin> =
  mongoose.models.Superadmin ?? mongoose.model<ISuperadmin>("Superadmin", SuperadminSchema)
