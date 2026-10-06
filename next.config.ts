import type { NextConfig } from "next";

// BUILD_TARGET=cpanel activa el modo standalone para desplegar en el cPanel
// propio (Setup Node.js App) en vez de Vercel — ver scripts/prepare-cpanel-build.js
// y el script "build:cpanel" en package.json. Sin esa variable, el build se
// comporta exactamente igual que antes (para Vercel).
const esCpanel = process.env.BUILD_TARGET === "cpanel";

const nextConfig: NextConfig = {
  ...(esCpanel && {
    output: "standalone",
    images: { unoptimized: true },
  }),
};

export default nextConfig;
