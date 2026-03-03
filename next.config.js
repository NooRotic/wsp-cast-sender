/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';
const enableAnalyze = process.env.ANALYZE === 'true' || process.env.ANALYZE === '1';

let nextConfig = {
  // CONDITIONAL static export - only for production builds (hosting is 100% static)
  // Development needs dynamic features for Cast API and hot reload
  ...(isDev ? {} : {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
  }),
  
  // Keep basePath empty since we're hosting at domain root
  basePath: '',

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
    loader: 'custom',
    loaderFile: './js/utils/image-loader.js'
  },

  // Combined webpack configuration for static export and debugging
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    // Enable source maps in production builds for debugging
    else {
      config.devtool = 'source-map';
    }

    // CRITICAL: Fix chunk loading issues for static export (PRODUCTION ONLY)
    if (!isServer && !dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Combine all chunks into fewer files to prevent 404s
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 10,
          },
        },
      };
    }

    return config;
  },

  // Enable source maps for production builds
  productionBrowserSourceMaps: !isDev,
};

// Optionally wrap with bundle analyzer when requested
if (enableAnalyze) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true });
    nextConfig = withBundleAnalyzer(nextConfig);
  } catch (e) {
    // If the analyzer isn't installed, continue without failing the build
    // console.warn('Bundle analyzer not installed, skipping analyzer wrapper.');
  }
}

module.exports = nextConfig;
