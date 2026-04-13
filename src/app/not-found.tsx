import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600 mb-2">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-gray-500 mb-6">
          O endereço que você acessou não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
