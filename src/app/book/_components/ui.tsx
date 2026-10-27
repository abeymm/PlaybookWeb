"use client";

/**
 * Small primitives shared by the /book sections: the page container, the eyebrow label, the buy
 * button (reads the picked course from the store), form fields, the honeypot and the fetch hook
 * both forms use.
 */
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { HERO } from "./copy";
import { useBookStore } from "./store";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1180px] px-4 sm:px-6", className)}>{children}</div>;
}

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn("font-book-display text-[15px] font-bold uppercase tracking-[0.14em]", className)}>
      {children}
    </p>
  );
}

/** The one call to action. Opens the Shopify URL for the picked course (see src/lib/book/catalog.ts). */
export function BuyButton({ className, size = "lg" }: { className?: string; size?: "lg" | "md" }) {
  const { buyUrl, shop } = useBookStore();
  return (
    <a
      href={buyUrl}
      data-placeholder={shop.isBuyUrlPlaceholder || undefined}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md bg-book-yellow font-book-display font-extrabold tracking-[0.04em] text-book-green transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-book-yellow/50",
        size === "lg" ? "h-14 px-7 text-[22px]" : "h-11 px-3.5 text-[17px]",
        className,
      )}
    >
      {HERO.buy}
    </a>
  );
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
} & Omit<React.ComponentProps<"input">, "id">;

export function Field({ id, label, error, className, ...input }: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-book-display text-[14px] font-bold uppercase tracking-[0.12em] text-book-muted"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 w-full rounded-md border border-book-field bg-book-paper px-3.5 text-[17px] text-book-ink placeholder:text-book-muted/70 focus:border-book-green focus:outline-none focus:ring-4 focus:ring-book-green/15"
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[14px] font-medium text-book-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Spam trap: visually hidden, skipped by keyboards and screen readers; bots fill it in. */
export function Honeypot({ id }: { id: string }) {
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label htmlFor={id}>Website</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export function SubmitButton({ children, busy }: { children: ReactNode; busy: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex h-12 shrink-0 items-center justify-center rounded-md bg-book-green px-5 font-book-display text-[20px] font-extrabold tracking-[0.04em] text-book-cream transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-book-green/30 disabled:cursor-wait disabled:opacity-70"
    >
      {busy ? "Sending…" : children}
    </button>
  );
}

export type FormFields = { email?: string; course?: string; groupSize?: string };
export type FormState = {
  status: "idle" | "sending" | "sent" | "error";
  message?: string;
  fields?: FormFields;
};

type FormResponse = { ok?: boolean; error?: string; fields?: FormFields };

/** Posts JSON to one of the /api/book handlers and keeps the form's state. */
export function useFormPost(url: string) {
  const [state, setState] = useState<FormState>({ status: "idle" });

  async function post(payload: Record<string, unknown>) {
    setState({ status: "sending" });
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as FormResponse;
      if (res.ok && data.ok) {
        setState({ status: "sent" });
      } else {
        setState({
          status: "error",
          message: data.error ?? "Something went wrong. Try again in a minute.",
          fields: data.fields,
        });
      }
    } catch {
      setState({ status: "error", message: "No connection. Try again in a minute." });
    }
  }

  return { state, post };
}

/** Reads a form's fields on submit; the honeypot travels along as `website`. */
export function formValues(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  return Object.fromEntries(new FormData(form).entries());
}

export function FormStatus({ state, sentMessage }: { state: FormState; sentMessage: string }) {
  const text =
    state.status === "sent" ? sentMessage : state.status === "error" ? state.message : undefined;
  return (
    <p
      role="status"
      aria-live="polite"
      className={cn(
        "min-h-[1.5em] text-[15px] font-medium",
        state.status === "error" ? "text-book-error" : "text-book-green",
      )}
    >
      {text}
    </p>
  );
}
