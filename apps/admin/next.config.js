require('../../load-root-env.cjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@differenzia/core', '@differenzia/ui'],
};

module.exports = nextConfig;
