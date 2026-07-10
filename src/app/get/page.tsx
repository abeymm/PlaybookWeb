"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { APP_STORE_URL } from "@/lib/seo";

// Flip this one line when the Android app ships — everything else on the
// page reacts to it automatically.
const PLAY_STORE_URL: string | null = null;

type Platform = "ios" | "android" | "unknown";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "unknown";
}

export default function GetPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const iosFirst = platform === "ios";
  const isAndroid = platform === "android";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#08401B" }}
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <Image
          src="/images/logo3d.png"
          alt="Golf Playbook"
          width={72}
          height={72}
          className="rounded-2xl"
          priority
        />

        <h1
          className="mt-6 font-display text-2xl font-bold tracking-tight"
          style={{ color: "#F5F1E6" }}
        >
          Golf Playbook
        </h1>

        <p className="mt-3 text-base leading-snug" style={{ color: "#F5F1E6" }}>
          Aim for your miss; not a miracle.
        </p>

        <p className="mt-2 text-sm" style={{ color: "#D7DDCB" }}>
          Plan at home, print at home. Free.
        </p>

        <div className="mt-8 flex w-full flex-col items-center gap-4">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`transition-transform ${iosFirst ? "order-1 scale-105" : "order-2"}`}
            aria-label="Download on the App Store"
          >
            {/* Official Apple badge — do not restyle (Apple marketing guidelines) */}
            <Image
              src="/badges/app-store-badge.svg"
              alt="Download on the App Store"
              width={180}
              height={60}
              priority
            />
          </a>

          <div
            className={`flex flex-col items-center ${isAndroid ? "order-1" : "order-2"}`}
            aria-disabled={!PLAY_STORE_URL}
          >
            {PLAY_STORE_URL ? (
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
              >
                {/* Official Google Play badge — do not restyle (Google brand guidelines) */}
                <Image
                  src="/badges/google-play-badge.png"
                  alt="Get it on Google Play"
                  width={202}
                  height={78}
                />
              </a>
            ) : (
              <div className="flex flex-col items-center">
                <Image
                  src="/badges/google-play-badge.png"
                  alt="Get it on Google Play"
                  width={202}
                  height={78}
                  style={{ opacity: 0.45, filter: "grayscale(60%)" }}
                />
                <span
                  className={`mt-1 text-xs ${isAndroid ? "font-medium" : ""}`}
                  style={{ color: "#D7DDCB" }}
                >
                  Coming soon to Android
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="mt-10 text-[10px] leading-snug" style={{ color: "#9DAA95" }}>
          Apple and the Apple logo are trademarks of Apple Inc. App Store is a service mark of
          Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.
        </p>
      </div>
    </div>
  );
}
