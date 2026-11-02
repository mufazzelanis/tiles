// Plain JS (not .ts) so the production server needs no compiler at startup —
// the shared host's glibc is too old for Next's native SWC binary.
/** @type {import("next").NextConfig} */
const nextConfig = {
  // keep the dev badge away from the admin sidebar
  devIndicators: { position: "bottom-right" },
  images: {
    remotePatterns: [new URL("https://images.unsplash.com/**")],
    qualities: [75, 85],
  },
};

export default nextConfig;
