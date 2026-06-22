/**
 * @fileoverview ComponentTool class handling interactive placement and previews of electronic components.
 */

import { AddComponentCommand } from '../core/commands.js';
import { defaultRegistry } from '../components/registry.js';

export class ComponentTool {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state store.
   * @param {import('../core/command-manager.js').CommandManager} commandManager - Command engine.
   */
  constructor(appState, commandManager) {
    this.appState = appState;
    this.commandManager = commandManager;
    this.mouseGridX = 0;
    this.mouseGridY = 0;
    this.rotation = 0;
    this.flipped = false;
  }

  /**
   * Activate the tool, configuring cursor and resetting rotation state.
   */
  activate() {
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
      canvas.style.cursor = 'cell';
    }
    this.rotation = 0;
    this.flipped = false;
  }

  /**
   * Deactivate the tool, restoring the cursor.
   */
  deactivate() {
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  }

  /**
   * Handle mousedown to place the component or cancel on right click.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  onMouseDown(e, gridX, gridY) {
    if (e.button === 2) {
      // Right click -> cancel and switch back to select tool
      e.preventDefault();
      this.appState.setActiveTool('select');
      return;
    }

    if (e.button !== 0) return; // Only respond to left clicks

    const x = Math.round(gridX);
    const y = Math.round(gridY);
    const type = this.appState.activeToolParams.componentType;
    const def = defaultRegistry.get(type);
    
    if (def) {
      const config = {
        type,
        gridX: x,
        gridY: y,
        rotation: this.rotation,
        flipped: this.flipped,
        properties: Object.assign({}, def.defaultProperties)
      };
      this.commandManager.execute(new AddComponentCommand(config));
    }
  }

  /**
   * Handle mousemove to update the preview location on grid.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  onMouseMove(e, gridX, gridY) {
    const x = Math.round(gridX);
    const y = Math.round(gridY);

    if (x !== this.mouseGridX || y !== this.mouseGridY) {
      this.mouseGridX = x;
      this.mouseGridY = y;
      this.appState.emit('change', { type: 'component-preview' });
    }
  }

  /**
   * Handle mouseup (no-op).
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  onMouseUp(e, gridX, gridY) {
    // No-op
  }

  /**
   * Handle hotkeys (rotate / cancel).
   * @param {KeyboardEvent} e - DOM event.
   */
  onKeyDown(e) {
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      this.rotation = (this.rotation + 90) % 360;
      this.appState.emit('change', { type: 'component-preview' });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.appState.setActiveTool('select');
    }
  }

  /**
   * Draw the active placement ghost preview.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} spacing - Grid pixel unit scale.
   */
  drawOverlay(ctx, spacing) {
    const type = this.appState.activeToolParams.componentType;
    const def = defaultRegistry.get(type);
    if (!def) return;

    ctx.save();
    ctx.translate(this.mouseGridX * spacing, this.mouseGridY * spacing);
    if (this.rotation !== 0) {
      ctx.rotate((this.rotation * Math.PI) / 180);
    }
    if (this.flipped) {
      ctx.scale(-1, 1);
    }
    
    // Draw ghost preview with globalAlpha
    ctx.globalAlpha = 0.5;
    def.draw(ctx, def.defaultProperties || {}, false, this.appState.project.board.theme === 'dark');
    ctx.restore();
  }
}
