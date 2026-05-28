import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  materialUploader: f({
    video: { maxFileSize: "2GB", maxFileCount: 1 },
    pdf: { maxFileSize: "64MB", maxFileCount: 1 },
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
    "application/vnd.ms-powerpoint": { maxFileSize: "64MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),

  campaignImageUploader: f({
    image: { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, key: file.key, name: file.name };
    }),

  chatAttachment: f({
    image: { maxFileSize: "16MB", maxFileCount: 1 },
    pdf: { maxFileSize: "32MB", maxFileCount: 1 },
    video: { maxFileSize: "256MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.ms-powerpoint": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "32MB", maxFileCount: 1 },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url, key: file.key, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
