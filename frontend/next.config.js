/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for Render deployment
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // For Render deployment
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig
