import { Navbar } from "@/components/landing/Navbar"
import { Hero } from "@/components/landing/Hero"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { Features } from "@/components/landing/Features"
import { Pricing } from "@/components/landing/Pricing"
import { ContactForm } from "@/components/landing/ContactForm"
import { CtaSection } from "@/components/landing/CtaSection"
import { Footer } from "@/components/landing/Footer"

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <ContactForm />
      <CtaSection />
      <Footer />
    </>
  )
}
