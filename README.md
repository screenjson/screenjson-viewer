# ScreenJSON Viewer

A simple, cross-platform reader for [ScreenJSON](https://screenjson.com) screenplay files. Think "Acrobat Reader, but for screenplays."

Built as a single Tauri 2 app targeting **iOS, Android, Windows, macOS, and Linux** — one codebase, one webview, five platforms. Reuses the [`screenjson-ui`](https://github.com/screenjson/screenjson-ui) library as an npm dependency for all rendering, pagination, validation, and decryption.

Released as a reference implementation under the MIT license.

## What it does

- Opens `.screenjson` and `.json` files either by picker, drag-and-drop, from a URL, or by tapping/double-clicking a file the OS routes to the app.
- Rejects files that aren't ScreenJSON with a friendly, non-technical message (distinguishing *not valid JSON* from *valid JSON but not a screenplay*).
- Prompts for a password on encrypted scripts and decrypts in-memory.
- Traditional screenplay title page (title, author, logline, based-on credits) rendered as a proper cover before the script.
- Reader view dedicates maximum screen space to the script itself: tap to toggle a minimal top bar and an e-book style bottom page slider. Pinch-to-zoom and double-tap-to-zoom on touch devices.
- Remembers recent files.
- Responsive by design: mobile reflows to viewport-width with proportional indents and readable body font; desktop uses the traditional centered-on-workspace paper metaphor.
- Dark/light mode, zoom, responsive layout, and system print dialog.
- No editing, no export, no upload. Read-only by design.

## Relationship to `screenjson-ui`

The viewer is a **thin shell** around the [`screenjson-ui`](https://github.com/screenjson/screenjson-ui) rendering library, which does all the heavy lifting: pagination, element styling, validation, and AES decryption.

**The viewer consumes the library from source**, not from the built bundle. This is enforced by a Vite alias in [vite.config.ts](vite.config.ts) pointing `screenjson-ui` at `../screenjson-ui-REFERENCE-ONLY/src/lib/index.ts`. Two reasons:

1. **Single Svelte runtime.** The pre-built `dist/screenjson-ui.js` bundles its own Svelte copy. Mounting a bundled Svelte component inside another Svelte app throws `effect_orphan` the moment the inner component touches a rune. Importing source avoids this.
2. **Instant iteration.** Changes to the library are picked up by Vite HMR with no `build:lib` step. If you edit a component in `screenjson-ui-REFERENCE-ONLY/src/lib/`, the viewer updates immediately.

**Design tokens and `@utility` rules from the library are inlined** into [src/app.css](src/app.css) rather than imported. Tailwind v4 doesn't currently process `@utility` declarations through nested `@import`s, and it only emits utilities it sees *used* — so the viewer's app.css includes `@source "../../screenjson-ui-REFERENCE-ONLY/src/**/*.{svelte,ts,js}"` to scan the library's components for class references.

### Viewer-only additions (not in the library)

| Addition | Location | Why it lives here |
| --- | --- | --- |
| Dialogue normalizer | [src/lib/flow/normalize.ts](src/lib/flow/normalize.ts) | Repairs a common data-quality issue — consecutive `dialogue` elements from one speaker-turn get merged. Fixes PDF-converted scripts where each visual line was stored as its own element. |
| ~~Title page~~ | Now in the library — see "Library edits" below | — |
| Responsive reflow CSS | [src/app.css](src/app.css) | Mobile (≤640px) drops the paper metaphor in favor of edge-to-edge reflow with proportional indents. Library handles tablet/desktop; the viewer adds the phone case. |
| Cross-platform shell | [src-tauri/](src-tauri/) + [src/lib/platform/](src/lib/platform/) | File associations, deep-links, picker abstraction for iOS/Android/Win/Mac/Linux. |

### Editing the library

If a bug or limitation in the library needs a fix in `screenjson-ui` source: just edit the files in `../screenjson-ui-REFERENCE-ONLY/src/lib/`. The viewer picks up the changes via HMR immediately — no `npm link`, no rebuild. Once the change looks good in the viewer, commit and release the library normally (`build:lib` + publish).

### Library edits made by this project

Changes originating in the viewer work that have been committed into the `screenjson-ui` library. Every entry here represents a library edit — worth reviewing when bumping the library version.

| Change | Library files | Reason |
| --- | --- | --- |
| Added `TitlePage` component | `src/lib/components/TitlePage.svelte` (new), `src/lib/index.ts` (new export) | Traditional screenplay cover page (title, authors, logline, sources, contributors, genres). Available to any embedder, not just this viewer. Respects the library's `--font-screenplay` / `--color-paper` tokens and includes a desktop "shadowed card" layout at `min-width: 1024px`. |
| Removed inter-tag whitespace in `Slugline.svelte` | `src/lib/components/elements/Slugline.svelte` | `.sp-element` sets `white-space: pre-wrap`, which was preserving the newlines/indentation between Svelte's `{#if}` blocks and the `<span>{text}</span>`. This injected a leading space before the slug text, offsetting the first wrapped line by ~9px on narrow viewports. Template now has no source-level whitespace between siblings; behavior is identical to before for single-line slugs, fixed for wrapped slugs. |

## The dialogue normalizer — a caveat

The normalizer ([normalize.ts](src/lib/flow/normalize.ts)) merges runs of consecutive `dialogue` elements that share the same character turn. Without it, PDF-converted scripts render every wrapped line as a separate paragraph, which looks like dumped text on a phone.

- **Safe for well-formed documents.** One dialogue element per speech-beat? Nothing to merge, document passes through unchanged.
- **Safe for parentheticals.** A parenthetical between two dialogue elements ends one run and starts another — preserves the intended pause.
- **Joins mid-word hyphenation** (`"seven-"` + `"letter"` → `"seven-letter"`) and otherwise space-joins.
- **One known tradeoff:** a screenwriter who *intentionally* splits a cue into two dialogue elements for dramatic effect would see those merged. If your files rely on intentional multi-element dialogue, disable the normalizer by removing the `normalizeDocument()` call in [openAndRoute.ts](src/lib/flow/openAndRoute.ts).

## Project layout

```
screenjson-viewer/
├── src/                    # Vite + Svelte 5 webview UI
│   ├── App.svelte          # top-level state router
│   ├── main.ts
│   └── lib/
│       ├── state.svelte.ts # app state (Svelte 5 runes)
│       ├── platform/       # Tauri file/dialog/deep-link abstraction
│       ├── flow/           # validate → decrypt → route
│       └── components/     # Home, Reader, PageSlider, TopBar, …
├── src-tauri/              # Rust shell (one project, five targets)
│   ├── src/lib.rs          # Tauri entry; plugin wiring
│   ├── tauri.conf.json     # bundle + file associations + deep links
│   ├── capabilities/       # plugin permissions
│   └── icons/
├── index.html
├── vite.config.ts
└── package.json
```

## Prerequisites

- **Node.js 20+** and **pnpm 9+** (or `npm` / `yarn`; replace `pnpm` in commands accordingly).
- **Rust 1.77+** via [rustup](https://rustup.rs).
- For **iOS**: Xcode 15+, an Apple Developer account, CocoaPods (`brew install cocoapods`).
- For **Android**: Android Studio, Android SDK, NDK, JDK 17, and `ANDROID_HOME` / `NDK_HOME` set.
- Platform toolchain basics are listed in the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

## Install

```bash
cd screenjson-viewer
pnpm install
```

The `screenjson-ui` library is pulled from npm. During local development of both projects, use `pnpm link` to point at your local checkout:

```bash
# inside screenjson-ui-REFERENCE-ONLY/
pnpm build:lib
pnpm link --global

# inside screenjson-viewer/
pnpm link --global screenjson-ui
```

## Develop

### Desktop (macOS, Windows, Linux)

```bash
pnpm tauri:dev
```

The Vite dev server starts on `http://localhost:1420` and the Tauri window opens against it. Hot-reload works for both the frontend and (with a rebuild) the Rust shell.

### iOS

One-time setup:

```bash
pnpm tauri:ios:init
```

This generates `src-tauri/gen/apple/`. After generation, edit the Info.plist inside that folder to make sure `CFBundleDocumentTypes` matches the file associations declared in `tauri.conf.json` (Tauri writes most of these automatically, but UTI imports/exports sometimes need a pass). Then:

```bash
pnpm tauri:ios:dev              # runs on an attached device or simulator
pnpm tauri:ios:build            # archive for App Store / TestFlight
```

### Android

```bash
pnpm tauri:android:init
pnpm tauri:android:dev
pnpm tauri:android:build
```

After `init`, confirm `src-tauri/gen/android/app/src/main/AndroidManifest.xml` has an `<intent-filter>` for `android.intent.action.VIEW` on `application/vnd.screenjson+json` and `application/json` — Tauri generates it from `fileAssociations`, but double-check.

## Build for release

```bash
# Desktop — bundles .app/.dmg (mac), .msi/.exe (win), .deb/.AppImage (linux)
pnpm tauri:build

# Mobile
pnpm tauri:ios:build
pnpm tauri:android:build
```

Artifacts land in `src-tauri/target/release/bundle/` for desktop and in the native project folders under `src-tauri/gen/` for mobile.

## App icons

Replace the PNG sources referenced in `src-tauri/tauri.conf.json` and regenerate with:

```bash
pnpm tauri icon path/to/your-1024x1024.png
```

This produces the full icon set for every platform in one go.

## File associations

| Platform | Configured in                                         |
| -------- | ----------------------------------------------------- |
| Desktop  | `src-tauri/tauri.conf.json` → `bundle.fileAssociations` |
| iOS      | Auto-generated into `gen/apple/Info.plist`             |
| Android  | Auto-generated into `gen/android/.../AndroidManifest.xml` |
| macOS UTI exports | `bundle.fileAssociations` (role: Viewer)       |

The file extension is `.screenjson` with MIME type `application/vnd.screenjson+json`. `.json` is registered as a secondary handler — the app gracefully rejects non-ScreenJSON JSON files with a clear message.

## Deep-link URL scheme

`screenjson://…` is registered on desktop, and `https://open.screenjson.com/script/…` (HTTP deep link) on mobile. See the `plugins.deep-link` section in `tauri.conf.json`.

## Non-goals

- **No editing.** Full stop.
- **No export.** Printing is available via the system print dialog.
- **No cloud sync, no accounts.** Local files and URLs only.

## License

MIT. See `LICENSE`.
