import { Viewport } from './viewport.js';
import { GridRenderer } from './grid-renderer.js';
import { ComponentsRenderer, WiresRenderer } from './renderers.js';
import { ComponentModel } from '../models/component-model.js';
import { defaultRegistry } from '../components/registry.js';

export class CanvasController {
  /**
   * @param {import('../core/app-state.js').AppState} appState - The global state store.
   */
  constructor(appState) {
    /** @type {import('../core/app-state.js').AppState} */
    this.appState = appState;
    /** @type {Viewport} */
    this.viewport = new Viewport(this.appState);
    /** @type {GridRenderer} */
    this.gridRenderer = new GridRenderer();
    /** @type {Object | null} */
    this.toolManager = null; // Bound in main.js
    /** @type {HTMLCanvasElement | null} */
    this.canvas = null;
    /** @type {CanvasRenderingContext2D | null} */
    this.ctx = null;
    /** @type {boolean} */
    this.needsRedraw = true;
    /** @type {ResizeObserver | null} */
    this.resizeObserver = null;

    // Bind methods to preserve context
    this.tick = this.tick.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  /**
   * Initialize canvas binding and start render loop.
   * @param {HTMLCanvasElement} canvasElement - The canvas DOM node.
   */
  initialize(canvasElement) {
    if (!canvasElement) throw new Error('Canvas element is required for initialization.');

    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) throw new Error('Failed to acquire 2D context from canvas.');

    // Listen to changes that affect visualization
    this.appState.subscribe('change', () => this.requestRedraw());
    this.appState.subscribe('viewport', () => this.requestRedraw());
    this.appState.subscribe('selection', () => this.requestRedraw());
    this.appState.subscribe('tool', () => this.requestRedraw());

    // Monitor container dimensions rather than window to support flexible panel sizes
    const container = this.canvas.parentElement;
    if (container) {
      this.resizeObserver = new ResizeObserver(this.handleResize);
      this.resizeObserver.observe(container);
    }
    
    // Perform initial resize call
    this.handleResize();

    // Start animation loop
    requestAnimationFrame(this.tick);
  }

  /**
   * Trigger a redraw on the next frame tick.
   */
  requestRedraw() {
    this.needsRedraw = true;
  }

  /**
   * Resize canvas buffer to match physical container size, adjusting for device pixel ratio.
   */
  handleResize() {
    if (!this.canvas || !this.ctx) return;

    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set internal canvas resolution based on DPR for sharpness
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);

    // Normalize scale to match CSS dimensions
    this.ctx.scale(dpr, dpr);
    
    this.requestRedraw();
  }

  /**
   * Frame loop listener executed on every animation frame request.
   */
  tick() {
    if (this.needsRedraw) {
      this.render();
      this.needsRedraw = false;
    }
    requestAnimationFrame(this.tick);
  }

  /**
   * Perform rendering actions. In later phases, this delegates to specialized sub-renderers.
   */
  render() {
    if (!this.canvas || !this.ctx) return;

    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    const board = this.appState.project.board;
    const isDark = board.theme === 'dark';
    const appBgColor = isDark ? '#0e1117' : '#f6f8fa';

    // 1. Clear viewport (Screen Space) using application backdrop color
    this.ctx.fillStyle = appBgColor;
    this.ctx.fillRect(0, 0, width, height);

    // 2. Save screen context state and apply viewport transform (transitions to World/Grid Space)
    this.ctx.save();
    this.viewport.applyTransform(this.ctx);

    // 3. Draw Board background grid holes
    this.gridRenderer.draw(this.ctx, board, this.viewport.gridSpacing, appBgColor);

    // 3.5 Draw Wires
    WiresRenderer.drawAll(
      this.ctx,
      this.appState.project,
      this.appState.selection,
      this.viewport.gridSpacing
    );

    // 4. Draw Components
    ComponentsRenderer.drawAll(
      this.ctx,
      this.appState.project,
      this.appState.selection,
      this.viewport.gridSpacing
    );

    // 5. Draw Selection Highlights (Bounding Box Outlines)
    this.ctx.save();
    this.appState.selection.componentIds.forEach((id) => {
      const comp = this.appState.project.components.find((c) => c.id === id);
      if (!comp) return;
      const def = defaultRegistry.get(comp.type);
      if (!def) return;
      const box = ComponentModel.getBoundingBox(comp, def);
      const spacing = this.viewport.gridSpacing;
      
      this.ctx.strokeStyle = '#58a6ff';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([2, 2]);
      this.ctx.strokeRect(
        box.minX * spacing,
        box.minY * spacing,
        (box.maxX - box.minX) * spacing,
        (box.maxY - box.minY) * spacing
      );
    });
    this.ctx.restore();

    // 6. Draw Active Tool Overlay (e.g. Marquee Box)
    if (this.toolManager) {
      this.toolManager.drawOverlay(this.ctx, this.viewport.gridSpacing);
    }

    this.ctx.restore();
  }

  /**
   * Tear down listeners and observers to prevent memory leaks.
   */
  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
