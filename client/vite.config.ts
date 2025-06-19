import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({}) => {
  
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { 
      "/api": { 
        target: "http://localhost:3000", 
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
