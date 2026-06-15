/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ypwfwdaohkxhooehtyrp.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["careroot.care", "localhost:3000"],
    },
  },
};

export default nextConfig;
