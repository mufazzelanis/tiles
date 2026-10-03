import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // keep the dev badge away from the admin sidebar
  devIndicators: { position: "bottom-right" },
  images: {
    remotePatterns: [new URL("https://images.unsplash.com/**")],
    qualities: [75, 85],
  },
};

export default nextConfig;
