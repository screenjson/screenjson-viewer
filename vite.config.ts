import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.TAURI_DEV_HOST;

// Resolve the screenjson-ui GitHub source dependency from node_modules. Using
// source (not the compiled bundle) avoids the two-Svelte-runtimes problem that
// causes `effect_orphan` errors when a bundled Svelte component tries to mount
// inside our Svelte app.
const screenjsonUiRoot = path.resolve(__dirname, 'node_modules/screenjson-ui');
const screenjsonUiSrc = path.join(screenjsonUiRoot, 'src/lib');
const screenjsonUiCss = path.join(screenjsonUiRoot, 'src/app.css');
const screenjsonUiCssShim = path.resolve(__dirname, 'src/lib/shims/screenjson-ui-app.css');

function stripQuery(id: string): string {
  return id.split('?')[0];
}

function isPath(id: string, target: string): boolean {
  return path.normalize(stripQuery(id)) === path.normalize(target);
}

function screenjsonUiCssNoop() {
  return {
    name: 'screenjson-ui-css-noop',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (
        source === '../app.css' &&
        importer &&
        isPath(importer, path.join(screenjsonUiSrc, 'index.ts'))
      ) {
        return screenjsonUiCssShim;
      }

      if (isPath(source, screenjsonUiCss)) {
        return screenjsonUiCssShim;
      }

      return null;
    }
  };
}

export default defineConfig({
  plugins: [screenjsonUiCssNoop(), svelte(), tailwindcss()],

  resolve: {
    alias: [
      // Consume screenjson-ui from source, not the built bundle.
      { find: /^screenjson-ui$/, replacement: path.join(screenjsonUiSrc, 'index.ts') },
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
      allow: [__dirname, screenjsonUiRoot]
    },
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },

  envPrefix: ['VITE_', 'TAURI_ENV_*'],

  // screenjson-ui is consumed from source (Svelte 5 runes, .svelte.ts). Letting Vite
  // prebundle it runs esbuild over those files, which breaks parsing and skips our
  // $app/* aliases — see vite-plugin-svelte "optimizeDeps.exclude" for libraries.
  optimizeDeps: {
    exclude: ['screenjson-ui']
  }
});
