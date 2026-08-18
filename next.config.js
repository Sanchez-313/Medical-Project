/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone build (server.js + only the
  // node_modules it actually needs) so the Docker runtime image doesn't
  // have to ship the full node_modules tree. No effect on `next dev`.
  output: "standalone",
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
    },
  },
  images: {
    unoptimized: true,
  },
  // Telegram's in-app WebView caches the HTML document far more
  // aggressively than a normal mobile browser and doesn't reliably
  // re-fetch it on next open — customers kept seeing yesterday's build
  // after a fresh Railway deploy even though the deploy itself was fine.
  // Force every page/API response to revalidate; /_next/static/* chunks
  // are unaffected (they're content-hashed per build and Next already
  // marks them immutable/cache-forever, which is what you still want).
  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image).*)",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }],
      },
    ];
  },
};

module.exports = nextConfig;
