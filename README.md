# Smart Connection Graph

**Status:** Ready for review · **Platform:** Obsidian (desktop) · **Tech:** TypeScript + D3 · **Min Obsidian:** 1.5.0

## Summary
Smart Connection Graph turns Smart Connections suggestions into a right-sidebar force-directed graph. Nodes represent related notes; edges are weighted by similarity scores; clicking a node opens the note. The view auto-refreshes when you change the active note.

## Features
- Right sidebar graph view for Smart Connections suggestions
- Ribbon icon + Command Palette command to open the graph
- D3 force layout with score-weighted edges and score labels
- L2 truncation: strip `.md`; `<= 8` chars stay; `> 8` chars show first 8 + `...`
- Robust DOM scraping fallbacks for the Smart Connections panel
- Auto-refresh on active note change and via MutationObserver when the panel updates

## Installation (manual)
1. Build or download the plugin bundle.
2. Create a folder in your vault: `<vault>/.obsidian/plugins/smart-connection-graph/`.
3. Place `manifest.json`, `main.js` (built), and `styles.css` there (include source files if you want).
4. Restart Obsidian, then enable “Smart Connection Graph” in Community Plugins.

## Build (optional)
```bash
npm install
npm run build   # or run your esbuild/Rollup command to emit main.js into plugin root
```

## Usage
- Open the Smart Connections panel in Obsidian.
- Click the ribbon icon or use Command Palette: “Open Smart Connection Graph”.
- Nodes = suggestions; edges are weighted by scores; score labels appear above edges.
- Click a node to open the note.

## Notes for macOS
- Desktop-only plugin; ensure the Smart Connections panel is visible so DOM scraping can read suggestions.

## License
MIT
