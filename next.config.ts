import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // dev only: lets Leo's phone on the same Wi-Fi load the dev server (this Mac's LAN address)
  allowedDevOrigins: ["192.168.68.53"],
  // The clips and stills don't change between visits: let browsers keep them for a day, and serve the
  // cached copy while checking for a new one for a week, instead of re-checking every 2-4 MB clip each time
  // the hero cuts back to it. (A replaced file shows up within a day.)
  async headers() {
    return [
      {
        source: "/lab/touch/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  // the studio was built at /lab/... before it replaced the old home page
  async redirects() {
    return [
      { source: "/lab/touch", destination: "/", permanent: true },
      { source: "/lab/people", destination: "/people", permanent: true },
      { source: "/lab/notary", destination: "/notary", permanent: true },
      { source: "/lab/consulting", destination: "/consulting", permanent: true },
    ];
  },
};

export default nextConfig;
