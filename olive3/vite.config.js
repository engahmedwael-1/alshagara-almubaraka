import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  root: '.',
  publicDir: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      input: {
        main: 'index.html'
      },
      output: {
        manualChunks: {
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
          'vendor': ['leaflet']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          if (/\.(css)$/.test(assetInfo.name)) {
            return `assets/css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    modulePreload: {
      polyfill: true
    }
  },
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime'],
      renderLegacyChunks: true,
      polyfills: [
        'es.globalThis',
        'es.array.find',
        'es.array.find-index',
        'es.object.assign',
        'es.object.entries',
        'es.object.values',
        'es.promise',
        'es.string.includes',
        'es.string.starts-with',
        'es.string.ends-with',
        'web.dom-collections.iterator',
        'web.dom-collections.for-each'
      ]
    })
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics', 'leaflet'],
    exclude: []
  },
  resolve: {
    alias: {
      '@': '/src',
      '@js': '/src/js',
      '@components': '/src/js/components',
      '@modules': '/src/js/modules',
      '@utils': '/src/js/utils',
      '@config': '/src/js/config'
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  css: {
    devSourcemap: true,
    postcss: {}
  }
});