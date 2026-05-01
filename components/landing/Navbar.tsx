"use client"

import { useState, useEffect } from "react"
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
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-white/80 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="h-14 rounded-full border border-white/70 bg-white/75 shadow-lg shadow-emerald-100/40 backdrop-blur-xl px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
            </span>
            <span className="font-semibold text-lg tracking-tight text-slate-800">FrescoEnVivo</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#contacto"
              className="text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-full transition-colors hidden md:block"
            >
              Contactar ahora
            </a>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5"
              aria-label="Menú"
            >
              <span className="block w-5 h-0.5 bg-gray-800 origin-center" />
              <span className="block w-5 h-0.5 bg-gray-800" />
              <span className="block w-5 h-0.5 bg-gray-800 origin-center" />
            </button>
          </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden overflow-hidden border-t border-gray-100 bg-white">
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
                  href="#contacto"
                  onClick={handleNavClick}
                  className="text-sm text-center font-medium bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-full transition-colors"
                >
                  Contactar ahora
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
