import type React from "react";
import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProvider } from "@/lib/app-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { TranslationProvider } from "@/lib/i18n-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mindote.app"),
  title: {
    default: "Mindote - Language Learning App",
    template: "%s | Mindote",
  },
  description:
    "Master vocabulary with spaced repetition flashcards. Our AI-powered system shows you words exactly when you need to review them. Smart Flashcards, Immersive Reading, and more.",
  keywords: [
    "language learning",
    "vocabulary",
    "flashcards",
    "spaced repetition",
    "english learning",
    "toeic",
    "ielts",
    "ai learning",
  ],
  authors: [{ name: "Mindote Team" }],
  creator: "Mindote",
  publisher: "Mindote",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mindote.app",
    title: "Mindote - Language Learning App",
    description:
      "Master vocabulary with spaced repetition flashcards. AI-powered learning system.",
    siteName: "Mindote",
    images: [
      {
        url: "/mindote_full.jpg",
        width: 1200,
        height: 630,
        alt: "Mindote App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindote - Language Learning App",
    description:
      "Master vocabulary with spaced repetition flashcards. AI-powered learning system.",
    images: ["/mindote_full.jpg"],
    creator: "@mindote_app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Critical CSS - Prevent background flash */
              :root {
                color-scheme: light dark;
                --background: oklch(1 0 0);
                --sidebar: oklch(0.9 0.008 265);
              }
              
              .dark {
                color-scheme: dark;
                --background: oklch(0.13 0.02 265);
                --sidebar: oklch(0.1 0.02 265);
              }
              
              /* Ensure body and sidebar have immediate background */
              html, body {
                background-color: oklch(1 0 0);
              }
              
              .dark, .dark body {
                background-color: oklch(0.13 0.02 265);
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const root = document.documentElement;
                  
                  // Read theme from unified localStorage key
                  const savedTheme = localStorage.getItem('mindote-theme');
                  const theme = savedTheme || 'dark'; // Default to dark
                  
                  // Apply theme immediately to prevent flash
                  if (theme === 'system') {
                    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    root.classList.add(systemTheme);
                  } else {
                    root.classList.add(theme);
                  }
                } catch (e) {
                  // Fallback to dark on error
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Mindote",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Master vocabulary with spaced repetition flashcards. Our AI-powered system shows you words exactly when you need to review them.",
              "image": "https://mindote.app/mindote_full.jpg",
              "logo": "https://mindote.app/icon.png",
              "url": "https://mindote.app",
              "author": {
                "@type": "Organization",
                "name": "Mindote Team",
                "url": "https://mindote.app"
              }
            }),
          }}
        />
      </head>
      <body className={`${openSans.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <QueryProvider>
            <AppProvider>
              <ThemeProvider>
                <TranslationProvider>
                  {children}
                  <Toaster />
                </TranslationProvider>
              </ThemeProvider>
            </AppProvider>
          </QueryProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
