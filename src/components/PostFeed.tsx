"use client";

import { useState } from "react";
import { MaterialViewer } from "@/components/franchisee/MaterialViewer";
import { PostCard, type PostMaterial } from "@/components/PostCard";

export function PostFeed({
  materials,
  showStatus = false,
  trackViews = false,
}: {
  materials: PostMaterial[];
  showStatus?: boolean;
  trackViews?: boolean;
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
