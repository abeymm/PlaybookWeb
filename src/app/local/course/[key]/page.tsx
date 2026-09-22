import { notFound } from "next/navigation";
import { isValidCourseKey } from "@/lib/localflow/config";
import CourseApp from "../../_components/CourseApp";

// Server wrapper: validates the URL param's *shape* before it ever reaches client code or an
// API call (the route handlers re-validate independently — this is belt-and-suspenders, not the
// only gate). An invalid key (doesn't match the OSM cache-key pattern) 404s here instead of
// mounting the client view. Whether the key actually exists in the cohort is a data question,
// not a shape question — CourseApp surfaces that itself once it queries the API.
export default async function LocalCoursePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const courseKey = decodeURIComponent(key);
  if (!isValidCourseKey(courseKey)) notFound();
  return <CourseApp courseKey={courseKey} />;
}
