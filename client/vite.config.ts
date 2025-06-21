import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const SERVER_URL = env.VITE_SERVER_URL || "http://localhost:3000"
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: SERVER_URL,
          changeOrigin: true,
        },
      },
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
