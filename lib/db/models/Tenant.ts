import mongoose, { Schema, Model } from "mongoose"

export type TenantStatus = "active" | "suspended" | "pending"
export type CustomDomainStatus = "none" | "pending" | "active" | "failed"

export interface IBilling {
  name: string
  taxId: string
  address: string
  postalCode: string
  city: string
  country: string
}

export interface ITenant {
  _id: mongoose.Types.ObjectId
  slug: string
  name: string
  email: string
  customDomain?: string | null
  customDomainStatus: CustomDomainStatus
  customDomainVerifiedAt?: Date | null
  planId: mongoose.Types.ObjectId
  dbName: string
  status: TenantStatus
  planStartedAt: Date
  planExpiresAt: Date
  billing: IBilling
  createdAt: Date
  updatedAt: Date
}

const TenantSchema = new Schema<ITenant>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    customDomain: { type: String, unique: true, sparse: true, lowercase: true, trim: true, default: null },
    customDomainStatus: { type: String, enum: ["none", "pending", "active", "failed"], default: "none" },
    customDomainVerifiedAt: { type: Date, default: null },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    dbName: { type: String, required: true, unique: true },
    status: { type: String, enum: ["active", "suspended", "pending"], default: "active" },
    planStartedAt: { type: Date, required: true },
    planExpiresAt: { type: Date, required: true },
    billing: {
      name: { type: String, required: true, trim: true },
      taxId: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
  },
  { timestamps: true }
)

TenantSchema.index({ status: 1 })

export const Tenant: Model<ITenant> =
  mongoose.models.Tenant ?? mongoose.model<ITenant>("Tenant", TenantSchema)
