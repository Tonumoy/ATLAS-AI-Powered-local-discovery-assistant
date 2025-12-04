import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), basicSsl()],
    server: {
      host: true,
      port: 3000,
      proxy: {
        '/api': 'http://localhost:3001'
      }
    }
  };
});
