# Just Print Selection — v1.0.6

A minimal Chrome Manifest V3 extension to print a selected part of a webpage or save that selection as PDF.

## Install locally
1. Unzip the package.
2. Open `chrome://extensions`, enable Developer mode, click **Load unpacked**.
3. Select the folder containing `manifest.json`.

## Use
Highlight text (including images), right-click **Print selection** (localized to Chrome UI language), then print or select **Save as PDF** in Chrome. Right-click a standalone image to print it alone.

## Limits
- Some pages block script injection (including browser internal pages).
- Embedded frames, canvas, SVG and complex CSS may not reproduce exactly.
- Images may load from the source website.
- A large image may still move to a new printed page if insufficient space remains.

## Publishing
See `STORE_LISTING.md` and `PRIVACY.md`. Verify the release in Chrome before publishing. The ZIP in the parent directory has `manifest.json` at its root.
