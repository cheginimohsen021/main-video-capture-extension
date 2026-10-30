# Main Video Capture Extension

This project is a chrome extension based on the source-first capture design described in the earlier phases. It is built to:

- inspect the current tab for a likely main video source
- prefer source-first media capture when available
- support an explicit fallback capture only after user approval
- avoid capturing protected DRM streams
- package as a Chrome extension archive

## Project structure

- `manifest.json` — MV3 manifest
- `popup.html` / `popup.js` — popup UI and user actions
- `background.js` — service worker logic
- `content.js` — page inspection and playback capture logic
- `icon.svg` — extension icon
- `scripts/build.mjs` — copies files into `dist/`
- `scripts/package-release.mjs` — creates ZIP + CRX release artifacts

## Development

```bash
npm install
npm run build
```

## Package a release

```bash
npm run release
```

This creates:

- `release/main-video-capture-extension.zip`
- `release/main-video-capture-extension.crx`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click Load unpacked
4. Select the `dist` folder

## Notes

- The extension is intentionally source-first, local-only, and does not attempt DRM bypass.
- The tab capture fallback is permission-gated and requires explicit user approval.
- This code is a buildable baseline for a real Chrome extension and should be reviewed before production release.
