import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.json'],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /node_modules/,
        /supabase/,
        /@supabase/
      ]
    },
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'solana-web3': ['@solana/web3.js'],
          'solana-spl': ['@solana/spl-token'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  },
  define: {
    'process.env': {},
    'global': {}
  },
  plugins: [
    react(),
    nodePolyfills({
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    })
  ],
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      crypto: 'crypto-browserify',
      events: 'events',
      buffer: 'buffer',
      assert: 'assert',
      path: 'path-browserify',
      fs: 'browserify-fs',
      os: 'os-browserify/browser',
      http: 'stream-http',
      https: 'https-browserify',
      querystring: 'querystring-es3',
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      define: {
        global: 'globalThis'
      },
      supported: {
        bigint: true
      }
    },
    include: [
      '@solana/web3.js',
      '@solana/spl-token',
      'bn.js',
      'buffer',
      'crypto-browserify',
      'events',
      'stream-browserify',
      'util',
      'assert',
      'path-browserify',
      'os-browserify/browser',
      'stream-http',
      'https-browserify',
    ]
  }
});
