/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support Leaflet and client-side map rendering
  transpilePackages: ['react-leaflet', 'leaflet'],
};

export default nextConfig;
