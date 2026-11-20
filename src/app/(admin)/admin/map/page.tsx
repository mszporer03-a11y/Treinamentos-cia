import { redirect } from "next/navigation";

// O mapa agora faz parte da aba Lojas (mapa interativo + cards).
export default function MapPage() {
  redirect("/admin/stores");
}
