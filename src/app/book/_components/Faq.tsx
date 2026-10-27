"use client";

import type { FormEvent } from "react";
import { FAQ, REQUEST_FORM } from "./copy";
import { Container, Field, FormStatus, Honeypot, SubmitButton, formValues, useFormPost } from "./ui";

/** "Not listed? Tell us the course": email + course name, posted to /api/book/request. */
function CourseRequestForm() {
  const { state, post } = useFormPost("/api/book/request");
  const busy = state.status === "sending";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const groupSize = typeof values.groupSize === "string" ? values.groupSize.trim() : "";
    void post({
      email: values.email,
      course: values.course,
      ...(groupSize ? { groupSize } : {}),
      website: values.website ?? "",
    });
  }

  if (state.status === "sent") {
    return <FormStatus state={state} sentMessage={REQUEST_FORM.sent} />;
  }
  return (
    <form onSubmit={onSubmit} noValidate className="relative mt-2 flex max-w-[720px] flex-col gap-3">
      <p className="text-[17px] leading-[1.5] text-book-muted">{REQUEST_FORM.groupsNote}</p>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
        <Field
          id="request-email"
          name="email"
          type="email"
          label={REQUEST_FORM.emailLabel}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          required
          error={state.fields?.email}
          className="flex-1"
        />
        <Field
          id="request-course"
          name="course"
          type="text"
          label={REQUEST_FORM.courseLabel}
          placeholder={REQUEST_FORM.coursePlaceholder}
          autoComplete="off"
          required
          maxLength={120}
          error={state.fields?.course}
          className="flex-1"
        />
        <Field
          id="request-group-size"
          name="groupSize"
          type="text"
          label={REQUEST_FORM.groupSizeLabel}
          placeholder={REQUEST_FORM.groupSizePlaceholder}
          autoComplete="off"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          error={state.fields?.groupSize}
          className="sm:w-[150px] sm:shrink-0"
        />
      </div>
      <div>
        <SubmitButton busy={busy}>{REQUEST_FORM.button}</SubmitButton>
      </div>
      <Honeypot id="request-website" />
      <FormStatus state={state} sentMessage={REQUEST_FORM.sent} />
    </form>
  );
}

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-book-line bg-book-paper py-14 md:py-16">
      <Container className="flex max-w-[860px] flex-col gap-1">
        <h2 className="mb-4 text-[40px] font-extrabold leading-none text-book-green">{FAQ.headline}</h2>
        {FAQ.items.map((item, index) => (
          <div
            key={item.id}
            id={item.id}
            className={
              "flex scroll-mt-16 flex-col gap-1.5 border-t border-book-line py-4" +
              (index === FAQ.items.length - 1 ? " border-b" : "")
            }
          >
            <h3 className="text-[24px] font-bold leading-tight">{item.question}</h3>
            <p className="text-[17px] leading-[1.5] text-book-muted">{item.answer}</p>
            {item.id === "request" ? <CourseRequestForm /> : null}
          </div>
        ))}
      </Container>
    </section>
  );
}
