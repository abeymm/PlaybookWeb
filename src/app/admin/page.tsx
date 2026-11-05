import { redirect } from "next/navigation";

// Default /admin landing = the triage queue (Design Resolution D3: triage-first, not a raw table).
export default function AdminIndex() {
  redirect("/admin/review");
}
