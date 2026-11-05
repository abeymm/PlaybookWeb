"use client";

import { useParams } from "next/navigation";
import CourseDetail from "./_components/CourseDetail";

export default function CourseDetailPage() {
  const params = useParams<{ osmId: string }>();
  const osmId = decodeURIComponent(params.osmId);
  return <CourseDetail osmId={osmId} />;
}
