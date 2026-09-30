import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "animefriends.com.br",
      },
      {
        protocol: "https",
        hostname: "grcmlesydpcd.objectstorage.sa-saopaulo-1.oci.customer-oci.com",
      },
      {
        protocol: "https",
        hostname: "hscezbhsnotjrwsdnkqs.supabase.co",
      },
    ],
  },
};

export default nextConfig;
