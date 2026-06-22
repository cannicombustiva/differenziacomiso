/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: require('./package.json').version,
  },
};

module.exports = nextConfig;
