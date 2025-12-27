export interface ConnectionSuggestion {
  score: number;
  title: string;
  targetPath?: string;
}

/**
 * Truncate title by removing .md extension and shortening if needed
 */
export function truncateTitle(title: string): string {
  // Strip trailing .md (case-insensitive)
  let result = title.replace(/\.md$/i, '');
  
  // If length <= 8, return full
  if (result.length <= 8) {
    return result;
  }
  
  // Otherwise, first 8 chars + "..."
  return result.substring(0, 8) + '...';
}

/**
 * Extract connection suggestions from the Smart Connections panel via DOM scraping
 */
export function extractConnections(): ConnectionSuggestion[] {
  // Container selectors to find the Smart Connections panel
  const containerSelectors = [
    '.smart-connections-panel',
    '.smart-connections',
    '.suggested-connections',
    '.workspace-split.mod-right-split .view-content'
  ];
  
  // Item selectors to find individual connection items
  const itemSelectors = [
    '.smart-connections-list-item',
    '.smart-connections__item',
    '.suggested-connection',
    '[data-connection-score]'
  ];
  
  // Score selectors within items
  const scoreSelectors = [
    '.score',
    '.smart-connections__score',
    '[data-connection-score]'
  ];
  
  // Title selectors within items
  const titleSelectors = [
    'a',
    '.title',
    '.smart-connections__title'
  ];
  
  let container: Element | null = null;
  
  // Find the container
  for (const selector of containerSelectors) {
    container = document.querySelector(selector);
    if (container) break;
  }
  
  if (!container) {
    return [];
  }
  
  // Find all items
  const items: Element[] = [];
  for (const selector of itemSelectors) {
    const foundItems = container.querySelectorAll(selector);
    foundItems.forEach(item => items.push(item));
  }
  
  // Deduplicate using Set of title+path
  const seen = new Set<string>();
  const results: ConnectionSuggestion[] = [];
  
  for (const item of items) {
    // Extract score
    let score = 0.5; // default
    for (const selector of scoreSelectors) {
      const scoreEl = item.querySelector(selector) as HTMLElement;
      if (scoreEl) {
        if (scoreEl.hasAttribute('data-connection-score')) {
          const scoreValue = parseFloat(scoreEl.getAttribute('data-connection-score') || '0.5');
          if (!isNaN(scoreValue)) {
            score = scoreValue;
            break;
          }
        } else if (scoreEl.textContent) {
          const scoreValue = parseFloat(scoreEl.textContent.trim());
          if (!isNaN(scoreValue)) {
            score = scoreValue;
            break;
          }
        }
      }
    }
    
    // Extract title and targetPath
    let title = '';
    let targetPath: string | undefined = undefined;
    
    for (const selector of titleSelectors) {
      const titleEl = item.querySelector(selector) as HTMLElement;
      if (titleEl) {
        title = titleEl.textContent?.trim() || '';
        // Try to get href for targetPath
        if (titleEl.tagName === 'A') {
          const href = (titleEl as HTMLAnchorElement).getAttribute('href');
          if (href) {
            targetPath = href;
          }
        }
        // Also check data attributes
        if (!targetPath && titleEl.hasAttribute('data-path')) {
          targetPath = titleEl.getAttribute('data-path') || undefined;
        }
        break;
      }
    }
    
    // Fallback to item text if no title found
    if (!title) {
      title = item.textContent?.trim() || '';
    }
    
    // Skip empty titles
    if (!title) continue;
    
    // Deduplicate
    const key = title + (targetPath || '');
    if (seen.has(key)) continue;
    seen.add(key);
    
    results.push({
      score,
      title,
      targetPath
    });
  }
  
  return results;
}
