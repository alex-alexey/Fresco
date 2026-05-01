import mongoose, { Schema, Connection, Model } from "mongoose"
import { getTenantConnection } from "@/lib/db/mongodb"
import { tenantDbName } from "@/lib/slug"

export interface ITenantUser {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  role: string
  createdAt: Date
}

export interface IDaySchedule {
  open: string
  close: string
  closed: boolean
}

export interface ISchedule {
  mon: IDaySchedule
  tue: IDaySchedule
  wed: IDaySchedule
  thu: IDaySchedule
  fri: IDaySchedule
  sat: IDaySchedule
}

export interface IProduct {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  imageUrl: string | null
}

export interface ITenantStore {
  _id: mongoose.Types.ObjectId
  name: string
  description: string
  logoUrl: string | null
  isLive: boolean
  activeCameras: number[]
  schedule: ISchedule
  products: IProduct[]
  theme: { primaryColor: string }
  social: { instagram: string | null; facebook: string | null; tiktok: string | null }
  contact: { phone: string | null; email: string | null; address: string | null }
  createdAt: Date
  updatedAt: Date
}

export interface ITenantStream {
  _id: mongoose.Types.ObjectId
  streamId: string
  cameraCount: number
  startedAt: Date
  endedAt: Date | null
}

export interface ITenantQueue {
  _id: mongoose.Types.ObjectId
  customerName: string
  customerPhone: string | null
  position: number
  type: "online" | "presencial"
  status: "waiting" | "called" | "served" | "cancelled"
  callRoom: string | null
  createdAt: Date
}

export interface IBlockedPhone {
  _id: mongoose.Types.ObjectId
  phone: string
  reason: string | null
  blockedAt: Date
}

export interface IStreamSignal {
  _id: mongoose.Types.ObjectId
  viewerId: string
  from: "vendor" | "viewer"
  type: "join" | "offer" | "answer" | "ice-candidate"
  payload: string
  createdAt: Date
}

export interface IWebRTCSignal {
  _id: mongoose.Types.ObjectId
  callRoom: string
  from: "vendor" | "customer"
  type: "offer" | "answer" | "ice-candidate"
  payload: string
  createdAt: Date
}

const UserSchema = new Schema<ITenantUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, default: "vendor" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const DayScheduleSchema = new Schema<IDaySchedule>(
  { open: { type: String, default: "09:00" }, close: { type: String, default: "14:00" }, closed: { type: Boolean, default: false } },
  { _id: false }
)

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  imageUrl: { type: String, default: null },
})

const defaultDay = { open: "09:00", close: "14:00", closed: false }

const StoreSchema = new Schema<ITenantStore>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    logoUrl: { type: String, default: null },
    isLive: { type: Boolean, default: false },
    activeCameras: [{ type: Number }],
    schedule: {
      mon: { type: DayScheduleSchema, default: () => ({ ...defaultDay }) },
      tue: { type: DayScheduleSchema, default: () => ({ ...defaultDay }) },
      wed: { type: DayScheduleSchema, default: () => ({ ...defaultDay }) },
      thu: { type: DayScheduleSchema, default: () => ({ ...defaultDay }) },
      fri: { type: DayScheduleSchema, default: () => ({ ...defaultDay }) },
      sat: { type: DayScheduleSchema, default: () => ({ open: "09:00", close: "13:00", closed: false }) },
    },
    products: [ProductSchema],
    theme: {
      primaryColor: { type: String, default: "#22c55e" },
    },
    social: {
      instagram: { type: String, default: null },
      facebook: { type: String, default: null },
      tiktok: { type: String, default: null },
    },
    contact: {
      phone: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
    },
  },
  { timestamps: true }
)

const StreamSchema = new Schema<ITenantStream>({
  streamId: { type: String, default: "" },
  cameraCount: { type: Number, default: 1 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
})

const QueueSchema = new Schema<ITenantQueue>(
  {
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: null },
    position: { type: Number, required: true, index: true },
    type: { type: String, enum: ["online", "presencial"], required: true },
    status: {
      type: String,
      enum: ["waiting", "called", "served", "cancelled"],
      default: "waiting",
    },
    callRoom: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

const StreamSignalSchema = new Schema<IStreamSignal>(
  {
    viewerId: { type: String, required: true, index: true },
    from: { type: String, enum: ["vendor", "viewer"], required: true },
    type: { type: String, enum: ["join", "offer", "answer", "ice-candidate"], required: true },
    payload: { type: String, default: "{}" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
StreamSignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7200 })
StreamSignalSchema.index({ from: 1, type: 1, createdAt: 1 })

const WebRTCSignalSchema = new Schema<IWebRTCSignal>(
  {
    callRoom: { type: String, required: true, index: true },
    from: { type: String, enum: ["vendor", "customer"], required: true },
    type: { type: String, enum: ["offer", "answer", "ice-candidate"], required: true },
    payload: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)
WebRTCSignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 })

const BlockedPhoneSchema = new Schema<IBlockedPhone>(
  {
    phone: { type: String, required: true, unique: true, trim: true },
    reason: { type: String, default: null },
  },
  { timestamps: { createdAt: "blockedAt", updatedAt: false } }
)

export interface TenantModels {
  User: Model<ITenantUser>
  Store: Model<ITenantStore>
  Stream: Model<ITenantStream>
  Queue: Model<ITenantQueue>
  BlockedPhone: Model<IBlockedPhone>
  WebRTCSignal: Model<IWebRTCSignal>
  StreamSignal: Model<IStreamSignal>
}

export async function getTenantModels(slug: string): Promise<TenantModels> {
  const conn: Connection = await getTenantConnection(tenantDbName(slug))

  return {
    User: (conn.models["User"] ?? conn.model<ITenantUser>("User", UserSchema)) as Model<ITenantUser>,
    Store: (conn.models["Store"] ?? conn.model<ITenantStore>("Store", StoreSchema)) as Model<ITenantStore>,
    Stream: (conn.models["Stream"] ?? conn.model<ITenantStream>("Stream", StreamSchema)) as Model<ITenantStream>,
    Queue: (conn.models["Queue"] ?? conn.model<ITenantQueue>("Queue", QueueSchema)) as Model<ITenantQueue>,
    BlockedPhone: (conn.models["BlockedPhone"] ?? conn.model<IBlockedPhone>("BlockedPhone", BlockedPhoneSchema)) as Model<IBlockedPhone>,
    WebRTCSignal: (conn.models["WebRTCSignal"] ?? conn.model<IWebRTCSignal>("WebRTCSignal", WebRTCSignalSchema)) as Model<IWebRTCSignal>,
    StreamSignal: (conn.models["StreamSignal"] ?? conn.model<IStreamSignal>("StreamSignal", StreamSignalSchema)) as Model<IStreamSignal>,
  }
}

export async function provisionTenantDb(slug: string): Promise<void> {
  const { User, Store, Stream, Queue, BlockedPhone } = await getTenantModels(slug)
  await Promise.all([
    User.createIndexes(),
    Store.createIndexes(),
    Stream.createIndexes(),
    Queue.createIndexes(),
    BlockedPhone.createIndexes(),
  ])
}
