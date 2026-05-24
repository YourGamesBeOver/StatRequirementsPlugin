# Stat Requirements Plugin

An [OpenRCT2](https://openrct2.io/) plugin for inspecting rides in terms of their stat requirements.

OpenRCT2 (and the original RollerCoaster Tycoon 2) penalize the excitement, intensity, and nausea ratings of rides that fail to meet certain stat thresholds — for example, a minimum drop height, max speed, or number of inversions. These requirements are normally hidden from the player. This plugin surfaces them in-game so you can see which thresholds each of your rides currently meets and which it still needs to satisfy.

> ⚠️ This plugin requires OpenRCT2 plugin API version 114, which is currently not released yet! See PR [#26612](https://github.com/OpenRCT2/OpenRCT2/pull/26612).

## Features

- Adds a **Stat Requirements** entry to the OpenRCT2 map menu.
- Select any ride from a dropdown to view its applicable stat requirements.
- Each requirement is shown with:
  - A green check if the ride meets it.
  - A red X if it does not.
  - A gray question mark if the ride has not yet been tested.
- Displays both the required threshold and the ride's actual value (formatted with the appropriate units for length, height, speed, etc.).
- Notes when a requirement is relaxed because the ride has inversions.
- Auto-refreshes as ride stats change.

## Known Issues

Due to a limitation of how the game calculates the requirement around number of reversal elements, the plugin's calculation has to differ slightly from the game's. Namely, the game counts the number of reversal elements the train actually experiences, while the plugin counts how many are on the track at all.
tl;dr: The plugin will say you meet the "number of reversals" requirement if the ride _has_ any reversal elements rather than if the train actually goes over any. 


## Requirements

- [OpenRCT2](https://openrct2.io/) with a plugin API of at least version **114**.
- [Node.js](https://nodejs.org/) (for building from source).

## Installation

### From a release build

1. Build the plugin (see below) or grab a prebuilt `StatRequirementsPlugin.js`.
2. Copy `StatRequirementsPlugin.js` into your OpenRCT2 plugin folder:
   - **Windows:** `%USERPROFILE%\Documents\OpenRCT2\plugin`
   - **macOS:** `~/Library/Application Support/OpenRCT2/plugin`
   - **Linux:** `~/.config/OpenRCT2/plugin`
3. Launch OpenRCT2 and load a park. The plugin appears under the map menu as **Stat Requirements**.

## Building from source

```bash
npm install
npm run build
```

The bundled output is written to `dist/StatRequirementsPlugin.js`.

### Development scripts

- `npm run build` — one-off bundle to `dist/StatRequirementsPlugin.js`.
- `npm run watch` — rebuild on change to `dist/`.
- `npm run watchInstalled` — rebuild on change directly into the user's OpenRCT2 plugin folder (path is hard-coded in [package.json](package.json) and may need to be adjusted for your environment).

## Project Structure

```
src/
  plugin.ts                       Plugin entry point (registerPlugin)
  init.ts                         Registers the menu item
  ui/
    MainWindow.ts                 The plugin's window UI
  data/
    StatRequirements.ts           Requirement classes and ride lookup
    ride-stat-requirements.json   Per-ride-type threshold data
```

## License

MIT — see [package.json](package.json).

## Special Thanks
Thanks to [Marcel Vos](https://www.youtube.com/@MarcelVos) for the inspiration!
