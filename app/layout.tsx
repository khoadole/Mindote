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
  title: "Mindote - Language Learning App",
  description:
    "Learn Language vocabulary with flashcards, quizzes, and YouTube integration",
  icons: {
    icon: {
      url: "/logo_black_transparent_256x256.png",
      sizes: "128x128",
      type: "image/png",
    },
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
                --background: oklch(0.94 0.005 265);
                --sidebar: oklch(0.9 0.008 265);
              }
              
              .dark {
                color-scheme: dark;
                --background: oklch(0.13 0.02 265);
                --sidebar: oklch(0.1 0.02 265);
              }
              
              /* Ensure body and sidebar have immediate background */
              html, body {
                background-color: oklch(0.94 0.005 265);
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
