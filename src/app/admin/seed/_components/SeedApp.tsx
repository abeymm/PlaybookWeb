"use client";

// SeedApp — routes between the seed list (landing) and the click-to-seed editor. Kept thin: all
// list logic lives in SeedLanding, all editing logic in SeedEditor.

import { useState } from "react";
import SeedLanding from "./SeedLanding";
import SeedEditor from "./SeedEditor";
import type { SeedDraft } from "@/lib/coursedata/seed";

interface Editing {
  draft: SeedDraft;
  savedKey: string | null;
}

export default function SeedApp() {
  const [editing, setEditing] = useState<Editing | null>(null);

  if (!editing) {
    return (
      <SeedLanding
        onNew={() => setEditing({ draft: { name: "", slug: "", holes: [] }, savedKey: null })}
        onOpen={(draft, key) => setEditing({ draft, savedKey: key })}
      />
    );
  }

  return (
    <SeedEditor
      initial={editing.draft}
      savedKey={editing.savedKey}
      onBack={() => setEditing(null)}
    />
  );
}
