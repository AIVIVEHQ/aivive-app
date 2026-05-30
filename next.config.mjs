import bundleAnalyzer from "@next/bundle-analyzer";
import createNextIntlPlugin from "next-intl/plugin";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  reactStrictMode: false,
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  images: {
    qualities: [50, 75, 100],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*",
      },
    ],
  },
  async redirects() {
    return [];
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
