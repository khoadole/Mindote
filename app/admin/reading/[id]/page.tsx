"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadingPracticeForm } from "@/components/admin/reading-practice-form";
import {
  useAdminReadingPracticeDetail,
  useAdminUpdateReadingPractice,
} from "@/hooks/use-reading-practice";

export default function EditReadingPracticePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const { data: item, isLoading } = useAdminReadingPracticeDetail(id);
  const updateMutation = useAdminUpdateReadingPractice();

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!item) {
    return <div className="p-8 text-center text-muted-foreground">Not found.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/reading")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-bold">Edit Reading Practice Part</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Part Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ReadingPracticeForm
            initialValues={item}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id, ...data });
              router.push("/admin/reading");
            }}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
