import { collectDocumentLanguages, paginate } from 'screenjson-ui';
import type { ScreenJSONDocument } from 'screenjson-ui';
import { app } from '../state.svelte';
import { parseAndValidate, unlockDocument } from './openDocument';
import { normalizeDocument } from './normalize';
import { recordRecent } from '../recent';
import {
  pickAndReadFile,
  readKnownFile,
  type LoadedFile
} from '../platform';

function toReader(source: string, rawDocument: ScreenJSONDocument) {
  // Repair PDF-conversion artifacts (e.g. dialogue split across visual
  // lines stored as separate elements) before handing to the viewer.
  const document = normalizeDocument(rawDocument);
  const totalPages = safePageCount(document);
  app.screen = { kind: 'reader', source, document, totalPages };
  app.setLang(collectDocumentLanguages(document)[0] ?? document.lang ?? 'en');
  app.currentPage = 1;
  app.chromeVisible = true;
}

function safePageCount(doc: ScreenJSONDocument): number {
  try {
    const result = paginate(doc);
    return Math.max(1, result.totalPages || 1);
  } catch {
    return 1;
  }
}

function recordIfLoadable(loaded: LoadedFile) {
  if (loaded.path) {
    recordRecent({ label: loaded.source, target: loaded.path, kind: 'path' });
  } else {
    recordRecent({ label: loaded.source, target: null, kind: 'name' });
  }
}

function handleLoaded(loaded: LoadedFile) {
  const result = parseAndValidate(loaded.contents);
  if (result.kind === 'ready') {
    recordIfLoadable(loaded);
    toReader(loaded.source, result.document);
  } else if (result.kind === 'needsPassword') {
    recordIfLoadable(loaded);
    app.screen = {
      kind: 'password',
      source: loaded.source,
      rawDocument: result.rawDocument,
      attempt: 0
    };
  } else {
    app.screen = {
      kind: 'error',
      title: result.title,
      body: result.body,
      detail: result.detail
    };
  }
}

/** Open a pre-loaded text blob (from drag-and-drop or OS file-open event). */
export function openFromContents(label: string, contents: string, path?: string | null) {
  app.screen = { kind: 'loading', source: label };
  handleLoaded({ source: label, contents, path: path ?? null });
}

export async function openFromPicker() {
  try {
    const loaded = await pickAndReadFile();
    if (!loaded) return; // user cancelled
    app.screen = { kind: 'loading', source: loaded.source };
    handleLoaded(loaded);
  } catch (err) {
    app.screen = {
      kind: 'error',
      title: "Couldn't open that file",
      body: 'Check the file still exists and you have permission to read it.',
      detail: err instanceof Error ? err.message : String(err)
    };
  }
}

export async function openFromPath(path: string) {
  if (/^https?:\/\//i.test(path)) {
    app.screen = {
      kind: 'error',
      title: 'Remote files are blocked',
      body: 'ScreenJSON Viewer only opens local JSON files.'
    };
    return;
  }

  try {
    app.screen = { kind: 'loading', source: path };
    const loaded = await readKnownFile(path);
    handleLoaded(loaded);
  } catch (err) {
    app.screen = {
      kind: 'error',
      title: "Couldn't open that file",
      body: 'The file may have been moved, renamed, or deleted.',
      detail: err instanceof Error ? err.message : String(err)
    };
  }
}

export function submitPassword(password: string) {
  if (app.screen.kind !== 'password') return;
  const { source, rawDocument, attempt } = app.screen;
  const result = unlockDocument(rawDocument, password);
  if (result.kind === 'ready') {
    toReader(source, result.document);
  } else if (result.kind === 'error') {
    app.screen = {
      kind: 'password',
      source,
      rawDocument,
      attempt: attempt + 1,
      lastError: result.body
    };
  }
}
