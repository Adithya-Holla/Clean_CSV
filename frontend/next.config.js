/** @type {import('next').NextConfig} */
const nextConfig = {
  // No experimental config needed for Next.js 14 with app directory
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
