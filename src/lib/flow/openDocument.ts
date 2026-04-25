import {
  validateDocument,
  isScreenJSONDocument,
  hasEncryptedContent,
  decryptDocument,
  type ScreenJSONDocument
} from 'screenjson-ui';

export type OpenResult =
  | { kind: 'ready'; document: ScreenJSONDocument }
  | { kind: 'needsPassword'; rawDocument: ScreenJSONDocument }
  | { kind: 'error'; title: string; body: string; detail?: string };

/**
 * First pass: raw text → parsed JSON → validated ScreenJSON.
 * Does NOT decrypt; call unlockDocument() after the user enters a password.
 */
export function parseAndValidate(raw: string): OpenResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      kind: 'error',
      title: "This file isn't readable",
      body:
        "It doesn't look like a valid JSON file — the contents may be damaged, encoded differently, or this isn't a ScreenJSON file at all. Ask the person who sent it to re-export and share again.",
      detail: err instanceof Error ? err.message : String(err)
    };
  }

  // Full AJV validation. If it throws (e.g. unknown meta-schema ref), fall back
  // to the library's lightweight structural check so we can still read documents
  // that the strict validator rejects for environmental reasons.
  let valid = false;
  let validationErrors: { path: string; message: string }[] = [];
  try {
    const result = validateDocument(parsed);
    valid = result.valid;
    validationErrors = result.errors ?? [];
  } catch {
    valid = isScreenJSONDocument(parsed);
  }

  if (!valid) {
    const looksLikeScreenJSON = isScreenJSONDocument(parsed);

    const body = looksLikeScreenJSON
      ? "This looks almost like a ScreenJSON screenplay but some required fields are missing or have the wrong shape. The file may have been edited by hand, corrupted, or exported from a tool that doesn't fully support the ScreenJSON format."
      : "The file opens as JSON, but it isn't a ScreenJSON screenplay. It may be a settings file or some other kind of data. Ask the sender to export the script as ScreenJSON.";

    return {
      kind: 'error',
      title: "This isn't a ScreenJSON screenplay",
      body,
      detail: validationErrors.slice(0, 4).map((e) => `${e.path || '/'} — ${e.message}`).join('\n')
    };
  }

  const doc = parsed as ScreenJSONDocument;

  if (hasEncryptedContent(doc)) {
    return { kind: 'needsPassword', rawDocument: doc };
  }

  return { kind: 'ready', document: doc };
}

/**
 * Decrypts an encrypted document with the supplied password.
 * Returns a ready document or a friendly error if the password was wrong.
 */
export function unlockDocument(doc: ScreenJSONDocument, password: string): OpenResult {
  if (!password) {
    return {
      kind: 'error',
      title: 'Password required',
      body: 'This script is encrypted. Enter the password provided by the sender to read it.'
    };
  }

  try {
    const result = decryptDocument(doc, password);
    if (result.errors && result.errors.length > 0) {
      const wrongPassword = result.errors.some((e) =>
        /password|decrypt/i.test(e)
      );
      return {
        kind: 'error',
        title: wrongPassword ? 'Wrong password' : "Couldn't unlock this script",
        body: wrongPassword
          ? "That password didn't match. Check with the person who sent you this script and try again."
          : "Something went wrong while decrypting. The file may be damaged or was encrypted with a newer version.",
        detail: result.errors.slice(0, 3).join('\n')
      };
    }
    return { kind: 'ready', document: result.document };
  } catch (err) {
    return {
      kind: 'error',
      title: "Couldn't unlock this script",
      body: 'An unexpected error happened while decrypting. The file may be damaged.',
      detail: err instanceof Error ? err.message : String(err)
    };
  }
}
