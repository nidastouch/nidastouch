import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // dev only: lets Leo's phone on the same Wi-Fi load the dev server (this Mac's LAN address)
  allowedDevOrigins: ["192.168.68.53"],
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
