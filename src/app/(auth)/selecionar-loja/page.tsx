import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveActiveStore } from "@/lib/active-store";
import { StorePicker } from "@/components/franchisee/StorePicker";

export const dynamic = "force-dynamic";

// Escolha de loja logo após o login (franqueados com mais de uma loja)
export default async function SelecionarLojaPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const { stores, active } = await resolveActiveStore(session.user.id);
  // Nada a escolher: zero ou uma loja
  if (stores.length <= 1) redirect("/gallery");

  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/gallery";

  return (
    <StorePicker
      userName={session.user.name ?? ""}
      stores={stores}
      activeStoreId={active?.id ?? null}
      next={next}
    />
  );
}
