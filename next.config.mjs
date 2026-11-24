/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  // O chat comum foi removido — links antigos (notificações, favoritos) vão
  // para o Chat Emergencial, único canal de chat que permanece.
  async redirects() {
    return [
      { source: "/chat", destination: "/emergencia", permanent: false },
      { source: "/admin/chat", destination: "/admin/emergencia", permanent: false },
      { source: "/admin/chat/:path*", destination: "/admin/emergencia", permanent: false },
    ];
  },
  webpack: (config) => {
    // pdf.js tenta carregar "canvas" (só Node); no navegador não é necessário
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
