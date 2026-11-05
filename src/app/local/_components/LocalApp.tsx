"use client";

// LocalApp — the /local picker: search the local OSM cohort or browse already-generated
// courses, and pick one. Selecting a course now navigates to its own page
// (/local/course/<key>, see CoursePicker's row links) instead of rendering the per-course flow
// inline — that lives in CourseApp.

import CoursePicker from "./CoursePicker";

export default function LocalApp() {
  return (
    <div className="flex flex-col">
      <CoursePicker />
    </div>
  );
}
