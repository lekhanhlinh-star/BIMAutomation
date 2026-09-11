import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = process.env.API_PROXY_TARGET || env.API_PROXY_TARGET || 'http://127.0.0.1:8010';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5174,
      proxy: Object.fromEntries(['/api', '/sample_data', '/static'].map(path => [path, { target, changeOrigin: true }])),
    },
  };
});
