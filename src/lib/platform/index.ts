import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { readTextFile } from '@tauri-apps/plugin-fs';
import { onOpenUrl, getCurrent } from '@tauri-apps/plugin-deep-link';
import { type as osType } from '@tauri-apps/plugin-os';

export interface LoadedFile {
  source: string; // human-readable file name
  contents: string;
  /** Absolute path when available (desktop Tauri). Null on mobile/web. */
  path?: string | null;
}

/** True when the bundled Tauri runtime is present (desktop or mobile). */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Platform label — used to pick between touch and pointer affordances. */
export function platformKind(): 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'web' {
  if (!isTauri()) return 'web';
  try {
    const t = osType();
    if (t === 'ios') return 'ios';
    if (t === 'android') return 'android';
    if (t === 'macos') return 'macos';
    if (t === 'windows') return 'windows';
    return 'linux';
  } catch {
    return 'web';
  }
}

export function isMobile(): boolean {
  const k = platformKind();
  return k === 'ios' || k === 'android';
}

/**
 * Opens a file picker and reads the chosen file as UTF-8 text.
 * Returns null if the user cancelled.
 */
export async function pickAndReadFile(): Promise<LoadedFile | null> {
  if (!isTauri()) {
    // Web fallback: use native input.
    return await webPickFile();
  }

  const selected = await openDialog({
    multiple: false,
    directory: false,
    filters: [
      { name: 'ScreenJSON JSON', extensions: ['json'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });

  if (!selected || typeof selected !== 'string') return null;
  const contents = await readTextFile(selected);
  const name = selected.split(/[\\/]/).pop() || selected;
  return { source: name, contents, path: selected };
}

/**
 * Reads a file already known to the runtime (e.g. delivered via file association).
 */
export async function readKnownFile(path: string): Promise<LoadedFile> {
  const contents = await readTextFile(path);
  const name = path.split(/[\\/]/).pop() || path;
  return { source: name, contents, path };
}

/**
 * Subscribes to local file opens from the OS (file association/share sheet).
 * On first call, also checks whether the app was launched with an initial file URL.
 * Returns an unsubscribe function.
 */
export async function subscribeIncomingOpens(
  handler: (target: string) => void
): Promise<() => void> {
  if (!isTauri()) return () => {};

  // Launch URL (cold start).
  try {
    const initial = await getCurrent();
    if (initial && initial.length > 0) {
      for (const url of initial) {
        if (isLocalOpenTarget(url)) handler(url);
      }
    }
  } catch {}

  const unlisten = await onOpenUrl((urls) => {
    for (const url of urls) {
      if (isLocalOpenTarget(url)) handler(url);
    }
  });

  return unlisten;
}

/** Triggers the platform print dialog for the current document view. */
export function print(): void {
  window.print();
}

// ---------------------------------------------------------------------------

async function webPickFile(): Promise<LoadedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const contents = await file.text();
      resolve({ source: file.name, contents });
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

function isLocalOpenTarget(target: string): boolean {
  return target.startsWith('file://') || !/^[a-z][a-z0-9+.-]*:\/\//i.test(target);
}
