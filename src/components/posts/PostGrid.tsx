"use client";

import { useState } from "react";
import { PostCard, type PostMaterial } from "./PostCard";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";

/** Grade de post-cards com visualizador embutido. */
export function PostGrid({
  materials,
  trackViews = false,
  showStatus = false,
  accent = "orange",
}: {
  materials: PostMaterial[];
  trackViews?: boolean;
  showStatus?: boolean;
  accent?: "orange" | "blue";
}) {
  const [viewing, setViewing] = useState<PostMaterial | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((m) => (
          <PostCard
            key={m.id}
            material={m}
            showStatus={showStatus}
            accent={accent}
            onOpen={() => {
              setViewing(m);
              if (trackViews) fetch(`/api/materials/${m.id}/view`, { method: "POST" });
            }}
          />
        ))}
      </div>
      {viewing && <MaterialViewer material={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
