import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Proxy de arquivos hospedados no UploadThing — permite ao navegador ler PDFs
// (pdf.js) sem depender de CORS e forçar download com o nome original.
function isAllowedHost(host: string) {
  return host === "utfs.io" || host.endsWith(".ufs.sh") || host === "ufs.sh";
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");
  const download = searchParams.get("download");
  if (!raw) return NextResponse.json({ error: "url obrigatória" }, { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "url inválida" }, { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host não permitido" }, { status: 400 });
  }

  const upstream = await fetch(target.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Arquivo indisponível" }, { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "private, max-age=3600");
  if (download) {
    const safe = download.replace(/[\r\n"]/g, "").slice(0, 150);
    headers.set(
      "Content-Disposition",
      `attachment; filename="${safe.replace(/[^ -~]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(safe)}`
    );
  }
  return new Response(upstream.body, { headers });
}
