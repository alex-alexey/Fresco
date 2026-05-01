import type { Metadata } from "next"
import "./globals.css"
import { Geist } from "next/font/google"
import { cn } from "@/lib/utils"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "FrescoEnVivo",
  description: "Vende tus productos frescos en directo",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
