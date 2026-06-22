/**
 * @fileoverview StatusBar class managing the bottom status bar information displays.
 */

export class StatusBar {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state store.
   * @param {HTMLElement} container - DOM footer container element.
   */
  constructor(appState, container) {
    this.appState = appState;
    this.container = container;

    /** @type {HTMLElement | null} */
    this.modeEl = document.getElementById('status-mode');
    /** @type {HTMLElement | null} */
    this.coordsEl = document.getElementById('status-coords');
    /** @type {HTMLElement | null} */
    this.zoomEl = document.getElementById('status-zoom');

    // Create item stats element dynamically
    /** @type {HTMLDivElement} */
    this.statsEl = document.createElement('div');
    this.statsEl.id = 'status-stats';
    this.statsEl.style.fontSize = '0.75rem';
    this.statsEl.style.color = 'var(--text-secondary)';

    if (this.zoomEl && this.container) {
      this.container.insertBefore(this.statsEl, this.zoomEl);
    } else if (this.container) {
      this.container.appendChild(this.statsEl);
    }

    // Subscribe to state change notifications
    this.appState.subscribe('tool', ({ tool, params }) => this.updateTool(tool, params));
    this.appState.subscribe('viewport', (vp) => this.updateZoom(vp.zoom));
    this.appState.subscribe('selection', () => this.updateStats());
    this.appState.subscribe('project', () => this.updateStats());
    this.appState.subscribe('change', (e) => {
      if (e && (e.type === 'wire-ortho-toggle' || e.type === 'wire-preview')) {
        this.updateTool(this.appState.activeTool, this.appState.activeToolParams);
      }
    });

    // Initialize values
    this.updateTool(this.appState.activeTool, this.appState.activeToolParams);
    this.updateZoom(this.appState.viewport.zoom);
    this.updateStats();
  }

  /**
   * Update active editor mode text display.
   * @param {string} tool - Tool key name.
   * @param {Record<string, any>} params - Tool params.
   */
  updateTool(tool, params) {
    if (!this.modeEl) return;
    const TOOL_NAMES = { select: 'Move Tool', wire: 'Wire Tool', component: 'Place' };
    if (tool === 'component' && params && params.componentType) {
      this.modeEl.textContent = `Mode: Place ${params.componentType.toUpperCase()}`;
    } else if (tool === 'wire') {
      const wireTool = window.__VeroStudio__?.toolManager?.tools?.get('wire');
      const isOrtho = wireTool ? wireTool.orthoMode : false;
      this.modeEl.textContent = `Mode: Wire Tool${isOrtho ? ' (Ortho)' : ''}`;
    } else {
      const name = TOOL_NAMES[tool] || (tool.charAt(0).toUpperCase() + tool.slice(1));
      this.modeEl.textContent = `Mode: ${name}`;
    }
  }

  /**
   * Update viewport zoom multiplier display.
   * @param {number} zoom - Zoom scale.
   */
  updateZoom(zoom) {
    if (this.zoomEl) {
      this.zoomEl.textContent = `Zoom: ${Math.round(zoom * 100)}%`;
    }
  }

  /**
   * Update selection and item counts text.
   */
  updateStats() {
    if (!this.statsEl) return;

    const project = this.appState.project;
    const selection = this.appState.selection;

    const totalComps = project.components.length;
    const totalWires = project.wires.length;
    
    const selComps = selection.componentIds.length;
    const selWires = selection.wireIds.length;
    const totalSel = selComps + selWires;

    let statsText = `Components: ${totalComps} | Wires: ${totalWires}`;
    if (totalSel > 0) {
      statsText += ` (${totalSel} selected)`;
    }
    this.statsEl.textContent = statsText;
  }

  /**
   * Set dynamicSnapped coordinates text display.
   * @param {number} x - Snapped column grid coordinate.
   * @param {number} y - Snapped row grid coordinate.
   */
  setCoordinates(x, y) {
    if (this.coordsEl) {
      this.coordsEl.textContent = `Grid: ${x}, ${y}`;
    }
  }
}
