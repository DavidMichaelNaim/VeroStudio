/**
 * @fileoverview ToolManager class coordinating active canvas tools and routing input events.
 */

export class ToolManager {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state.
   * @param {import('../core/command-manager.js').CommandManager} commandManager - Command engine.
   * @param {import('../canvas/viewport.js').Viewport} viewport - Viewport conversions.
   */
  constructor(appState, commandManager, viewport) {
    this.appState = appState;
    this.commandManager = commandManager;
    this.viewport = viewport;

    /** @type {Map<string, Object>} */
    this.tools = new Map();
    /** @type {Object | null} */
    this.activeTool = null;

    // Sync with appState active tool changes
    this.appState.subscribe('tool', ({ tool }) => {
      const nextTool = this.tools.get(tool);
      if (nextTool && this.activeTool !== nextTool) {
        if (this.activeTool && typeof this.activeTool.deactivate === 'function') {
          this.activeTool.deactivate();
        }
        this.activeTool = nextTool;
        if (typeof this.activeTool.activate === 'function') {
          this.activeTool.activate();
        }
      }
    });
  }

  /**
   * Register a tool.
   * @param {string} name - Tool identifier name.
   * @param {Object} toolInstance - Tool controller instance.
   */
  registerTool(name, toolInstance) {
    this.tools.set(name, toolInstance);
    // Auto-set the active tool if matches AppState active tool
    if (this.appState.activeTool === name) {
      this.activeTool = toolInstance;
    }
  }

  /**
   * Switch the active canvas interaction tool.
   * @param {string} name - Target tool key.
   */
  setTool(name) {
    const nextTool = this.tools.get(name);
    if (!nextTool) {
      console.warn(`Attempted to activate unregistered tool: ${name}`);
      return;
    }

    if (this.activeTool && typeof this.activeTool.deactivate === 'function') {
      this.activeTool.deactivate();
    }

    this.activeTool = nextTool;
    this.appState.setActiveTool(name, this.appState.activeToolParams);
    
    if (typeof this.activeTool.activate === 'function') {
      this.activeTool.activate();
    }
  }

  /**
   * Route mousedown event to the active tool.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  handleMouseDown(e, gridX, gridY) {
    if (this.activeTool && typeof this.activeTool.onMouseDown === 'function') {
      this.activeTool.onMouseDown(e, gridX, gridY);
    }
  }

  /**
   * Route mousemove event to the active tool.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  handleMouseMove(e, gridX, gridY) {
    if (this.activeTool && typeof this.activeTool.onMouseMove === 'function') {
      this.activeTool.onMouseMove(e, gridX, gridY);
    }
  }

  /**
   * Route mouseup event to the active tool.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  handleMouseUp(e, gridX, gridY) {
    if (this.activeTool && typeof this.activeTool.onMouseUp === 'function') {
      this.activeTool.onMouseUp(e, gridX, gridY);
    }
  }

  /**
   * Delegate overlay drawing routine onto active tool.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} spacing - Grid pixel unit scale.
   */
  drawOverlay(ctx, spacing) {
    if (this.activeTool && typeof this.activeTool.drawOverlay === 'function') {
      this.activeTool.drawOverlay(ctx, spacing);
    }
  }
}
