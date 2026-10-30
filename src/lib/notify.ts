import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { appUrl, brandedEmail, sendEmail } from "@/lib/email";

/**
 * Franqueados que têm acesso a um material: os vinculados às lojas
 * selecionadas, ou todos os franqueados ativos quando não há restrição.
 */
export async function materialAudience(materialId: string) {
  const links = await db.materialStore.findMany({ where: { materialId }, select: { storeId: true } });
  return db.user.findMany({
    where: {
      role: "FRANCHISEE",
      active: true,
      ...(links.length > 0 ? { stores: { some: { storeId: { in: links.map((l) => l.storeId) } } } } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      stores: { select: { store: { select: { name: true, code: true } } } },
    },
    orderBy: { name: "asc" },
  });
}

/** Disparo multicanal ao publicar: push (celular/navegador) + e-mail. */
export async function notifyMaterialPublished(material: {
  id: string;
  title: string;
  fileType: string;
  summary?: string;
}) {
  const audience = await materialAudience(material.id);
  if (audience.length === 0) return;

  const isNotice = material.fileType === "NOTICE";
  const body = material.summary ? `${material.title} · ${material.summary}` : material.title;

  await Promise.allSettled([
    ...audience.map((u) =>
      sendPushToUser(u.id, {
        title: isNotice ? "Novo aviso!" : "Novo material disponível!",
        body,
        url: "/gallery",
      })
    ),
    sendEmail(
      audience.map((u) => u.email),
      "ATENÇÃO, COMUNICADO IMPORTANTE DO COMPANHIA DO CHURRASCO",
      brandedEmail({
        heading: "ATENÇÃO, COMUNICADO IMPORTANTE DO COMPANHIA DO CHURRASCO. . .",
        paragraphs: [
          "Olá! Há uma novidade na Intranet.",
          "Um novo conteúdo foi publicado. Acesse o sistema para verificar e ficar ciente das atualizações.",
        ],
        buttonLabel: "🔗 Acessar Intranet",
        buttonUrl: appUrl("/gallery"),
      })
    ),
  ]);
}
