import type { Metadata } from "next"
import "./globals.css"
import { Manrope, DM_Serif_Display } from "next/font/google"
import { cn } from "@/lib/utils"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" })
const dmSerifDisplay = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" })

export const metadata: Metadata = {
  title: "FrescoEnVivo",
  description: "Vende tus productos frescos en directo",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("font-sans", manrope.variable, dmSerifDisplay.variable)}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
