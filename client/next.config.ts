import type { NextConfig } from 'next';

const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');
const api = new URL(API_URL);

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },

  images: {
    // Local development serves legacy media from the API on localhost; never enabled for a public API host.
    dangerouslyAllowLocalIP: ['localhost', '127.0.0.1'].includes(api.hostname),
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: api.protocol.replace(':', '') as 'http' | 'https', hostname: api.hostname, port: api.port, pathname: '/media/**' },
    ],
  },

  // Browser calls to /api/* are proxied to the Express server so the admin session cookie is
  // first-party. Route handlers in src/app/api (e.g. /api/revalidate) take precedence.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },

  // Keep old WordPress URLs working.
  async redirects() {
    return [
      { source: '/about-us', destination: '/about', permanent: true },
      { source: '/about-us-2', destination: '/about', permanent: true },
      { source: '/contact-us', destination: '/contact', permanent: true },
      { source: '/contact-us-2', destination: '/contact', permanent: true },
      { source: '/enrolment', destination: '/enrol', permanent: true },
      { source: '/product-training', destination: '/conferencing', permanent: true },
      { source: '/my-calendar', destination: '/events', permanent: true },
      { source: '/events/:slug(tax-conference|payroll-training|protocol)', destination: '/events', permanent: false },
      { source: '/event/:slug*', destination: '/events', permanent: true },
      { source: '/ponzi-schemes', destination: '/blog/ponzi-schemes', permanent: true },
      { source: '/crm', destination: '/admin', permanent: true },
      { source: '/app/:path*', destination: '/admin', permanent: true },
      { source: '/wp-admin/:path*', destination: '/admin', permanent: true },
      { source: '/wp-login.php', destination: '/admin', permanent: true },
      { source: '/download/:file*', destination: '/downloads', permanent: true },
      { source: '/wp-content/uploads/:year(\\d{4})/:month/:file*', destination: `${API_URL}/media/:year/:month/:file*`, permanent: false },
    ];
  },
};

export default nextConfig;
