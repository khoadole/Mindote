"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

export default function TermsOfUsePage() {
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
              src="/mindote_rmbg.png"
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Use</h1>
        
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground text-lg">
            Last updated: December 2025
          </p>

          {/* Content Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Content Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              At Mindote, we emphasize the importance of adhering to both legal and ethical guidelines when using our platform. We ask all users to follow these guidelines to ensure compliance with applicable policies and laws:
            </p>
          </section>

          {/* User Responsibility */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">User Responsibility</h3>
            <p className="text-muted-foreground leading-relaxed">
              Users are responsible for ensuring that any content they create, upload, or save aligns with applicable laws and regulations. This includes vocabulary collections, notes, and any other materials created on our platform.
            </p>
          </section>

          {/* Respecting Copyright */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Respecting Copyright Law</h3>
            <p className="text-muted-foreground leading-relaxed">
              Users must not upload or save content that is protected by copyright unless they have obtained explicit permission from the copyright holder. When using our YouTube integration feature, users should respect the intellectual property rights of content creators.
            </p>
          </section>

          {/* Privacy */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Respect for Privacy</h3>
            <p className="text-muted-foreground leading-relaxed">
              Users are prohibited from using Mindote to collect, store, or share personal information of others without their consent. Mindote cannot be held liable for any unauthorized use of personal data by users.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Disclaimer</h3>
            <p className="text-muted-foreground leading-relaxed">
              Mindote does not condone and cannot be held liable for any content that violates copyright law, privacy laws, or any other applicable regulations. Users are fully responsible for ensuring their activities on the platform comply with all applicable legal requirements.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using our platform, you agree to indemnify Mindote against any legal consequences resulting from your use of the service.
            </p>
          </section>

          {/* License to Use */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">License to Use Mindote</h2>
            <p className="text-muted-foreground leading-relaxed">
              Provided you comply with these Terms of Use, Mindote grants you a limited, personal, non-exclusive, non-commercial, revocable, and non-transferable license to access and use the content on our platform. This is strictly for personal, non-commercial, educational use.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to copy, reproduce, or access content via automated means (e.g., scripts, bots, or data extraction tools) unless authorized by Mindote in writing.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you purchase a subscription to access Mindote Premium features, it is for individual use only and cannot be shared with others. We may enforce reasonable limits on access to protect against unauthorized use.
            </p>
          </section>

          {/* Refund Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Refund Policy</h2>
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-muted-foreground leading-relaxed font-medium">
                All sales are final. Mindote does not offer refunds for any subscription purchases.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By purchasing a subscription to Mindote Premium, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>All subscription fees are non-refundable.</li>
              <li>No refunds will be provided for unused portions of your subscription.</li>
              <li>If you forget to cancel your subscription before it renews, you are responsible for that charge.</li>
              <li>No refunds will be issued for promotional offers, discounts, or special pricing.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              We encourage you to take advantage of our free tier to explore Mindote before committing to a paid subscription. Please ensure you understand and agree to this policy before making a purchase.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions or concerns, please contact us at{" "}
              <a href="mailto:mindote.hello@gmail.com" className="text-primary hover:underline">
                mindote.hello@gmail.com
              </a>{" "}
              before making a purchase.
            </p>
          </section>

          {/* Price Changes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Price Changes</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may change the price for Subscriptions from time to time. We will communicate any price changes to you in advance. Price changes for Subscriptions will take effect on the next renewal date following the date of the price change.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              As permitted by local law, you accept the new price by continuing to maintain your Subscription after the price change takes effect. If you do not agree with the price changes, you have the right to reject the change by canceling your Subscription prior to the price change going into effect.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Please be sure to read any such notification of price changes carefully.
            </p>
          </section>
          {/* Third-Party Services */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindote integrates with third-party services to provide certain features. By using these features, you acknowledge and agree to the following:
            </p>
            
            <h3 className="text-xl font-semibold text-foreground">YouTube Integration</h3>
            <p className="text-muted-foreground leading-relaxed">
              Our YouTube Notes feature allows you to extract transcripts from YouTube videos for vocabulary learning purposes. This feature relies on YouTube&apos;s services and is subject to YouTube&apos;s Terms of Service and Google&apos;s Privacy Policy. Mindote is not responsible for the availability, accuracy, or content of YouTube videos or transcripts. We do not host or store YouTube videos on our servers.
            </p>

            <h3 className="text-xl font-semibold text-foreground">Payment Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Payment processing for Mindote Premium subscriptions is handled by Lemon Squeezy. Your payment information is collected and processed by Lemon Squeezy in accordance with their privacy policy and terms of service. Mindote does not store your complete payment card information on our servers.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindote reserves the right to terminate or suspend your account and access to the Service at any time, with or without cause, and with or without notice. Reasons for termination may include, but are not limited to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Violation of these Terms of Use.</li>
              <li>Engaging in fraudulent or illegal activities.</li>
              <li>Abusing or misusing the Service, including AI features.</li>
              <li>Harassment of other users or Mindote staff.</li>
              <li>Any other conduct that Mindote, in its sole discretion, deems inappropriate.</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Upon termination, your right to use the Service will immediately cease. Mindote will not be liable to you or any third party for any termination of your access to the Service. No refunds will be provided for any unused portion of your subscription in the event of termination for cause.
            </p>
          </section>

          {/* Limitation of Liability */}

          {/* Changes to Policy */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Mindote reserves the right to modify or update these Terms of Use at any time. We will notify users of any significant changes by posting the updated policy on our website.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms of Use, please contact us at{" "}
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
                src="/mindote_rmbg.png"
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
