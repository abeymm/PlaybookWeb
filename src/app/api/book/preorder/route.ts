import { handleFormPost } from "../_shared";
import { parsePreorder } from "@/lib/book/preorder";

export const runtime = "nodejs";

const MSG_UNAVAILABLE =
  "We could not save your pre-order. Email support@playbook.golf with your name and we will add you.";

export async function POST(req: Request): Promise<Response> {
  return handleFormPost(
    req,
    parsePreorder,
    (v, receivedAt) => ({ kind: "scottsdale-preorder", name: v.name, email: v.email, receivedAt }),
    { unavailableMessage: MSG_UNAVAILABLE },
  );
}
