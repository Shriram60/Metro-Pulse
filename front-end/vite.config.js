import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // The API reads its port from backend/.env, so the proxy has to look there too.
  const backendDir = fileURLToPath(new URL('../backend', import.meta.url));
  const { PORT = 5000 } = loadEnv(mode, backendDir, '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: { '/api': `http://localhost:${PORT}` },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.js',
    },
  };
});
