# ScreenJSON Viewer

A simple, cross-platform reader for [ScreenJSON](https://screenjson.com) screenplay files. Think "Acrobat Reader, but for screenplays."

Built as a single Tauri 2 app targeting **iOS, Android, Windows, macOS, and Linux** — one codebase, one webview, five platforms. Reuses the [`screenjson-ui`](https://github.com/screenjson/screenjson-ui) library for all rendering, pagination, validation, and decryption.

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

**This repo does not vendor or submodule `screenjson-ui`.** The dependency in [package.json](package.json) points to the public GitHub source tarball for the `screenjson-ui` default branch (`develop`). [.npmrc](.npmrc) disables lockfile generation and sets `install-strategy=nested` so npm can resolve that tarball without hitting arborist dedupe bugs; the `postinstall` script refreshes `node_modules/screenjson-ui`, so installs pull the latest upstream UI source instead of freezing one internal checkout or one commit.

**The viewer consumes the library from source**, not from the built bundle. This is enforced by a Vite alias in [vite.config.ts](vite.config.ts) pointing `screenjson-ui` at `node_modules/screenjson-ui/src/lib/index.ts`. Two reasons:

1. **Single Svelte runtime.** The pre-built `dist/screenjson-ui.js` bundles its own Svelte copy. Mounting a bundled Svelte component inside another Svelte app throws `effect_orphan` the moment the inner component touches a rune. Importing source avoids this.
2. **Transparent upstream boundary.** The viewer can compile the UI source directly while keeping the library's source and history in the public `screenjson-ui` repo.

**Design tokens and `@utility` rules from the library are inlined** into [src/app.css](src/app.css) rather than imported. Tailwind v4 doesn't currently process `@utility` declarations through nested `@import`s, and it only emits utilities it sees *used* — so the viewer's app.css includes `@source "../node_modules/screenjson-ui/src/**/*.{svelte,ts,js}"` to scan the library's components for class references.

### Viewer-only additions (not in the library)

| Addition | Location | Why it lives here |
| --- | --- | --- |
| Dialogue normalizer | [src/lib/flow/normalize.ts](src/lib/flow/normalize.ts) | Repairs a common data-quality issue — consecutive `dialogue` elements from one speaker-turn get merged. Fixes PDF-converted scripts where each visual line was stored as its own element. |
| ~~Title page~~ | Now in the library — see "Library edits" below | — |
| Responsive reflow CSS | [src/app.css](src/app.css) | Mobile (≤640px) drops the paper metaphor in favor of edge-to-edge reflow with proportional indents. Library handles tablet/desktop; the viewer adds the phone case. |
| Cross-platform shell | [src-tauri/](src-tauri/) + [src/lib/platform/](src/lib/platform/) | File associations, deep-links, picker abstraction for iOS/Android/Win/Mac/Linux. |

### Updating or editing the library

If a bug or limitation belongs in `screenjson-ui`, make that change in a separate clone of [`github.com/screenjson/screenjson-ui`](https://github.com/screenjson/screenjson-ui), commit it there, and push it to the branch this wrapper consumes. Installing this wrapper will then fetch that source:

```bash
npm install
```

In an existing checkout with `node_modules` already present, you can refresh only the UI dependency after upstream changes land:

```bash
npm run ui:update
```

For temporary local iteration, `npm link` still works with a separate local checkout. Keep that checkout outside this repository so the wrapper remains only a container:

```bash
# inside a separate screenjson-ui checkout
npm install
npm link

# inside screenjson-viewer (after npm link was run in the library repo)
npm link screenjson-ui
```

`npm link screenjson-ui` **without** running `npm link` first in a local `screenjson-ui` clone will try the public npm registry and fail with `404` — that package is not published to npm; the default install path is the GitHub tarball in [package.json](package.json).

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

Do **system + Rust setup first**; `npm install` alone is not enough to run the desktop app.

1. **Tauri system dependencies** — Follow the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS *before* `npm run tauri:dev` or `npm run tauri:build`. That page covers the native libraries and toolchains Tauri expects (for example WebKitGTK and build essentials on Linux, Xcode Command Line Tools on macOS, WebView2 and MSVC build tools on Windows).
2. **Rust 1.77+** via [rustup](https://rustup.rs) so `cargo` and `rustc` are on your `PATH`. The first Tauri command will download Rust crate dependencies into `src-tauri/target/`; no separate manual `cargo fetch` is required if the toolchain is installed correctly.
3. **Node.js 20+** and **npm 10+**. Use a single toolchain for both commands (for example the `node` and `npm` from the same [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) install). Some environments put another `node` earlier on `PATH` than the one that owns `npm`, which can produce confusing install errors.
4. For **iOS**: Xcode 15+, an Apple Developer account, CocoaPods (`brew install cocoapods`).
5. For **Android**: Android Studio, Android SDK, NDK, JDK 17, and `ANDROID_HOME` / `NDK_HOME` set.

`npm install` adds the JavaScript side (including `@tauri-apps/cli`); it does **not** replace the OS-specific libraries from step 1 or the Rust toolchain from step 2.

## Install

From this app’s directory (named `screenjson-viewer` whether you cloned [the viewer repo](https://github.com/screenjson/screenjson-viewer) by itself or it lives inside a larger checkout):

```bash
cd screenjson-viewer   # skip if your shell is already here
npm install
```

Requirements:

- **Network:** `npm install` must reach `github.com` to download the `screenjson-ui` source tarball declared in [package.json](package.json).
- **Layout:** [.npmrc](.npmrc) sets `install-strategy=nested` so npm does not hit a known arborist bug when deduplicating dependencies installed from that tarball (`Cannot read properties of null (reading 'matches')` and similar).

No `screenjson-ui` source folder or `package-lock.json` should be committed to this repository (`package-lock=false` is intentional).

If install still fails after a partial or interrupted run, clear the tree and retry:

```bash
rm -rf node_modules
npm install
```

## Develop

### Desktop (macOS, Windows, Linux)

Requires the [Tauri prerequisites](#prerequisites) (system libraries + Rust) to be in place first. Then:

```bash
npm run tauri:dev
```

The Vite dev server starts on `http://localhost:1420` and the Tauri window opens against it. Hot-reload works for both the frontend and (with a rebuild) the Rust shell. [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) runs `npm run dev` as the frontend `beforeDevCommand` (same package manager as this repo).

### iOS

One-time setup:

```bash
npm run tauri:ios:init
```

This generates `src-tauri/gen/apple/`. After generation, edit the Info.plist inside that folder to make sure `CFBundleDocumentTypes` matches the file associations declared in `tauri.conf.json` (Tauri writes most of these automatically, but UTI imports/exports sometimes need a pass). Then:

```bash
npm run tauri:ios:dev              # runs on an attached device or simulator
npm run tauri:ios:build            # archive for App Store / TestFlight
```

### Android

```bash
npm run tauri:android:init
npm run tauri:android:dev
npm run tauri:android:build
```

After `init`, confirm `src-tauri/gen/android/app/src/main/AndroidManifest.xml` has an `<intent-filter>` for `android.intent.action.VIEW` on `application/vnd.screenjson+json` and `application/json` — Tauri generates it from `fileAssociations`, but double-check.

## Build for release

```bash
# Desktop — bundles .app/.dmg (mac), .msi/.exe (win), .deb/.AppImage (linux)
npm run tauri:build

# Mobile
npm run tauri:ios:build
npm run tauri:android:build
```

Artifacts land in `src-tauri/target/release/bundle/` for desktop and in the native project folders under `src-tauri/gen/` for mobile.

## App icons

Replace the PNG sources referenced in `src-tauri/tauri.conf.json` and regenerate with:

```bash
npm run tauri -- icon path/to/your-1024x1024.png
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
