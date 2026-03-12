"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassageForm } from "@/components/admin/passage-form";
import { useAdminCreatePassage } from "@/hooks/use-writing";

export default function NewPassagePage() {
  const router = useRouter();
  const createMutation = useAdminCreatePassage();

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/admin/writing")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <PenLine className="h-5 w-5 text-purple-500" />
          <h1 className="text-xl font-bold">New Writing Passage</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PassageForm
            onSubmit={async (data) => {
              await createMutation.mutateAsync(data);
              router.push("/admin/writing");
            }}
            isLoading={createMutation.isPending}
            submitLabel="Create Passage"
          />
        </CardContent>
      </Card>
    </div>
  );
}
