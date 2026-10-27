import { handleFormPost } from "../_shared";
import { parseCourseRequest } from "@/lib/book/forms";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  return handleFormPost(req, parseCourseRequest, (v, receivedAt) => ({
    kind: "course-request",
    email: v.email,
    course: v.course,
    ...(v.groupSize !== undefined ? { groupSize: v.groupSize } : {}),
    receivedAt,
  }));
}
