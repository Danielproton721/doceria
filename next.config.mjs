/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sem StrictMode no dev: a montagem dupla dele fazia o useBackClose fechar o
  // produto na mesma hora no localhost (produção nunca teve esse problema).
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imgcdn.dev',
      },
      {
        protocol: 'https',
        hostname: 'i.imgcdn.dev',
      },
    ],
  },
}

export default nextConfig
