# App icons

Tauri expects the following files in this folder. Generate them with:

```bash
pnpm tauri icon path/to/source.png
```

Required files:

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

iOS and Android icon sets are generated into `src-tauri/gen/apple/` and
`src-tauri/gen/android/` when you run `tauri ios init` / `tauri android init`;
they can be regenerated from the same source PNG with `pnpm tauri icon`.
