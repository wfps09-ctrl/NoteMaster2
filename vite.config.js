import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig({
  plugins: [react()],
  base: '/NoteMaster2/', // 這裡請替換成您的 GitHub 儲存庫名稱
})
