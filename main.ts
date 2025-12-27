import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ConnectionGraphView, VIEW_TYPE_GRAPH } from './graphView';

export default class SmartConnectionGraphPlugin extends Plugin {
  async onload() {
    // Register the graph view
    this.registerView(
      VIEW_TYPE_GRAPH,
      (leaf) => new ConnectionGraphView(leaf)
    );

    // Add ribbon icon
    this.addRibbonIcon('layout-grid', 'Smart Connection Graph', async () => {
      await this.activateView();
    });

    // Add command to open the graph
    this.addCommand({
      id: 'open-smart-connection-graph',
      name: 'Open Smart Connection Graph',
      callback: async () => {
        await this.activateView();
      }
    });

    // Register workspace event to refresh graph when active leaf changes
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.refreshOpenGraphViews();
      })
    );
  }

  async onunload() {
    // Detach all graph view leaves
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_GRAPH);
  }

  /**
   * Activate the graph view in the right sidebar
   */
  async activateView() {
    const { workspace } = this.app;

    // Try to find existing graph view
    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_GRAPH);
    
    if (leaves.length > 0) {
      // Use existing leaf
      leaf = leaves[0];
    } else {
      // Get right leaf
      leaf = this.getRightLeaf(false);
      
      if (!leaf) {
        // Create new leaf in right split
        leaf = this.getRightLeaf(true);
      }
      
      if (!leaf) {
        // Fallback: create leaf by splitting right
        const rightLeaf = workspace.getRightLeaf(false);
        if (rightLeaf) {
          leaf = workspace.createLeafBySplit(rightLeaf, 'vertical');
        }
      }
      
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE_GRAPH,
          active: true
        });
      }
    }

    // Reveal the leaf
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  /**
   * Get a leaf in the right sidebar
   */
  private getRightLeaf(create: boolean): WorkspaceLeaf | null {
    const { workspace } = this.app;
    const rightLeaf = workspace.getRightLeaf(create);
    return rightLeaf;
  }

  /**
   * Refresh all open graph views
   */
  private refreshOpenGraphViews() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_GRAPH);
    for (const leaf of leaves) {
      const view = leaf.view;
      if (view instanceof ConnectionGraphView) {
        view.refresh();
      }
    }
  }
}
