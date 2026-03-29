"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadingPracticeForm } from "@/components/admin/reading-practice-form";
import { useAdminCreateReadingPractice } from "@/hooks/use-reading-practice";

export default function NewReadingPracticePage() {
  const router = useRouter();
  const createMutation = useAdminCreateReadingPractice();

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/reading")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-bold">New Reading Practice Part</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Part Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingPracticeForm
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
              router.push("/admin/reading");
            }}
            isLoading={createMutation.isPending}
            submitLabel="Create Part"
          />
        </CardContent>
      </Card>
    </div>
  );
}
