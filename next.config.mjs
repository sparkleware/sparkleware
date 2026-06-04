/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Promoted from `experimental` to top-level stable in Next 15.5.
  typedRoutes: true,
  webpack: (config) => {
    // transformers.js (client-side embeddings) pulls in node-only backends.
    // Stub them so the browser bundle stays clean and builds under `output: export`.
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-node': false,
      sharp: false,
    };
    return config;
  },
};

export default nextConfig;
