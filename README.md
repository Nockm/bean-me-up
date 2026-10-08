# Bean me up

A plain HTML, CSS, and JavaScript coffee menu for GitHub Pages. No compilation, package installation, framework, or running application server needed.

Swipe through coffee cards, use the arrows, or use the left/right keyboard keys. Tap a card's image to see it larger and browse that coffee's other photos using swipe, arrows, or thumbnails. Escape or the close button returns you to the cards.

## Manage the menu

Each immediate folder in `coffees/` is an available coffee. Its folder name is the exact title. Images inside are sorted alphabetically; the first is the card's main image. Use padded prefixes such as `01`, `02`, `03` to make the order clear.

```text
coffees/
  Ethiopia Guji/
    01-main.jpg
    02-bag.jpg
    03-beans.jpg
  House Blend/
    01-main.png
archive/
  Previously Available Coffee/
    01-main.jpg
```

Supported images: SVG, PNG, JPG, JPEG, WebP, GIF, AVIF. Square or portrait main images work best. Images fit without cropping. Empty coffee folders, non-image files, loose files in `coffees/`, hidden folders, and nested subfolders are ignored. Only direct image files inside each available coffee folder are listed.

To remove a coffee, move its entire folder from `coffees/` to `archive/`. To bring it back, move it back. Nothing inside `archive/` is scanned. Archived files are not private when published from the repository root.

After any folder or image change:

1. Double-click **generate-manifest.bat** on Windows. It uses built-in Windows PowerShell and writes `coffees.json`, including all image paths. It works from any working directory and handles spaces and Unicode names. It pauses so you can read the result.
2. Commit and push the changed folders **and coffees.json** to GitHub.

The batch file uses `scripts/generate-manifest.ps1`; keep both in the repository. On machines with Node.js 20+, `npm run manifest` is an alternative with no dependencies. If a managed Windows machine forbids PowerShell scripts, use the Node.js alternative or ask its administrator.

Three sample coffee folders are included; replace them with your own. One coffee and an empty menu are supported. The website reads the saved manifest, so changes do not appear until you regenerate and publish it.

## GitHub Pages

In the repository's **Settings → Pages**, choose **Deploy from a branch**, select **master**, and select **/ (root)**, then save. If your changes are on another branch, merge them to master first. GitHub publishes the checked-in files directly; no build command or custom Action is required. `.nojekyll` disables Jekyll processing.

All website URLs are relative, so the site works under the repository's `/bean-me-up/` path as well as a custom domain. GitHub Pages may take a few minutes to publish changes. The optional Google Fonts styles fall back to system fonts if unavailable.

## Local preview and development

Serve the repository root with any static HTTP server; opening the HTML as a local file does not support loading the JSON manifest reliably. For example:

```sh
python3 -m http.server 3000
```

Or, with Node.js 20+:

```sh
npm start
```

The optional Node server uses port 3000 (override with `PORT`) and serves the saved manifest exactly as Pages does. Regenerate the manifest after coffee changes, then refresh the page.

```sh
npm test
```

Tests cover folder titles, image order, URL encoding, ignored files, empty folders, and moving coffees into and out of the archive.
