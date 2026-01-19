import { Card, CardContent } from "@/components/ui/card";
import { BookOpenIcon } from "lucide-react";

export default function PlaybookPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Playbook</h1>
        <p className="text-muted-foreground">
          Manage your course&apos;s digital playbook content.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpenIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Playbook management coming soon. Edit hole strategies, update course tips,
            and preview your digital playbook.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
