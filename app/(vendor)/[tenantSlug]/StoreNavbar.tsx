"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QueueModal } from "./QueueModal"

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Productos", href: "#productos" },
  { label: "Horario", href: "#horario" },
  { label: "Contacto", href: "#contacto" },
]

interface Props {
  storeName: string
  logoUrl: string | null
  isLive: boolean
  primaryColor: string
  tenantSlug: string
}

export function StoreNavbar({ storeName, logoUrl, isLive, primaryColor, tenantSlug }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + name */}
        <a href="#inicio" className="flex items-center gap-2.5 flex-shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: primaryColor }}>
              {storeName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="font-bold text-gray-900 text-sm truncate max-w-[140px]">{storeName}</span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <a key={item.href} href={item.href}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isLive ? "animate-pulse" : ""}`}
              style={{ backgroundColor: isLive ? primaryColor : "#d1d5db" }} />
            <span className="text-xs font-medium" style={{ color: isLive ? primaryColor : "#9ca3af" }}>
              {isLive ? "En directo" : "Offline"}
            </span>
          </div>

          <div className="hidden md:block">
            <QueueModal tenantSlug={tenantSlug} primaryColor={primaryColor} />
          </div>

          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
            aria-label="Menú"
          >
            <motion.span animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
              className="block w-5 h-0.5 bg-gray-800 origin-center" />
            <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }}
              className="block w-5 h-0.5 bg-gray-800" />
            <motion.span animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }}
              className="block w-5 h-0.5 bg-gray-800 origin-center" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
          >
            <nav className="px-6 py-4 flex flex-col gap-1">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className="text-sm text-gray-700 hover:text-gray-900 py-3 border-b border-gray-50 transition-colors">
                  {item.label}
                </a>
              ))}
              <div className="pt-4">
                <QueueModal tenantSlug={tenantSlug} primaryColor={primaryColor} />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
