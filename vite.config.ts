import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react(),
    tailwindcss(),
    tsConfigPaths(),
  ],
  server: {
    proxy: {
      '/api/mangadex': {
        target: 'https://api.mangadex.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/mangadex/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 JarvisComics/1.0');
          });
        }
      },
      '/api/anime': {
        target: 'https://api.consumet.org/anime',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anime/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 JarvisComics/1.0');
          });
        }
      },
      '/api/covers': {
        target: 'https://uploads.mangadex.org/covers',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/covers/, '')
      },
      '/api/image': {
        target: 'https://mangadex.org', // placeholder
        changeOrigin: true,
        router: (req) => {
          const url = new URL(req.url, 'http://localhost');
          const targetUrl = url.searchParams.get('url');
          if (targetUrl) {
            const parsed = new URL(targetUrl);
            return `${parsed.protocol}//${parsed.host}`;
          }
          return 'https://mangadex.org';
        },
        rewrite: (path, req) => {
          const url = new URL(req.url, 'http://localhost');
          const targetUrl = url.searchParams.get('url');
          if (targetUrl) {
            const parsed = new URL(targetUrl);
            return parsed.pathname + parsed.search;
          }
          return path;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Referer', 'https://mangadex.org/');
            proxyReq.setHeader('Origin', 'https://mangadex.org');
          });
        }
      }
    }
  }
})
