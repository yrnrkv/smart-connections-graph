# Smart Connection Graph

**Status:** Ready for review | **Platform:** Obsidian (desktop only) | **Tech:** TypeScript + D3.js | **Min Obsidian:** 1.5.0

## Summary

Smart Connection Graph is an Obsidian plugin that visualizes Smart Connections suggestions as an interactive force-directed graph in a right sidebar view. It automatically displays connections for your currently active note, allowing you to click on nodes to instantly open related notes. The graph refreshes automatically whenever you switch to a different note, keeping your connection visualization always up-to-date.

## Features

- **Right sidebar graph view** – Displays connections in a dedicated sidebar pane without cluttering your main workspace
- **Ribbon icon + command palette trigger** – Easily open the graph via the sidebar ribbon icon or command palette
- **D3 force-directed layout** – Smooth, physics-based graph visualization with score-weighted edges and visible score labels
- **L2 title truncation** – Removes `.md` extension; keeps titles ≤8 characters as-is, truncates longer titles to first 8 characters + `...`
- **DOM scraping fallbacks** – Extracts connection data from the Smart Connections panel using multiple selector strategies for robustness
- **Auto-refresh on active note change** – Graph updates automatically when you switch files
- **MutationObserver** – Watches the Smart Connections panel for real-time updates

## Installation (Manual)

1. Download or clone this repository
2. Copy the plugin folder to your Obsidian vault's plugins directory:
   ```
   <your-vault>/.obsidian/plugins/smart-connection-graph/
   ```
3. Ensure the following files are in the plugin folder:
   - `main.js` (compiled from TypeScript)
   - `manifest.json`
   - `styles.css`
4. Restart Obsidian or reload the app
5. Go to **Settings → Community plugins** and enable "Smart Connection Graph"
6. The plugin requires the **Smart Connections** plugin to be installed and active
