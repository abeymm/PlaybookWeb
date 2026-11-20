"use client";

import { useEffect, useRef, useState } from "react";

const DONE_MS = 2000;

/** Copies `href` to the clipboard and shows `doneLabel` for 2 seconds. If the clipboard call fails, it announces `failLabel` and shows the full link as text, selected again on every failed click, so the reader can copy by hand. */
export function CopyLinkButton({
  href,
  label,
  doneLabel,
  failLabel,
  className,
}: {
  href: string;
  label: string;
  doneLabel: string;
  failLabel: string;
  className: string;
}) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(0); // counts failed clicks, so the link is selected again each time
  const [ok, setOk] = useState(true);
  const fallback = useRef<HTMLSpanElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const node = fallback.current;
    const selection = window.getSelection();
    if (!failed || !node || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }, [failed]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(href);
    } catch {
      if (timer.current) clearTimeout(timer.current);
      setDone(false);
      setOk(false);
      setFailed((n) => n + 1);
      return;
    }
    setOk(true);
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), DONE_MS);
  }

  return (
    <>
      <button type="button" onClick={copy} className={className}>
        {label}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {done ? doneLabel : ok ? "" : failLabel}
      </span>
      {done ? (
        <span aria-hidden="true" className="text-[16px] font-semibold text-book-green">
          {doneLabel}
        </span>
      ) : null}
      {!ok ? (
        <span ref={fallback} className="w-full break-all text-[14px] text-book-muted">
          {href}
        </span>
      ) : null}
    </>
  );
}
