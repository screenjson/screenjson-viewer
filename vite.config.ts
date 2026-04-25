import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.TAURI_DEV_HOST;

// Resolve the screenjson-ui reference repo alongside this one. Using it as
// SOURCE (not the compiled bundle) avoids the two-Svelte-runtimes problem
// that causes `effect_orphan` errors when a bundled Svelte component tries
// to mount inside our Svelte app.
const screenjsonUiSrc = path.resolve(__dirname, '../screenjson-ui-REFERENCE-ONLY/src/lib');

export default defineConfig({
  plugins: [svelte(), tailwindcss()],

  resolve: {
    alias: [
      // Consume screenjson-ui from source, not the built bundle.
      { find: /^screenjson-ui$/, replacement: path.join(screenjsonUiSrc, 'index.ts') },
      { find: /^screenjson-ui\/style\.css$/, replacement: path.resolve(__dirname, 'src/app-viewer.css') },
      // Shim SvelteKit's $app/environment for the three source files that reference it.
      { find: /^\$app\/environment$/, replacement: path.resolve(__dirname, 'src/lib/shims/env.ts') }
    ]
  },

  build: {
    target: ['es2022', 'chrome105', 'safari15'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    fs: {
      // Allow Vite to import files from the sibling reference repo.
      allow: [__dirname, screenjsonUiSrc, path.resolve(__dirname, '..')]
    },
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },

  envPrefix: ['VITE_', 'TAURI_ENV_*']
});
