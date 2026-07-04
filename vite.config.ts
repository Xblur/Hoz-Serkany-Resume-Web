import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// base must match the GitHub Pages repo name (https://<user>.github.io/Hoz-Serkany-Resume-Web/)
export default defineConfig({
  base: '/Hoz-Serkany-Resume-Web/',
  plugins: [vue(), tailwindcss()],
})
