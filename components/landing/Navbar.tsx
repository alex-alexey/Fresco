"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

const NAV = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Características", href: "#caracteristicas" },
  { label: "Precios", href: "#precios" },
  { label: "Contacto", href: "#contacto" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  function handleNavClick() {
    setMenuOpen(false)
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
            </span>
            <span className="font-bold text-lg tracking-tight">FrescoEnVivo</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#precios"
              className="text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full transition-colors hidden md:block"
            >
              Empieza gratis
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
              aria-label="Menú"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-gray-800 origin-center"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="block w-5 h-0.5 bg-gray-800"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.2 }}
                className="block w-5 h-0.5 bg-gray-800 origin-center"
              />
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
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <nav className="px-6 py-4 flex flex-col gap-1">
                {NAV.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className="text-sm text-gray-700 hover:text-green-600 py-3 border-b border-gray-50 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="pt-4 flex flex-col gap-2">
                  <a
                    href="#precios"
                    onClick={handleNavClick}
                    className="text-sm text-center font-medium bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full transition-colors"
                  >
                    Empieza gratis
                  </a>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}
