"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboardIcon,
  BookOpenIcon,
  GiftIcon,
  StoreIcon,
  QrCodeIcon,
  BarChartIcon,
  PrinterIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import outputs from "../../../amplify_outputs.json";

// Configure Amplify
Amplify.configure(outputs);

const sidebarItems = [
  { icon: LayoutDashboardIcon, label: "Overview", href: "/dashboard/overview" },
  { icon: BookOpenIcon, label: "Playbook", href: "/dashboard/playbook" },
  { icon: GiftIcon, label: "On-Course Offers", href: "/dashboard/on-course-offers" },
  { icon: StoreIcon, label: "Off-Course Offers", href: "/dashboard/off-course-offers" },
  { icon: QrCodeIcon, label: "QR Codes", href: "/dashboard/qr-codes" },
  { icon: BarChartIcon, label: "Reports", href: "/dashboard/reports" },
  { icon: PrinterIcon, label: "Print Orders", href: "/dashboard/print-orders" },
  { icon: SettingsIcon, label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <div className="flex min-h-screen bg-background">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border/40 bg-card transition-transform lg:static lg:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            {/* Logo */}
            <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/images/logo3d.png"
                  alt="Golf Playbook"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="font-bold tracking-tight">Golf Playbook</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>

            {/* Course name (placeholder) */}
            <div className="border-b border-border/40 px-6 py-4">
              <p className="text-xs font-medium text-muted-foreground">COURSE</p>
              <p className="mt-1 font-semibold">Your Course Name</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-border/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-medium text-primary">
                    {user?.signInDetails?.loginId?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div className="flex-1 truncate">
                  <p className="truncate text-sm font-medium">
                    {user?.signInDetails?.loginId || "User"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={signOut}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <LogOutIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            {/* Mobile header */}
            <header className="flex h-16 items-center gap-4 border-b border-border/40 px-6 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <Link href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/images/logo3d.png"
                  alt="Golf Playbook"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
                <span className="font-bold tracking-tight">Golf Playbook</span>
              </Link>
            </header>

            {/* Page content */}
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      )}
    </Authenticator>
  );
}
