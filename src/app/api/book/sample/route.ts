import { handleFormPost } from "../_shared";
import { parseSampleRequest } from "@/lib/book/forms";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  return handleFormPost(req, parseSampleRequest, (v, receivedAt) => ({
    kind: "sample",
    email: v.email,
    updates: v.updates,
    receivedAt,
  }));
}
