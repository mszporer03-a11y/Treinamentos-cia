import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { resolveActiveStore } from "@/lib/active-store";
import { FranchiseeShell } from "@/components/franchisee/FranchiseeShell";

export default async function FranchiseeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/login");

  // Franqueado com mais de uma loja precisa escolher a loja ativa
  const { stores, active, needsSelection } = await resolveActiveStore(session.user.id);
  if (needsSelection) redirect("/selecionar-loja");

  return (
    <FranchiseeShell
      user={session.user}
      stores={stores}
      activeStoreId={active?.id ?? null}
      storeNames={active ? [active.name] : stores.map((s) => s.name)}
    >
      {children}
    </FranchiseeShell>
  );
}
