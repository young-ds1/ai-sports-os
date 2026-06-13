/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
      // Proxy match-results.json to backend API for live updates
      {
        source: '/match-results.json',
        destination: 'http://localhost:3001/api/results',
      },
    ];
  },
};

module.exports = nextConfig;
