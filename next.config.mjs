/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Promoted from `experimental` to top-level stable in Next 15.5.
  typedRoutes: true,
};

export default nextConfig;
