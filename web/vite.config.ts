import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function ortWasmPlugin(): Plugin {
  return {
    name: 'ort-wasm-serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const urlPath = (req.url || '').split('?')[0];
        if (urlPath.startsWith('/ort-wasm')) {
          const fileName = path.basename(urlPath);
          const distPath = path.resolve(__dirname, 'node_modules/onnxruntime-web/dist', fileName);
          if (fs.existsSync(distPath)) {
            if (fileName.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm');
            } else if (fileName.endsWith('.mjs') || fileName.endsWith('.js')) {
              res.setHeader('Content-Type', 'text/javascript');
            }
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
            res.statusCode = 200;
            return fs.createReadStream(distPath).pipe(res);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), ortWasmPlugin()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
});