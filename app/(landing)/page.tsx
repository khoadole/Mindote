"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Brain,
  CheckCircle,
  Zap,
  BookOpenCheck,
  Moon,
  Sun,
  ArrowRight,
  Target,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useTranslation } from "@/lib/i18n-provider";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useRedirectIfAuthenticated } from "@/hooks/use-auth-guard";
import { AnimatedBackground } from "@/components/landing/animated-background";

const highlightFeatures = [
  {
    title: "Interactive Quizzes",
    description:
      "Test your knowledge with smart quizzes that adapt to your learning progress. Multiple question types keep learning engaging and effective.",
    image: "/quiz_content.png",
    icon: CheckCircle,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Smart Flashcards",
    description:
      "Master vocabulary with spaced repetition flashcards. Our AI-powered system shows you words exactly when you need to review them.",
    image: "/flashcard_content.png",
    icon: Brain,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Immersive Reading",
    description:
      "Practice reading comprehension with curated content. Click words for instant definitions and add them to your learning collection.",
    image: "/reading_content_1.png",
    icon: BookOpenCheck,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
];

const additionalFeatures = [
  {
    icon: Target,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    title: "Smart Progress Tracking",
    description:
      "Monitor your learning journey with detailed analytics. See your improvement over time.",
  },
  {
    icon: Zap,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    title: "Spaced Repetition System",
    description:
      "Scientific learning method that optimizes retention. Review words at the perfect intervals.",
  },
  {
    icon: BookOpen,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    title: "Personal Dictionary",
    description:
      "Build your custom word collection with definitions, examples, and pronunciation guides.",
  },
];

const faqs = [
  {
    question: "How does Mindote help me learn vocabulary?",
    answer:
      "Mindote uses proven learning techniques like spaced repetition, active recall, and contextual learning. You'll study with flashcards, test yourself with quizzes, and see words in real reading contexts. Our AI adapts to your progress, focusing on words you need to practice most.",
  },
  {
    question: "Is Mindote free to use?",
    answer:
      "Yes! Mindote is completely free. You can create unlimited word collections, use all flashcard and quiz features, track your progress, and get 3 daily AI generations at no cost.",
  },
  {
    question: "What is spaced repetition and why does it work?",
    answer:
      "Spaced repetition is a scientifically proven learning technique where you review information at increasing intervals. This method is proven to improve long-term retention by up to 200% compared to traditional studying.",
  },
  {
    question: "How is Mindote different from other vocabulary apps?",
    answer:
      "Mindote combines multiple learning methods in one platform: flashcards, quizzes, and reading practice. It's designed specifically for serious learners who want a comprehensive, systematic approach to vocabulary building.",
  },
  {
    question: "Do I need to download anything?",
    answer:
      "No! Mindote is a web application that works in your browser. Just sign up and start learning from any device — computer, tablet, or phone.",
  },
];

export default function LandingPage() {
  useRedirectIfAuthenticated();

  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const featuresHeaderRef = useScrollAnimation();
  const feature1Ref = useScrollAnimation({ threshold: 0.2 });
  const feature2Ref = useScrollAnimation({ threshold: 0.2 });
  const feature3Ref = useScrollAnimation({ threshold: 0.2 });
  const additionalFeaturesRef = useScrollAnimation();
  const faqRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();
  const featureRefs = [feature1Ref, feature2Ref, feature3Ref];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-background flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
        <div className="backdrop-blur-xl bg-white/70 dark:bg-background/70 border border-stone-200/60 dark:border-border/30 rounded-full px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Mindote" width={36} height={36} className="h-9 w-9" />
              <span className="text-xl font-black text-stone-900 dark:text-foreground">Mindote</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full h-9 w-9 text-stone-500"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Link href="/auth">
                <Button className="rounded-full px-5 h-9 text-sm font-semibold shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                  {t("landing.getStarted")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-36 pb-24 relative z-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-8 animate-fade-in-down">
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            <span>{t("landing.aiPowered")}</span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-black text-stone-900 dark:text-foreground leading-[1.05] tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {t("landing.heroTitle")}
            <br />
            <span className="text-amber-500 dark:text-amber-400 underline decoration-amber-300/50 dark:decoration-amber-600/50 decoration-[3px] underline-offset-[6px] decoration-wavy">
              {t("landing.heroSubtitle")}
            </span>
          </h1>

          <p
            className="text-xl text-stone-500 dark:text-muted-foreground max-w-xl mx-auto leading-relaxed mb-10 animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t("landing.heroDescription")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/auth">
              <Button
                size="lg"
                className="rounded-full px-10 text-base font-semibold h-12 shadow-[0_4px_16px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_24px_rgba(59,130,246,0.45)] transition-shadow"
              >
                {t("landing.startLearning")}
                <ArrowRight className="ml-2" style={{ width: 18, height: 18 }} />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 max-w-sm mx-auto mt-14 pt-8 border-t border-stone-200 dark:border-border animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { num: "10K+", label: t("landing.wordsLearned") },
              { num: "500+", label: t("landing.activeLearners") },
              { num: "95%", label: t("landing.successRate") },
            ].map(({ num, label }, i) => (
              <div
                key={i}
                className={`text-center px-4 ${i === 1 ? "border-x border-stone-200 dark:border-border" : ""}`}
              >
                <div className="text-2xl font-black text-stone-900 dark:text-foreground">{num}</div>
                <div className="text-xs text-stone-400 dark:text-muted-foreground mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Showcase ───────────────────────────────── */}
      <section className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-6xl mx-auto">

          {/* Section header — Claude editorial style */}
          <div
            ref={featuresHeaderRef.ref}
            className={`text-center mb-20 scroll-animate ${featuresHeaderRef.isVisible ? "animate-fade-in-up" : ""}`}
          >
            <p className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-stone-900 dark:text-foreground leading-tight">
              Everything you need to
              <br />
              <span className="text-primary">learn smarter</span>
            </h2>
          </div>

          <div className="space-y-28">
            {highlightFeatures.map((feature, index) => {
              const featureRef = featureRefs[index];
              return (
                <div
                  key={index}
                  ref={featureRef.ref}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center scroll-animate ${
                    featureRef.isVisible
                      ? index % 2 === 0 ? "animate-fade-in-left" : "animate-fade-in-right"
                      : ""
                  }`}
                >
                  {/* Content */}
                  <div className={`space-y-5 ${index % 2 === 1 ? "lg:order-2" : ""}`}>
                    <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center`}>
                      <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest mb-2">
                        {index === 0 ? "Quiz" : index === 1 ? "Flashcards" : "Reading"}
                      </p>
                      <h3 className="text-3xl font-black text-stone-900 dark:text-foreground mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-stone-500 dark:text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <Link href="/auth">
                      <Button variant="outline" className="rounded-full mt-2 border-stone-200 dark:border-border">
                        Try it free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  {/* Screenshot */}
                  <div className={`relative ${index % 2 === 1 ? "lg:order-1" : ""}`}>
                    <div className="relative rounded-2xl overflow-hidden border border-stone-200/70 dark:border-border/50 shadow-[0_8px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_56px_rgba(0,0,0,0.12)] hover:scale-[1.01] transition-all duration-500 group bg-white dark:bg-card">
                      {/* Browser chrome */}
                      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stone-100 dark:border-border bg-stone-50 dark:bg-muted/30">
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-600" />
                        <div className="w-2.5 h-2.5 rounded-full bg-stone-200 dark:bg-stone-600" />
                      </div>
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={800}
                        height={600}
                        className="w-full h-auto"
                        priority={index === 0}
                      />
                    </div>
                    {/* Ambient glow behind image — very subtle */}
                    <div className="absolute -z-10 inset-8 rounded-2xl opacity-30 blur-2xl bg-primary/20" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Additional Features ────────────────────────────── */}
      <section className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div
            ref={additionalFeaturesRef.ref}
            className={`text-center mb-16 scroll-animate ${additionalFeaturesRef.isVisible ? "animate-fade-in-up" : ""}`}
          >
            <p className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest mb-3">
              More tools
            </p>
            <h2 className="text-4xl font-black text-stone-900 dark:text-foreground">
              Built for consistency
            </h2>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-5 stagger-children ${
              additionalFeaturesRef.isVisible ? "is-visible" : ""
            }`}
          >
            {additionalFeatures.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-card rounded-2xl border border-stone-200 dark:border-border p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-5.5 w-5.5 ${feature.iconColor}`} style={{ width: 22, height: 22 }} />
                </div>
                <h3 className="text-base font-black text-stone-900 dark:text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-stone-500 dark:text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="container mx-auto px-4 py-24 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div
            ref={faqRef.ref}
            className={`text-center mb-14 scroll-animate ${faqRef.isVisible ? "animate-fade-in-up" : ""}`}
          >
            <p className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest mb-3">
              FAQ
            </p>
            <h2 className="text-4xl font-black text-stone-900 dark:text-foreground">
              Questions & answers
            </h2>
          </div>

          {/* Clean borderless accordion — no cards */}
          <div
            className={`bg-white dark:bg-card rounded-2xl border border-stone-200 dark:border-border divide-y divide-stone-100 dark:divide-border shadow-[0_1px_4px_rgba(0,0,0,0.05)] stagger-children ${
              faqRef.isVisible ? "is-visible" : ""
            }`}
          >
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  className="w-full flex items-start justify-between gap-4 px-6 py-5 text-left hover:bg-stone-50 dark:hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span className="text-sm font-semibold text-stone-800 dark:text-foreground leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-stone-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                      expandedFaq === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-5">
                    <p className="text-sm text-stone-500 dark:text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — floating card (Claude.ai style) ──────────── */}
      <section className="container mx-auto px-4 pb-24 relative z-10">
        <div
          ref={ctaRef.ref}
          className={`max-w-3xl mx-auto scroll-animate ${ctaRef.isVisible ? "animate-fade-in-up" : ""}`}
        >
          <div className="bg-white dark:bg-card rounded-3xl border border-stone-200 dark:border-border shadow-[0_8px_48px_rgba(0,0,0,0.07)] p-14 text-center relative overflow-hidden">
            {/* Ambient orb — subtle */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-100 dark:bg-amber-900/20 blur-3xl opacity-60" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-60" />

            <div className="relative z-10">
              <p className="text-[10px] font-semibold text-stone-400 dark:text-muted-foreground uppercase tracking-widest mb-4">
                Get started
              </p>
              <h2 className="text-4xl font-black text-stone-900 dark:text-foreground mb-4 leading-tight">
                Ready to learn smarter?
              </h2>
              <p className="text-stone-500 dark:text-muted-foreground mb-8 max-w-md mx-auto">
                Join thousands of students already building stronger vocabulary with Mindote.
              </p>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="rounded-full px-10 text-base font-semibold h-12 shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.45)] transition-shadow"
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 dark:border-border/40 bg-white dark:bg-background relative z-10">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Mindote" width={28} height={28} className="h-7 w-7" />
              <span className="text-base font-black text-stone-800 dark:text-foreground">Mindote</span>
            </div>
            <div className="flex items-center flex-wrap justify-center gap-6 text-sm text-stone-400 dark:text-muted-foreground">
              <span>© 2025 Mindote</span>
              <Link href="/privacy" className="hover:text-stone-700 dark:hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-stone-700 dark:hover:text-foreground transition-colors">
                Terms
              </Link>
              <a href="mailto:mindote.hello@gmail.com" className="hover:text-stone-700 dark:hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
