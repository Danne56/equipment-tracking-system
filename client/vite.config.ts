import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: env.VITE_ALLOWED_HOSTS?.split(',').map(host => host.trim()) || ['localhost:5173'],
    },
    resolve: {
      alias: {
        "@client": path.resolve(__dirname, "./src"),
        "@server": path.resolve(__dirname, "../server/src"),
        "@shared": path.resolve(__dirname, "../shared/src")
      }
    }
  }
})
