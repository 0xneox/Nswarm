import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.json'],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'solana-web3': ['@solana/web3.js'],
          'solana-spl': ['@solana/spl-token'],
          'bn': ['bn.js']
        }
      }
    }
  },
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill specific globals.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Whether to polyfill specific modules
      protocolImports: true,
      // Include all required polyfills for Solana
      include: [
        'buffer', 
        'crypto', 
        'events', 
        'stream', 
        'string_decoder',
        'util', 
        'assert',
        'http', 
        'https', 
        'os', 
        'path', 
        'punycode',
        'querystring',
        'url', 
        'zlib'
      ]
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
    },
    include: [
      '@solana/web3.js',
      '@solana/spl-token',
      'bn.js',
      'buffer',
    ],
    // Exclude problematic dependencies
    exclude: ['elliptic']
  },
  resolve: {
    alias: {
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
    }
  },
  define: {
    'process.env': {},
    // Fix Buffer is not defined error
    'global': 'globalThis',
  }
});
