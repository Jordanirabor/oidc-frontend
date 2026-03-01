import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: "standalone",

  async rewrites() {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

    return [
      // Only rewrite specific API routes that should go to the backend
      // Don't rewrite /api/developer/* routes as they are handled by Next.js API routes
      {
        source: "/api/consent/:path*",
        destination: `${backendUrl}/api/consent/:path*`,
      },
      {
        source: "/api/request-magic-link/:path*",
        destination: `${backendUrl}/api/request-magic-link/:path*`,
      },
      {
        source: "/api/consent-data/:path*",
        destination: `${backendUrl}/api/consent-data/:path*`,
      },
    ];
  },

  // Enable CORS handling for cross-origin requests in production
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
