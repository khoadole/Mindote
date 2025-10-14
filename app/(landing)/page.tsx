"use client";

import Link from "next/link";
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
  Layers,
  Candy as Cards,
  CheckCircle,
  Youtube,
  Zap,
  Users,
  Star,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

const features = [
  {
    icon: BookOpen,
    title: "Smart Vocabulary Building",
    description:
      "Add words with definitions, examples, and phonetic pronunciations. Build your personal dictionary.",
  },
  {
    icon: Layers,
    title: "Organized Collections",
    description:
      "Group words by topics, difficulty, or any category that works for your learning style.",
  },
  {
    icon: Cards,
    title: "Interactive Flashcards",
    description:
      "Study with spaced repetition flashcards that adapt to your learning progress.",
  },
  {
    icon: CheckCircle,
    title: "Smart Quizzes",
    description:
      "Test your knowledge with adaptive quizzes that focus on words you need to practice.",
  },
  {
    icon: Youtube,
    title: "YouTube Integration",
    description:
      "Extract vocabulary from YouTube videos and build your word bank from real content.",
  },
  {
    icon: Zap,
    title: "Progress Tracking",
    description:
      "Monitor your learning journey with detailed analytics and achievement tracking.",
  },
];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* <BookOpen className="h-8 w-8 text-primary" /> */}
            <img
              src="/logo_black_transparent_256x256.png"
              alt="Mindote Logo"
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
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-foreground leading-tight">
              Master English Vocabulary with
              <span className="text-primary"> AI-Powered Learning</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build your vocabulary systematically with flashcards, quizzes, and
              YouTube integration. Learn smarter, not harder with spaced
              repetition and personalized progress tracking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Learning Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
              <Youtube className="h-5 w-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-md mx-auto pt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Words Learned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">
                Active Learners
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Master Vocabulary
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines proven learning techniques
              with modern technology to accelerate your English vocabulary
              acquisition.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow border-border/50"
              >
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 border-y border-border/40">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h3 className="text-3xl font-bold text-foreground">
              Ready to Transform Your Vocabulary?
            </h3>
            <p className="text-lg text-muted-foreground">
              Join thousands of learners who have already improved their English
              vocabulary with Mindote. Start your journey today—it's free!
            </p>
            <Link href="/auth">
              <Button size="lg" className="px-8 py-3 text-lg">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              {/* <BookOpen className="h-6 w-6 text-primary" /> */}
              <img
                src="/logo_black_transparent_256x256.png"
                alt="Mindote Logo"
                className="h-8 w-8"
              />
              <span className="text-lg font-semibold">Mindote</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
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
