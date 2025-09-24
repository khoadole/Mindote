import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AppProvider } from "@/lib/app-provider"
import { ThemeProvider } from "@/lib/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "WordFlow - English Learning App",
  description: "Learn English vocabulary with flashcards, quizzes, and YouTube integration",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <AppProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </AppProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
