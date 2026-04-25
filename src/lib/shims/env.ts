// Minimal shim for SvelteKit's `$app/environment` so we can import screenjson-ui
// directly from source without dragging in SvelteKit.
export const browser = typeof window !== 'undefined';
export const dev = import.meta.env.DEV;
export const building = false;
export const version = '0.0.0';
