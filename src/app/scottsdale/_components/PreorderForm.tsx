"use client";

import type { FormEvent } from "react";
import { Container, Field, FormStatus, Honeypot, SubmitButton, formValues, useFormPost } from "@/app/book/_components/ui";
import { PREORDER } from "./copy";
import { IntroLine, PriceLines } from "./Sections";

/** Name and email, posted to /api/book/preorder. The honeypot travels along as `website`. */
function Form() {
  const { state, post } = useFormPost("/api/book/preorder");
  const busy = state.status === "sending";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    void post({ name: values.name, email: values.email, website: values.website ?? "" });
  }

  if (state.status === "sent") {
    return (
      <div className="mt-3 rounded-md border border-book-green bg-book-paper p-5 [&_p]:text-[19px]">
        <FormStatus state={state} sentMessage={PREORDER.sent} />
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-3 flex max-w-[560px] flex-col gap-3">
      <Field
        id="preorder-name"
        name="name"
        type="text"
        label={PREORDER.nameLabel}
        autoComplete="name"
        required
        maxLength={80}
        error={state.fields?.name}
      />
      <Field
        id="preorder-email"
        name="email"
        type="email"
        label={PREORDER.emailLabel}
        placeholder="you@example.com"
        autoComplete="email"
        inputMode="email"
        required
        error={state.fields?.email}
      />
      <div>
        <SubmitButton busy={busy}>{PREORDER.button}</SubmitButton>
      </div>
      <p className="text-[14px] text-book-muted">{PREORDER.emailUse}</p>
      <Honeypot id="preorder-website" />
      <FormStatus state={state} sentMessage={PREORDER.sent} />
    </form>
  );
}

export function PreorderForm() {
  return (
    <section id="preorder" className="scroll-mt-4 border-t border-book-line bg-book-paper py-12 md:py-14">
      <Container className="flex max-w-[860px] flex-col gap-2">
        <h2 className="text-[34px] font-extrabold leading-none text-book-green sm:text-[40px]">{PREORDER.headline}</h2>
        <PriceLines />
        <Form />
        <IntroLine />
      </Container>
    </section>
  );
}
