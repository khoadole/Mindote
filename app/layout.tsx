import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppProvider } from "@/lib/app-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { QueryProvider } from "@/lib/query-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mindote - English Learning App",
  description:
    "Learn English vocabulary with flashcards, quizzes, and YouTube integration",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <Suspense fallback={null}>
          <QueryProvider>
            <AppProvider>
              <ThemeProvider>
                {children}
                <Toaster />
              </ThemeProvider>
            </AppProvider>
          </QueryProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
