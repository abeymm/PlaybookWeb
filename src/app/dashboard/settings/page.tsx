import { Card, CardContent } from "@/components/ui/card";
import { SettingsIcon } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and course settings.
        </p>
      </div>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <SettingsIcon className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-center text-muted-foreground">
            Settings coming soon. Update course information, manage team members,
            configure notifications, and customize your playbook theme.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
