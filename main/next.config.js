// const path = require('node:path');
// const { fileURLToPath } = require('node:url');

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  // transpilePackages: [
  //   // path.resolve(__dirname, '../packages/api'),
  //   // path.resolve(__dirname, '../packages/vdk'),
  //   // path.resolve(__dirname, '../verticals/vertical-sales-engagement'),
  // ],
  // // webpack: (config, {isServer}) => {
  // //   config.optimization.providedExports = true
  // //   return config
  // // }
  // experimental: {
  //   esmExternals: true,
  // },
}

module.exports = nextConfig
