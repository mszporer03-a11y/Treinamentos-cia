import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminPerfilPage() {
  const session = await auth();

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Meu Perfil
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Edite suas informações pessoais e senha
        </p>
      </div>
      <ProfileForm user={{ id: session!.user.id, name: session!.user.name, email: session!.user.email }} />
    </div>
  );
}
