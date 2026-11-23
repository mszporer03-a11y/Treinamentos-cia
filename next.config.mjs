/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
  webpack: (config) => {
    // pdf.js tenta carregar "canvas" (só Node); no navegador não é necessário
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
