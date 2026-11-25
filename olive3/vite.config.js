import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const STATIC_ASSETS = [
  '1000392409.jpeg',
  '404.html',
  'offline.html',
  'privacy.html',
  'terms.html',
  'returns.html',
  'google2ff3d10d86a53cec.html',
  'apple-touch-icon.png',
  'favicon-32x32.png',
  'favicon.ico',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'og-share.jpg',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'firebase-messaging-sw.js',
  'style.css'
];

function copyStaticAssetsPlugin() {
  return {
    name: 'copy-zait-static-assets',
    closeBundle() {
      const rootDir = process.cwd();
      const outDir = path.resolve(rootDir, 'dist');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }
      for (const fileName of STATIC_ASSETS) {
        const srcPath = path.resolve(rootDir, fileName);
        const destPath = path.resolve(outDir, fileName);
        if (fs.existsSync(srcPath) && !fs.existsSync(destPath)) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  };
}

export default defineConfig({
  base: '/',
  publicDir: false,
  plugins: [copyStaticAssetsPlugin()],
  esbuild: {
    target: 'esnext'
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: false,
    rollupOptions: {
      external: [/^https?:\/\//]
    }
  }
});
