"use client";
import { useRef, useEffect } from "react";

interface ProtectedEmailProps {
  /** Base64-encoded local part (e.g. btoa("courses") → "Y291cnNlcw==") */
  d: string;
  fallbackLabel?: string;
}

// Domain parts stored separately and reversed to avoid static grep
const H = "flog";
const T = "koobyalp";

function decode(b64: string): string {
  return atob(b64);
}

export function ProtectedEmail({
  d,
  fallbackLabel = "email us",
}: ProtectedEmailProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      const local = decode(d);
      const domain = T.split("").reverse().join("") + "." + H.split("").reverse().join("");
      const addr = `${local}@${domain}`;
      el.href = `mailto:${addr}`;
      el.textContent = addr;
    }
  }, [d]);

  return (
    <a ref={ref} className="text-primary underline-offset-4 hover:underline">
      {fallbackLabel}
    </a>
  );
}
