"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { BOOK_IMAGES } from "../_images";
import { HERO, SAMPLE } from "./copy";
import { Container, Field, FormStatus, Honeypot, SubmitButton, formValues, useFormPost } from "./ui";

const PAGE_CLASS = "h-auto w-[31%] max-w-[190px] rounded shadow-[0_12px_28px_rgba(20,28,23,0.22)]";
const PAGE_SIZES = "(min-width: 1024px) 190px, 30vw";

export function SampleSection() {
  const { state, post } = useFormPost("/api/book/sample");
  const busy = state.status === "sending";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    void post({
      email: values.email,
      updates: values.updates === "on",
      website: values.website ?? "",
    });
  }

  return (
    <section id="sample" className="scroll-mt-16 py-16 md:py-20">
      <Container className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[44px]">{SAMPLE.headline}</h2>
          <p className="text-[18px] leading-[1.5] text-book-muted">{SAMPLE.body}</p>
          {state.status === "sent" ? (
            <FormStatus state={state} sentMessage={SAMPLE.sent} />
          ) : (
            <form onSubmit={onSubmit} noValidate className="relative flex max-w-[520px] flex-col gap-3">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end">
                <Field
                  id="sample-email"
                  name="email"
                  type="email"
                  label={SAMPLE.emailLabel}
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                  error={state.fields?.email}
                  className="flex-1"
                />
                <SubmitButton busy={busy}>{SAMPLE.button}</SubmitButton>
              </div>
              <label className="flex items-start gap-2.5 text-[15px] leading-[1.4] text-book-muted">
                <input type="checkbox" name="updates" className="mt-[3px] h-5 w-5 accent-book-green" />
                <span>{SAMPLE.updatesLabel}</span>
              </label>
              <Honeypot id="sample-website" />
              <FormStatus state={state} sentMessage={SAMPLE.sent} />
            </form>
          )}
          <p className="text-[14px] text-book-muted">{SAMPLE.note}</p>
        </div>
        <div className="flex w-full flex-1 justify-center gap-2.5">
          <Image {...BOOK_IMAGES.howtoPage} alt={SAMPLE.howtoAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
          <Image {...BOOK_IMAGES.heroGreenPage} alt={HERO.greenPageAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
          <Image {...BOOK_IMAGES.heroMapPage} alt={HERO.mapPageAlt} sizes={PAGE_SIZES} className={PAGE_CLASS} />
        </div>
      </Container>
    </section>
  );
}
