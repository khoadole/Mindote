"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  CheckCircle,
  Youtube,
  Zap,
  BookOpenCheck,
  Moon,
  Sun,
  ArrowRight,
  Sparkles,
  Target,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useTranslation } from "@/lib/i18n-provider";
import { useState } from "react";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";

// Highlight Features with Screenshots
const highlightFeatures = [
  {
    title: "Interactive Quizzes",
    description:
      "Test your knowledge with smart quizzes that adapt to your learning progress. Multiple question types keep learning engaging and effective.",
    image: "/quiz_content.png",
    icon: CheckCircle,
    color: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    title: "Smart Flashcards",
    description:
      "Master vocabulary with spaced repetition flashcards. Our AI-powered system shows you words exactly when you need to review them.",
    image: "/flashcard_content.png",
    icon: Brain,
    color: "from-purple-500/10 to-pink-500/10",
    iconColor: "text-indigo-500",
  },
  {
    title: "Immersive Reading",
    description:
      "Practice reading comprehension with curated content. Click words for instant definitions and add them to your learning collection.",
    image: "/reading_content_1.png",
    icon: BookOpenCheck,
    color: "from-green-500/10 to-emerald-500/10",
    iconColor: "text-green-500",
  },
];

// Additional Features
const additionalFeatures = [
  {
    icon: Youtube,
    title: "YouTube Integration",
    description:
      "Learn from real content. Extract vocabulary from YouTube videos with transcripts and timestamps.",
  },
  {
    icon: Target,
    title: "Smart Progress Tracking",
    description:
      "Monitor your learning journey with detailed analytics. See your improvement over time.",
  },
  {
    icon: Zap,
    title: "Spaced Repetition System",
    description:
      "Scientific learning method that optimizes retention. Review words at the perfect intervals.",
  },
  {
    icon: BookOpen,
    title: "Personal Dictionary",
    description:
      "Build your custom word collection with definitions, examples, and pronunciation guides.",
  },
];

// FAQ Data
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
    question: "Can I learn from YouTube videos?",
    answer:
      "Absolutely! Mindote integrates with YouTube to extract vocabulary from video transcripts. You can learn words in context, see timestamps, and build your collection from real English content.",
  },
  {
    question: "How is Mindote different from other vocabulary apps?",
    answer:
      "Mindote combines multiple learning methods in one platform: flashcards, quizzes, reading practice, and YouTube integration. It's designed specifically for serious learners who want a comprehensive, systematic approach to vocabulary building.",
  },
  {
    question: "Do I need to download anything?",
    answer:
      "No! Mindote is a web application that works in your browser. Just sign up and start learning from any device - computer, tablet, or phone.",
  },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Scroll animations for different sections
  const featuresHeaderRef = useScrollAnimation();
  const feature1Ref = useScrollAnimation({ threshold: 0.2 });
  const feature2Ref = useScrollAnimation({ threshold: 0.2 });
  const feature3Ref = useScrollAnimation({ threshold: 0.2 });
  const additionalFeaturesRef = useScrollAnimation();
  const faqRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

  const featureRefs = [feature1Ref, feature2Ref, feature3Ref];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Gradient - REMOVED for pure white */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" /> */}
      {/* Header */}
      <header className="bg-background border-b border-border/40">
        {" "}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src="/mindote_rmbg.png"
              alt="Mindote Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <h1 className="text-2xl font-bold text-foreground">Mindote</h1>
          </div>
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
            <Link href="/auth">
              <Button className="rounded-full px-6">{t("landing.getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 animate-fade-in-down">
            <Sparkles className="h-4 w-4" />
            <span>{t("landing.aiPowered")}</span>
          </div>

          <h2
            className="text-5xl lg:text-6xl font-bold text-foreground leading-tight animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {t("landing.heroTitle")}
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("landing.heroSubtitle")}
            </span>
          </h2>

          <p
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t("landing.heroDescription")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/auth">
              <Button
                size="lg"
                className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                {t("landing.startLearning")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {/* <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg rounded-full"
            >
              <Youtube className="h-5 w-5 mr-2" />
              Watch Demo
            </Button> */}
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="text-center space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                10K+
              </div>
              <div className="text-sm text-muted-foreground">{t("landing.wordsLearned")}</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                500+
              </div>
              <div className="text-sm text-muted-foreground">
                {t("landing.activeLearners")}
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                95%
              </div>
              <div className="text-sm text-muted-foreground">{t("landing.successRate")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlight Features Section with Screenshots */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div
            ref={featuresHeaderRef.ref}
            className={`text-center mb-16 space-y-4 scroll-animate ${
              featuresHeaderRef.isVisible ? "animate-fade-in-up" : ""
            }`}
          >
            <h3 className="text-4xl font-bold text-foreground">
              Powerful Features for Effective Learning
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build a strong vocabulary, all in one
              place.
            </p>
          </div>

          <div className="space-y-24">
            {highlightFeatures.map((feature, index) => {
              const featureRef = featureRefs[index];

              return (
                <div
                  key={index}
                  ref={featureRef.ref}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center scroll-animate ${
                    index % 2 === 1 ? "lg:flex-row-reverse" : ""
                  } ${
                    featureRef.isVisible
                      ? index % 2 === 0
                        ? "animate-fade-in-left"
                        : "animate-fade-in-right"
                      : ""
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`space-y-6 ${
                      index % 2 === 1 ? "lg:order-2" : ""
                    }`}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} border border-border/50`}
                    >
                      <feature.icon
                        className={`h-7 w-7 ${feature.iconColor}`}
                      />
                    </div>

                    <h4 className="text-3xl font-bold text-foreground">
                      {feature.title}
                    </h4>

                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Screenshot */}
                  <div
                    className={`relative ${
                      index % 2 === 1 ? "lg:order-1" : ""
                    }`}
                  >
                    <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] group">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        width={800}
                        height={600}
                        className="w-full h-auto"
                        priority={index === 0}
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    {/* Decorative element */}
                    <div
                      className={`absolute -z-10 w-full h-full rounded-2xl bg-gradient-to-br ${feature.color} blur-3xl opacity-20 top-8 left-8`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div
            ref={additionalFeaturesRef.ref}
            className={`text-center mb-16 space-y-4 scroll-animate ${
              additionalFeaturesRef.isVisible ? "animate-fade-in-up" : ""
            }`}
          >
            <h3 className="text-4xl font-bold text-foreground">
              More Features to Accelerate Your Learning
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools designed for serious vocabulary learners.
            </p>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children ${
              additionalFeaturesRef.isVisible ? "is-visible" : ""
            }`}
          >
            {additionalFeatures.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-border/50 hover:border-primary/50 cursor-pointer"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div
            ref={faqRef.ref}
            className={`text-center mb-16 space-y-4 scroll-animate ${
              faqRef.isVisible ? "animate-fade-in-up" : ""
            }`}
          >
            <h3 className="text-4xl font-bold text-foreground">
              Frequently Asked Questions
            </h3>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Mindote
            </p>
          </div>

          <div
            className={`space-y-4 stagger-children ${
              faqRef.isVisible ? "is-visible" : ""
            }`}
          >
            {faqs.map((faq, index) => (
              <Card
                key={index}
                className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() =>
                  setExpandedFaq(expandedFaq === index ? null : index)
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-left">
                      {faq.question}
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        expandedFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </CardHeader>
                {expandedFaq === index && (
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* <div className="absolute inset-0 bg-primary/5" /> - REMOVED for pure white */}
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of students who are already learning smarter with
            Mindote.
          </p>
          <Link href="/auth">
            <Button size="lg" className="text-lg px-8 h-12 rounded-full">
              Start Learning Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
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
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="hover:text-foreground transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
