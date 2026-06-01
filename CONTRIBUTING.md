# Contributing To Ghost Factory

Ghost Factory is maintained as a creator-facing tool and a reusable reference for layered trait builders.

## Useful Contributions

- Bug reports with the selected traits, browser, and expected output.
- Documentation improvements for adapting Ghost Factory to another trait pack.
- Validation checks that catch broken asset paths or layer-order mistakes.
- UI improvements that make the composer easier for non-technical creators.
- Export workflow improvements for PNG, GIF, metadata, or template config handoff.

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Before Opening A Pull Request

Run:

```bash
npm run check
```

This verifies the trait manifest, lints the codebase, and builds the app.

## Trait Manifest Rules

- Keep paths in `src/data/traits.js` relative to `public/`.
- Keep layer keys stable unless the UI and export behavior are updated with them.
- Prefer readable trait keys because exported config and metadata use those keys.
- Run `npm run validate:traits` after adding, renaming, or removing trait assets.

## Maintainer Notes

This project should stay approachable for creators who are not GitHub-native. Keep setup instructions short, error messages concrete, and feature changes tied to real creator workflows.
