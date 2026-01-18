"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeftIcon, CheckCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo3d.png"
              alt="Golf Playbook"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <span className="text-xl font-bold tracking-tight">Golf Playbook</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">
              Sign in to access your playbooks and strategies
            </p>
          </div>

          <Authenticator
            variation="modal"
            components={{
              SignIn: {
                Header() {
                  return null;
                },
              },
              SignUp: {
                Header() {
                  return null;
                },
              },
            }}
          >
            {({ signOut, user }) => (
              <AuthenticatedContent user={user} signOut={signOut} />
            )}
          </Authenticator>
        </div>
      </main>
    </div>
  );
}

function AuthenticatedContent({
  user,
  signOut,
}: {
  user: any;
  signOut: (() => void) | undefined;
}) {
  const router = useRouter();

  return (
    <Card className="border-primary/20">
      <CardContent className="p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircleIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Connected to Backend!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Successfully authenticated with AWS Amplify
          </p>

          <div className="mt-6 w-full space-y-3 rounded-lg bg-muted/50 p-4 text-left text-sm">
            <div>
              <span className="font-medium">User ID:</span>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                {user?.userId}
              </p>
            </div>
            <div>
              <span className="font-medium">Username:</span>
              <p className="mt-1 text-muted-foreground">
                {user?.username || user?.signInDetails?.loginId}
              </p>
            </div>
          </div>

          <div className="mt-6 flex w-full flex-col gap-3">
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
