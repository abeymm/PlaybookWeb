import { Card, CardContent } from "@/components/ui/card";
import { QrCodeIcon } from "lucide-react";

export default function QRCodesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">QR Codes</h1>
        <p className="text-muted-foreground">
          Download and manage QR codes for your pro shop and course.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <QrCodeIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            QR code management coming soon. Download print-ready posters, table tents,
            and scorecard inserts with your unique playbook QR code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
