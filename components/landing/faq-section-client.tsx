"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionClientProps {
  faqs: FAQItem[];
  isVisible: boolean;
}

/**
 * ✅ PERFORMANCE: Client component only for interactive FAQ accordion
 * Static content is rendered on server, only interactivity needs client JS
 */
export function FAQSectionClient({ faqs, isVisible }: FAQSectionClientProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div
      className={`space-y-4 stagger-children ${isVisible ? "is-visible" : ""}`}
    >
      {faqs.map((faq, index) => (
        <Card
          key={index}
          className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
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
  );
}
