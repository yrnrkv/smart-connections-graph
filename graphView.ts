import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import { ConnectionSuggestion, truncateTitle, extractConnections } from './utils';
import * as d3 from 'd3';

export const VIEW_TYPE_GRAPH = 'smart-connection-graph-view';

// Graph rendering constants
const GRAPH_WIDTH_DEFAULT = 320;
const GRAPH_HEIGHT = 340;
const FORCE_LINK_DISTANCE = 90;
const FORCE_CHARGE_STRENGTH = -160;
const SCORE_LABEL_OFFSET = -5;
const NODE_RADIUS = 12;
const NODE_LABEL_FONT_SIZE = 10;
const NODE_LABEL_OFFSET = 25;

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
}

export class ConnectionGraphView extends ItemView {
  private observer: MutationObserver | null = null;
  private simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_GRAPH;
  }

  getDisplayText(): string {
    return 'Smart Connection Graph';
  }

  getIcon(): string {
    return 'layout-grid';
  }

  async onOpen(): Promise<void> {
    // Add container class
    this.containerEl.addClass('smart-connection-graph-container');
    
    // Render initial graph
    this.renderGraph();
    
    // Observe Smart Connections panel for changes
    this.observeSmartConnectionsPanel();
  }

  async onClose(): Promise<void> {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Stop simulation
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    
    // Remove SVG
    const svg = this.containerEl.querySelector('svg');
    if (svg) {
      svg.remove();
    }
  }

  /**
   * Build graph data from active file and connection suggestions
   */
  private buildData(): { nodes: GraphNode[], links: GraphLink[] } {
    const activeFile = this.app.workspace.getActiveFile();
    
    // Get active file node
    let activeNode: GraphNode;
    if (activeFile) {
      const basename = activeFile.basename;
      activeNode = {
        id: activeFile.path,
        label: truncateTitle(basename)
      };
    } else {
      activeNode = {
        id: 'active',
        label: 'No active file'
      };
    }
    
    // Get suggestions from Smart Connections panel
    const suggestions = extractConnections();
    
    // Build nodes array
    const nodes: GraphNode[] = [activeNode];
    
    // Build links array
    const links: GraphLink[] = [];
    
    for (const suggestion of suggestions) {
      const nodeId = suggestion.targetPath || suggestion.title;
      const nodeLabel = truncateTitle(suggestion.title);
      
      nodes.push({
        id: nodeId,
        label: nodeLabel
      });
      
      links.push({
        source: activeNode.id,
        target: nodeId,
        weight: suggestion.score || 0.5
      });
    }
    
    return { nodes, links };
  }

  /**
   * Public method to refresh the graph visualization
   */
  public refresh(): void {
    this.renderGraph();
  }

  /**
   * Render the force-directed graph
   */
  private renderGraph(): void {
    // Clear content
    this.contentEl.empty();
    
    // Build data
    const { nodes, links } = this.buildData();
    
    // If no links, show empty state
    if (links.length === 0) {
      const emptyState = this.contentEl.createDiv({ cls: 'empty-state' });
      emptyState.setText('No Smart Connections suggestions found. Open the Smart Connections panel to see connections.');
      return;
    }
    
    // Get dimensions
    const width = this.containerEl.clientWidth || GRAPH_WIDTH_DEFAULT;
    const height = GRAPH_HEIGHT;
    
    // Create SVG
    const svg = d3.select(this.contentEl)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create simulation
    this.simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(FORCE_LINK_DISTANCE)
        .strength(d => Math.max(0.2, d.weight)))
      .force('charge', d3.forceManyBody().strength(FORCE_CHARGE_STRENGTH))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Draw edges
    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', 'var(--text-muted)')
      .attr('stroke-width', d => Math.max(1, 3 * d.weight))
      .attr('opacity', d => Math.min(1, Math.max(0.2, d.weight)));
    
    // Draw score labels on edges
    const scoreLabel = svg.append('g')
      .selectAll('text')
      .data(links)
      .enter()
      .append('text')
      .attr('class', 'score-label')
      .attr('text-anchor', 'middle')
      .attr('pointer-events', 'none')
      .text(d => d.weight.toFixed(2));
    
    // Draw nodes
    const node = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', NODE_RADIUS)
      .attr('fill', 'var(--interactive-accent)')
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.openNode(d));
    
    // Draw node labels
    const nodeLabel = svg.append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', NODE_LABEL_FONT_SIZE)
      .attr('pointer-events', 'none')
      .text(d => d.label);
    
    // Update positions on tick
    this.simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);
      
      scoreLabel
        .attr('x', d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr('y', d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 + SCORE_LABEL_OFFSET);
      
      node
        .attr('cx', d => d.x || 0)
        .attr('cy', d => d.y || 0);
      
      nodeLabel
        .attr('x', d => d.x || 0)
        .attr('y', d => (d.y || 0) + NODE_LABEL_OFFSET);
    });
  }

  /**
   * Open a node in the workspace
   */
  private openNode(node: GraphNode): void {
    const target = node.id;
    
    // Try using metadataCache to resolve the link
    try {
      const file = this.app.metadataCache.getFirstLinkpathDest(target, '');
      if (file) {
        this.app.workspace.openLinkText(file.path, '', false);
        return;
      }
    } catch (e) {
      // Fall through to fallback
    }
    
    // Fallback: open link text directly
    this.app.workspace.openLinkText(target, '', false);
  }

  /**
   * Observe Smart Connections panel for changes
   */
  private observeSmartConnectionsPanel(): void {
    // Known panel selectors
    const panelSelectors = [
      '.smart-connections-panel',
      '.smart-connections',
      '.suggested-connections',
      '.workspace-split.mod-right-split .view-content'
    ];
    
    // Find panel to observe
    let targetNode: Element | null = null;
    for (const selector of panelSelectors) {
      targetNode = document.querySelector(selector);
      if (targetNode) break;
    }
    
    // If no panel found, observe document.body to catch when it appears
    if (!targetNode) {
      targetNode = document.body;
    }
    
    // Create observer
    this.observer = new MutationObserver(() => {
      // Use requestAnimationFrame to debounce and refresh
      requestAnimationFrame(() => {
        this.renderGraph();
      });
    });
    
    // Observe changes
    this.observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
  }
}
