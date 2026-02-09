/** @type {import('next').NextConfig} */
const nextConfig = {
  // Images configuration for external hosts
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
