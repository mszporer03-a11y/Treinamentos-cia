import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FranchiseeShell } from "@/components/franchisee/FranchiseeShell";

export default async function FranchiseeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  const userStores = await db.userStore.findMany({
    where: { userId: session.user.id },
    select: { store: { select: { name: true } } },
    orderBy: { store: { name: "asc" } },
  });

  return (
    <FranchiseeShell user={session.user} storeNames={userStores.map(({ store }) => store.name)}>
      {children}
    </FranchiseeShell>
  );
}
