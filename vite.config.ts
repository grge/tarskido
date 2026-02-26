import { fileURLToPath, URL } from 'node:url';
import fs from 'fs';
import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/tarskido/',
  plugins: [
    vue(), 
    vueJsx(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          console.log('🔍 Middleware check:', req.url);
          
          // Match our specific SPA route patterns from the router
          const spaRoutePatterns = [
            /^\/tarskido\/$/, // Home page
            /^\/tarskido\/book\/[^/]+$/, // Book page: /tarskido/book/{bookParam}
            /^\/tarskido\/book\/[^/]+\/edit$/, // Book edit: /tarskido/book/{bookParam}/edit
            /^\/tarskido\/book\/[^/]+\/list$/, // Node list: /tarskido/book/{bookParam}/list
            /^\/tarskido\/book\/[^/]+\/[^/]+$/, // Node page: /tarskido/book/{bookParam}/{nodeParam}
            /^\/tarskido\/book\/[^/]+\/[^/]+\/edit$/, // Node edit: /tarskido/book/{bookParam}/{nodeParam}/edit
          ];
          
          const isSpaRoute = req.method === 'GET' && req.url && spaRoutePatterns.some(pattern => pattern.test(req.url!));
          
          if (isSpaRoute) {
            console.log('✅ SPA route detected, serving index.html for:', req.url);
            const indexPath = path.resolve(__dirname, 'index.html');
            if (fs.existsSync(indexPath)) {
              res.setHeader('Content-Type', 'text/html');
              res.end(fs.readFileSync(indexPath));
              return;
            } else {
              console.log('❌ index.html not found at:', indexPath);
            }
          } else {
            console.log('⏭️  Skipping (not SPA route):', req.url);
          }
          next();
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
