/**
 * Sends a /book form submission through the Backend's `submitForm` mutation, which emails it to
 * support@playbook.golf (Backend: amplify/functions/form-submission-function). The mutation is open to
 * guests through the identity pool, so the server route signs in as a guest; no secret is needed.
 *
 * `toFormRequest` and `interpretSubmitResult` are pure and unit tested. `sendSubmitForm` is the
 * only part that touches the network; it loads aws-amplify on first use.
 */
import outputs from "../../../amplify_outputs.json";
import type { Submission } from "./delivery";

export type SubmitFormRequest = {
  formType: string;
  subject: string;
  formData: Record<string, string | number>;
  replyToEmail: string;
};

export type SubmitResult = { ok: true } | { ok: false; error: string };

// Control characters could split a mail header; the validators already refuse them, this is the backstop.
function oneLine(text: string): string {
  return text.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

/** Maps a validated submission to the mutation's arguments. The player is the reply-to. */
export function toFormRequest(sub: Submission): SubmitFormRequest {
  switch (sub.kind) {
    case "scottsdale-preorder":
      return {
        formType: "scottsdale-preorder",
        subject: oneLine(`TPC Scottsdale book pre-order: ${sub.name}`),
        formData: { name: sub.name, email: sub.email, receivedAt: sub.receivedAt },
        replyToEmail: sub.email,
      };
    case "course-request":
      return {
        formType: "course-request",
        subject: oneLine(`Course book request: ${sub.course}`),
        formData: {
          email: sub.email,
          course: sub.course,
          ...(sub.groupSize !== undefined ? { groupSize: sub.groupSize } : {}),
          receivedAt: sub.receivedAt,
        },
        replyToEmail: sub.email,
      };
  }
}

/** Reads the mutation's JSON reply (an object, or a JSON string as AppSync returns it). */
export function interpretSubmitResult(raw: unknown): SubmitResult {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return { ok: false, error: "Unreadable reply from the form mailer." };
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "Unexpected reply from the form mailer." };
  }
  const reply = value as { success?: unknown; error?: unknown };
  if (reply.success === true) return { ok: true };
  return { ok: false, error: typeof reply.error === "string" ? reply.error : "The form mailer reported a failure." };
}

const SUBMIT_FORM = /* GraphQL */ `
  mutation SubmitForm($formType: String!, $subject: String, $formData: AWSJSON!, $replyToEmail: AWSEmail) {
    submitForm(formType: $formType, subject: $subject, formData: $formData, replyToEmail: $replyToEmail)
  }
`;

let configured = false;

/** Calls the mutation as a guest. Throws on any failure, so `deliver` can report it. */
export async function sendSubmitForm(req: SubmitFormRequest): Promise<void> {
  const [{ Amplify }, { generateClient }] = await Promise.all([import("aws-amplify"), import("aws-amplify/api")]);
  if (!configured) {
    Amplify.configure(outputs);
    configured = true;
  }
  const client = generateClient();
  const response = (await client.graphql({
    query: SUBMIT_FORM,
    variables: {
      formType: req.formType,
      subject: req.subject,
      formData: JSON.stringify(req.formData),
      replyToEmail: req.replyToEmail,
    },
    authMode: "identityPool",
  })) as { data?: { submitForm?: unknown }; errors?: { message?: string }[] };
  if (response.errors?.length) throw new Error(response.errors[0]?.message ?? "GraphQL error");
  const result = interpretSubmitResult(response.data?.submitForm);
  if (!result.ok) throw new Error(result.error);
}
