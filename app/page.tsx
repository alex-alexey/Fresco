import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Features } from "@/components/landing/Features"
import { Pricing } from "@/components/landing/Pricing"
import { ContactForm } from "@/components/landing/ContactForm"
import { CtaSection } from "@/components/landing/CtaSection"
import { Footer } from "@/components/landing/Footer"
import { PublicStorefront } from "@/components/storefront/PublicStorefront"
import { getPublicStorefrontByHost } from "@/lib/storefront"
import { isPrimaryAppHost, normalizeHost } from "@/lib/domains"

export default async function LandingPage() {
  const requestHeaders = await headers()
  const requestHost = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"))

  if (requestHost && !isPrimaryAppHost(requestHost)) {
    const storefront = await getPublicStorefrontByHost(requestHost)
    if (!storefront) notFound()
    return <PublicStorefront storefront={storefront} />
  }

  return (
    <main className="landing-shell relative overflow-x-clip">
      <div className="landing-grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[520px]" />
      <div className="pointer-events-none absolute -left-24 top-36 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[420px] h-80 w-80 rounded-full bg-cyan-200/40 blur-3xl" />
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <ContactForm />
      <CtaSection />
      <Footer />
    </main>
  )
}
