import type { NextConfig } from 'next';

// On Vercel the API runs as a separate project. HMS_API_ORIGIN points at it, and /api/* is proxied
// there so the browser talks to one origin and the login cookie stays first-party.
const apiOrigin = process.env.HMS_API_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  typedRoutes: true,
  async rewrites() {
    return apiOrigin ? [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }] : [];
  }
};

export default nextConfig;
