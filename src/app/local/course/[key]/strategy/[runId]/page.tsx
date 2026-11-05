import { notFound } from "next/navigation";
import { isValidCourseKey } from "@/lib/localflow/config";
import StrategyApp from "../../../../_components/strategy/StrategyApp";

// Server wrapper: only the course key's shape is gated here (404 otherwise). The run id is passed
// through untouched — the strategy API validates it and the client shows a clear "no such run" message.
export default async function StrategyPage({ params }: { params: Promise<{ key: string; runId: string }> }) {
  const { key, runId } = await params;
  const courseKey = decodeURIComponent(key);
  if (!isValidCourseKey(courseKey)) notFound();
  return <StrategyApp courseKey={courseKey} runId={decodeURIComponent(runId)} />;
}
