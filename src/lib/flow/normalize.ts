/**
 * Document normalization — repairs common data-quality issues in ScreenJSON
 * files produced by automated conversion tools (especially PDF-to-ScreenJSON
 * which tends to preserve visual line breaks as separate dialogue elements).
 *
 * Applied AFTER validation and decryption, BEFORE the document reaches the
 * paginator/viewer. Non-destructive — returns a new document, original is
 * untouched.
 */

import type { ScreenJSONDocument } from 'screenjson-ui';

type BodyElement = {
  type?: string;
  text?: Record<string, string> | string;
  [k: string]: unknown;
};

/**
 * Join two dialogue fragments with contextual spacing:
 *   - "seven-" + "letter"         -> "seven-letter"   (mid-word hyphenation)
 *   - "come on a" + "honeymoon"   -> "come on a honeymoon"
 *   - ""        + "foo"           -> "foo"
 */
function joinFragments(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  const trimmedA = a.replace(/\s+$/, '');
  const trimmedB = b.replace(/^\s+/, '');
  // Mid-word hyphenation: a lowercase letter followed by a single hyphen
  // joined with a lowercase-leading next fragment. Don't collapse em/en
  // dashes ("--", "—") which are real punctuation.
  if (/[a-z]-$/.test(trimmedA) && /^[a-z]/.test(trimmedB)) {
    return trimmedA.slice(0, -1) + trimmedB;
  }
  return trimmedA + ' ' + trimmedB;
}

function isDialogue(el: BodyElement): boolean {
  return el?.type === 'dialogue';
}

function mergeDialogueRun(run: BodyElement[]): BodyElement {
  if (run.length === 1) return run[0];
  const first = run[0];
  const firstText = typeof first.text === 'object' ? first.text : null;
  if (!firstText) return first;

  // Collect all language keys present across the run so we don't lose
  // translations if some fragments have them and others don't.
  const langs = new Set<string>();
  for (const el of run) {
    const t = typeof el.text === 'object' ? el.text : null;
    if (t) for (const k of Object.keys(t)) langs.add(k);
  }

  const mergedText: Record<string, string> = {};
  for (const lang of langs) {
    let acc = '';
    for (const el of run) {
      const t = typeof el.text === 'object' ? el.text : null;
      const fragment = (t?.[lang] ?? t?.en ?? '') as string;
      acc = joinFragments(acc, fragment);
    }
    mergedText[lang] = acc;
  }

  return { ...first, text: mergedText };
}

/**
 * Walk a scene body and coalesce runs of consecutive dialogue elements.
 * Anything non-dialogue (character, parenthetical, action, shot, transition,
 * slugline) breaks a run, which matches the intuition that a parenthetical
 * interrupts speech and any character change ends a cue.
 */
function normalizeSceneBody(body: BodyElement[]): BodyElement[] {
  const out: BodyElement[] = [];
  let i = 0;
  while (i < body.length) {
    if (!isDialogue(body[i])) {
      out.push(body[i]);
      i++;
      continue;
    }
    let j = i + 1;
    while (j < body.length && isDialogue(body[j])) j++;
    if (j === i + 1) {
      out.push(body[i]);
    } else {
      out.push(mergeDialogueRun(body.slice(i, j)));
    }
    i = j;
  }
  return out;
}

/**
 * Returns a new document with broken dialogue runs merged. Safe to call on
 * well-formed documents — they come out unchanged because there are no
 * consecutive dialogue elements to merge.
 */
export function normalizeDocument(doc: ScreenJSONDocument): ScreenJSONDocument {
  // Narrow cast — ScreenJSONDocument's shape is deep; we only touch
  // document.scenes[].body, whose runtime shape we've verified above.
  const anyDoc = doc as unknown as {
    document?: { scenes?: Array<{ body?: BodyElement[] }> };
  };
  const scenes = anyDoc.document?.scenes;
  if (!Array.isArray(scenes)) return doc;

  const nextScenes = scenes.map((scene) => {
    if (!Array.isArray(scene.body)) return scene;
    return { ...scene, body: normalizeSceneBody(scene.body) };
  });

  return {
    ...(doc as object),
    document: { ...(anyDoc.document as object), scenes: nextScenes }
  } as unknown as ScreenJSONDocument;
}
