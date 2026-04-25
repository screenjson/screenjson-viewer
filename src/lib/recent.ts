/**
 * Recent-files list. Survives restarts via localStorage.
 *
 * On desktop (Tauri) we store the absolute path → we can reopen the file directly.
 * On mobile and web, we only have the file name (the OS doesn't give us a path),
 * so we record the name for display but mark the entry as "name-only" — clicking
 * it prompts the user to re-pick the file.
 */

export interface RecentEntry {
  /** Display label: file name or URL origin + path. */
  label: string;
  /** Absolute path (desktop Tauri), URL (https), or null for name-only mobile/web picks. */
  target: string | null;
  /** 'path' | 'url' | 'name' — determines how to reopen. */
  kind: 'path' | 'url' | 'name';
  /** Timestamp of last open, for sorting. */
  lastOpened: number;
}

const STORAGE_KEY = 'sjv.recents';
const MAX_ENTRIES = 12;

export function loadRecents(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is RecentEntry =>
          e && typeof e.label === 'string' && typeof e.lastOpened === 'number'
      )
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function recordRecent(entry: Omit<RecentEntry, 'lastOpened'>): void {
  try {
    const existing = loadRecents();
    const dedupKey = entry.target ?? entry.label;
    const filtered = existing.filter(
      (e) => (e.target ?? e.label) !== dedupKey
    );
    const next: RecentEntry[] = [
      { ...entry, lastOpened: Date.now() },
      ...filtered
    ].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function removeRecent(target: string | null, label: string): void {
  try {
    const existing = loadRecents();
    const dedupKey = target ?? label;
    const next = existing.filter((e) => (e.target ?? e.label) !== dedupKey);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function clearRecents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
