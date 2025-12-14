"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export default function PrivacyPolicyPage() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border/40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="Mindote Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <h1 className="text-2xl font-bold text-foreground">Mindote</h1>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link href="/">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-lg">
            Last updated: December 2025
          </p>

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Mindote. We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you use our vocabulary learning platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-foreground">Account Information</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, we collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Profile picture (if using social login)</li>
              <li>Authentication credentials</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground">Usage Data</h3>
            <p className="text-muted-foreground leading-relaxed">
              We automatically collect information about how you use Mindote:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Learning progress and statistics</li>
              <li>Vocabulary collections and words saved</li>
              <li>Quiz and flashcard session data</li>
              <li>YouTube videos accessed (for learning history)</li>
              <li>Device type and browser information</li>
              <li>IP address and approximate location</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain our vocabulary learning service</li>
              <li>Track your learning progress and optimize spaced repetition</li>
              <li>Personalize your learning experience</li>
              <li>Process subscription payments (if applicable)</li>
              <li>Send important service updates and notifications</li>
              <li>Improve our platform based on usage patterns</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          {/* AI Features */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">AI-Powered Features</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindote uses AI (powered by OpenAI) to provide features like vocabulary extraction and auto-fill. When you use these features:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Text you submit is processed by our AI service to generate vocabulary suggestions</li>
              <li>We do not store AI conversation history beyond what's needed for the immediate request</li>
              <li>AI-generated content is provided for educational purposes only</li>
            </ul>
          </section>

          {/* Data Storage */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Data Storage and Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored securely using industry-standard practices:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Data is encrypted in transit using HTTPS</li>
              <li>Database is hosted on secure, reputable cloud infrastructure</li>
              <li>Access to personal data is restricted to authorized personnel only</li>
              <li>We regularly review and update our security practices</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Authentication providers</strong> (Google, GitHub) for secure login</li>
              <li><strong>Lemon Squeezy</strong> for payment processing</li>
              <li><strong>OpenAI</strong> for AI-powered features</li>
              <li><strong>YouTube Data API</strong> for video transcript extraction</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              These services have their own privacy policies governing how they handle your data.
            </p>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your vocabulary collections</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:mindote.hello@gmail.com" className="text-primary hover:underline">
                mindote.hello@gmail.com
              </a>
            </p>
          </section>

          {/* Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and local storage for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Maintaining your login session</li>
              <li>Remembering your preferences (theme, language)</li>
              <li>Improving site performance</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindote is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          {/* Changes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:mindote.hello@gmail.com" className="text-primary hover:underline">
                mindote.hello@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="Mindote Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold">Mindote</span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <span>© 2025 Mindote. All rights reserved.</span>
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <a
                href="mailto:mindote.hello@gmail.com"
                className="hover:text-foreground transition-colors"
              >
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
