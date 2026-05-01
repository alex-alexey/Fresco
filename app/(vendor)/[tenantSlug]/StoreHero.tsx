"use client"

import { motion } from "framer-motion"
import { QueueModal } from "./QueueModal"

interface Social {
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
}

interface Props {
  storeName: string
  description: string
  logoUrl: string | null
  isLive: boolean
  primaryColor: string
  social: Social
  tenantSlug: string
}

function SocialIcon({ type }: { type: string }) {
  if (type === "instagram") return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
  if (type === "facebook") return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
    </svg>
  )
}

export function StoreHero({ storeName, description, logoUrl, isLive, primaryColor, social, tenantSlug }: Props) {
  const hasSocial = social.instagram || social.facebook || social.tiktok

  return (
    <div
      className="relative pt-28 pb-16 px-4 text-center overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${primaryColor}18 0%, white 60%)` }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: primaryColor, transform: "translate(30%, -30%)" }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ backgroundColor: primaryColor, transform: "translate(-30%, 30%)" }} />

      <div className="relative max-w-lg mx-auto space-y-5">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {storeName.charAt(0).toUpperCase()}
            </div>
          )}
        </motion.div>

        {/* Name + live badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-2"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{storeName}</h1>
          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${isLive ? "animate-pulse" : ""}`}
              style={{ backgroundColor: isLive ? primaryColor : "#d1d5db" }}
            />
            <span className="text-sm font-medium" style={{ color: isLive ? primaryColor : "#9ca3af" }}>
              {isLive ? "En directo ahora" : "Offline"}
            </span>
          </div>
        </motion.div>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-gray-500 leading-relaxed text-sm sm:text-base"
          >
            {description}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <QueueModal tenantSlug={tenantSlug} primaryColor={primaryColor} />
        </motion.div>

        {/* Social */}
        {hasSocial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex items-center justify-center gap-4 pt-1"
          >
            {social.instagram && (
              <a href={`https://instagram.com/${social.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60" style={{ color: primaryColor }}>
                <SocialIcon type="instagram" />
              </a>
            )}
            {social.facebook && (
              <a href={`https://facebook.com/${social.facebook}`} target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60" style={{ color: primaryColor }}>
                <SocialIcon type="facebook" />
              </a>
            )}
            {social.tiktok && (
              <a href={`https://tiktok.com/@${social.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60" style={{ color: primaryColor }}>
                <SocialIcon type="tiktok" />
              </a>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
