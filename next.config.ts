import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.WORKLOU_MOCK_PREVIEW !== "1") return [];
    return {
      beforeFiles: [
        { source: "/", destination: "/mock-preview/today" },
        ...[
          "today",
          "clients",
          "shelters",
          "plans",
          "letters",
          "follow-ups",
          "working",
          "done",
          "states",
        ].map((route) => ({
          source: `/${route}/:path*`,
          destination: `/mock-preview/${route}/:path*`,
        })),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
    : [],
  experimental: {
    // Dev-only Server Actions origin guard: the preview proxy serves the app
    // on an external origin whose host differs from the sandbox host in
    // x-forwarded-host; without this Next aborts action POSTs as cross-origin.
    serverActions: {
      allowedOrigins: ["*.base44-preview.app", "*.imported.base44-preview.app"],
    },
  },
};

export default nextConfig;
