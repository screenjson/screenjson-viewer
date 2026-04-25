import type { ScreenJSONDocument } from 'screenjson-ui';

export type Theme = 'light' | 'dark';

export type Screen =
  | { kind: 'home' }
  | { kind: 'loading'; source: string }
  | {
      kind: 'password';
      source: string;
      rawDocument: ScreenJSONDocument;
      attempt: number;
      lastError?: string;
    }
  | { kind: 'reader'; source: string; document: ScreenJSONDocument; totalPages: number }
  | { kind: 'error'; title: string; body: string; detail?: string };

function detectInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem('sjv.theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'light';
}

function detectInitialZoom(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const stored = Number(localStorage.getItem('sjv.zoom'));
    if (Number.isFinite(stored) && stored > 0.3 && stored < 2) return stored;
  } catch {}
  return 1;
}

class AppState {
  screen = $state<Screen>({ kind: 'home' });
  theme = $state<Theme>(detectInitialTheme());
  zoom = $state<number>(detectInitialZoom());
  chromeVisible = $state<boolean>(true);
  currentPage = $state<number>(1);

  setTheme(v: Theme) {
    this.theme = v;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('theme-dark', v === 'dark');
    }
    try {
      localStorage.setItem('sjv.theme', v);
    } catch {}
  }

  setZoom(v: number) {
    this.zoom = Math.max(0.4, Math.min(1.8, v));
    try {
      localStorage.setItem('sjv.zoom', String(this.zoom));
    } catch {}
  }

  toHome() {
    this.screen = { kind: 'home' };
    this.currentPage = 1;
    this.chromeVisible = true;
  }
}

export const app = new AppState();

// Apply the initial theme class on load.
if (typeof document !== 'undefined') {
  document.body.classList.toggle('theme-dark', app.theme === 'dark');
}
