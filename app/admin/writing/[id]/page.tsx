"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassageForm } from "@/components/admin/passage-form";
import { useAdminUpdatePassage } from "@/hooks/use-writing";
import type { WritingPassage } from "@/lib/types";

export default function EditPassagePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const updateMutation = useAdminUpdatePassage();

  const { data: passage, isLoading } = useQuery<WritingPassage>({
    queryKey: ["admin-passage", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/writing/${id}`);
      if (!res.ok) throw new Error("Failed to fetch passage");
      const data = await res.json();
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!passage) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Passage not found.
      </div>
    );
  }

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
          <h1 className="text-xl font-bold">Edit Passage</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PassageForm
            initialValues={passage}
            onSubmit={async (data) => {
              await updateMutation.mutateAsync({ id, ...data });
              router.push("/admin/writing");
            }}
            isLoading={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
