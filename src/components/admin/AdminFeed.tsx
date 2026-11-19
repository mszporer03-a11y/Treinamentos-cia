"use client";

import { FileText } from "lucide-react";
import { PostFeed } from "@/components/PostFeed";
import type { PostMaterial } from "@/components/PostCard";

export function AdminFeed({ materials }: { materials: PostMaterial[] }) {
  if (materials.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl">
        <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">Nenhum material cadastrado ainda</p>
      </div>
    );
  }
  return <PostFeed materials={materials} showStatus />;
}
