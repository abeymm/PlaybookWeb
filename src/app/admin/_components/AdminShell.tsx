"use client";

// Slim, density-first /admin shell (NOT DashboardShell — Design Resolution: slim variant).
//
// AUTH GATE: this is a UX-only boundary (E10 / R14). We render the Cognito Authenticator, then
// require `cognito:groups` to contain "admin" for the JWT — else a full-page 403. The REAL
// authorization is server-side: every write goes through AppSync mutations gated by
// `allow.group('admin')` + the editor Lambda's defense-in-depth group re-check. A user who
// bypasses this client gate still cannot mutate anything.

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ClipboardCheckIcon,
  ListIcon,
  ServerIcon,
  DatabaseIcon,
  BarChart3Icon,
  MapPinPlusIcon,
  ShieldAlertIcon,
  LogOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import outputs from "../../../../amplify_outputs.json";

Amplify.configure(outputs);

const NAV = [
  { icon: ClipboardCheckIcon, label: "Review", href: "/admin/review" },
  { icon: ListIcon, label: "Courses", href: "/admin/courses" },
  { icon: ServerIcon, label: "Jobs", href: "/admin/jobs" },
  { icon: MapPinPlusIcon, label: "Seed", href: "/admin/seed" },
  { icon: DatabaseIcon, label: "Storage", href: "/admin/storage" },
  { icon: BarChart3Icon, label: "Metrics", href: "/admin/metrics" },
];

function Forbidden({ signOut }: { signOut?: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
      <ShieldAlertIcon className="h-12 w-12 text-destructive" aria-hidden />
      <div>
        <h1 className="text-lg font-semibold">403 — Admins only</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Your account is not in the <code className="rounded bg-muted px-1">admin</code> group. This
          console is restricted. (This page gate is UX only — the data APIs enforce the same rule
          server-side.)
        </p>
      </div>
      {signOut && (
        <Button variant="outline" size="sm" onClick={signOut}>
          Sign out
        </Button>
      )}
    </div>
  );
}

function AdminChrome({
  children,
  signOut,
  loginId,
}: {
  children: React.ReactNode;
  signOut?: () => void;
  loginId?: string;
}) {
  const pathname = usePathname();
  return (
    // Desktop-only: min viewport 1440×900 (Design Resolution). Below it, scroll — no redesign.
    <div className="flex min-h-screen min-w-[1440px] bg-background text-foreground">
      <aside className="flex w-52 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <span className="text-sm font-semibold tracking-tight">courseData admin</span>
        </div>
        <nav className="flex-1 space-y-0.5 p-2" aria-label="Admin">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center justify-between gap-2 border-t border-border p-3">
          <span className="truncate text-xs text-muted-foreground" title={loginId}>
            {loginId ?? "admin"}
          </span>
          {signOut && (
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        <GroupGate signOut={signOut} loginId={user?.signInDetails?.loginId}>
          {children}
        </GroupGate>
      )}
    </Authenticator>
  );
}

function GroupGate({
  children,
  signOut,
  loginId,
}: {
  children: React.ReactNode;
  signOut?: () => void;
  loginId?: string;
}) {
  const [state, setState] = useState<"checking" | "admin" | "forbidden">("checking");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await fetchAuthSession();
        const groups = (session.tokens?.accessToken?.payload?.["cognito:groups"] ?? []) as unknown;
        const isAdmin = Array.isArray(groups) && groups.includes("admin");
        if (!cancelled) setState(isAdmin ? "admin" : "forbidden");
      } catch {
        if (!cancelled) setState("forbidden");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "checking")
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking access…
      </div>
    );
  if (state === "forbidden") return <Forbidden signOut={signOut} />;
  return (
    <AdminChrome signOut={signOut} loginId={loginId}>
      {children}
    </AdminChrome>
  );
}
