/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mempercepat proses build di Vercel dengan melewati eslint redundant
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
