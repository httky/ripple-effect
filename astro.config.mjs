import glsl from 'vite-plugin-glsl'
import { terser } from 'rollup-plugin-terser'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/ripple-effect/wip/' : '/',
  outDir: './docs/wip',
  vite: {
    plugins: [glsl()],
    build: { // ビルド時にconsoleを削除
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        plugins: [terser()],
      },
    },
  },
  server: {
    host: true,
  },
})
