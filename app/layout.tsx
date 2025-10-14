import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/next";
import { AppProvider } from "@/lib/app-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindote - English Learning App",
  description:
    "Learn English vocabulary with flashcards, quizzes, and YouTube integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('mindote-storage');
                  if (stored) {
                    const { state } = JSON.parse(stored);
                    const theme = state?.settings?.theme || 'dark';
                    const root = document.documentElement;
                    
                    if (theme === 'system') {
                      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      root.classList.add(systemTheme);
                    } else {
                      root.classList.add(theme);
                    }
                  } else {
                    // Default to dark if no stored preference
                    root.classList.add('dark');
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
  );
}
