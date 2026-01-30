"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Particles } from "@/components/ui/particles";
import { MapIcon, DownloadIcon, ShieldCheckIcon } from "lucide-react";

const APP_STORE_URL = "https://apps.apple.com/us/app/golf-playbook/id1557162395";

export default function ProtectedPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const handleAppStoreClick = () => {
    window.open(APP_STORE_URL, "_blank");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Particles
        className="absolute inset-0 -z-10"
        quantity={30}
        color="#F5C518"
        ease={80}
        refresh
      />

      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-border/50 bg-background/80 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center gap-6 p-8">
            {/* Logo */}
            <Link href="/">
              <Image
                src="/images/logo3d.png"
                alt="Golf Playbook"
                width={80}
                height={80}
                className="rounded-2xl"
              />
            </Link>

            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MapIcon className="h-8 w-8 text-primary" />
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">
                Shared Playbook
              </h1>
              <p className="mt-2 text-muted-foreground">
                Open this playbook in the Golf Playbook app to view course
                strategies and shot recommendations.
              </p>
            </div>

            {/* Sign in notice */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Sign in required to access</span>
            </div>

            {/* App Store Button */}
            <Button
              onClick={handleAppStoreClick}
              size="lg"
              className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <DownloadIcon className="h-5 w-5" />
              Get the App
            </Button>

            {/* Already have app hint */}
            <p className="text-center text-sm text-muted-foreground">
              Already have the app?{" "}
              <Link
                href={`golfplaybook://protected/${id}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Open directly
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Learn more about Golf Playbook
          </Link>
        </div>
      </div>
    </div>
  );
}
