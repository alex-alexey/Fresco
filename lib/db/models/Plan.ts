import mongoose, { Schema, Model } from "mongoose"

export interface IPlan {
  _id: mongoose.Types.ObjectId
  name: string
  maxCameras: number
  maxQueue: number | null
  features: string[]
  priceCents: number
  stripePriceId: string | null
  isActive: boolean
  hardwareCostCents: number
  setupFeeCents: number
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, unique: true },
    maxCameras: { type: Number, required: true },
    maxQueue: { type: Number, default: null },
    features: [{ type: String }],
    priceCents: { type: Number, required: true },
    stripePriceId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    hardwareCostCents: { type: Number, default: 0 },
    setupFeeCents: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const Plan: Model<IPlan> =
  mongoose.models.Plan ?? mongoose.model<IPlan>("Plan", PlanSchema)
