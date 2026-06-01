import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { FranchiseeShell } from "@/components/franchisee/FranchiseeShell";

export default async function FranchiseeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  return <FranchiseeShell user={session.user}>{children}</FranchiseeShell>;
}
