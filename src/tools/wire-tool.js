/**
 * @fileoverview WireTool class for drawing multi-segment wires on the grid.
 */

import { AddWireCommand } from '../core/commands.js';
import { defaultRegistry } from '../components/registry.js';
import { ComponentModel } from '../models/component-model.js';

export class WireTool {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state.
   * @param {import('../core/command-manager.js').CommandManager} commandManager - Command engine.
   */
  constructor(appState, commandManager) {
    this.appState = appState;
    this.commandManager = commandManager;

    // Interaction state
    /** @type {{x: number, y: number}[]} */
    this.points = [];
    this.mouseGridX = 0;
    this.mouseGridY = 0;

    // Default wire properties
    this.color = '#ff0000';
    this.thickness = 2;
    this.label = '';

    // Orthogonal routing mode properties
    this.orthoMode = false;
    this.orthoVerticalFirst = false;
  }

  /**
   * Activate the tool, setting crosshair cursor on the canvas.
   */
  activate() {
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
    this.points = [];
  }

  /**
   * Deactivate the tool, resetting state and restoring cursor.
   */
  deactivate() {
    const canvas = document.getElementById('main-canvas');
    if (canvas) {
      canvas.style.cursor = 'default';
    }
    if (this.points.length >= 2) {
      this.commitWire();
    } else {
      this.points = [];
    }
  }

  /**
   * Get component pin at target grid coordinates.
   * @param {number} gridX
   * @param {number} gridY
   * @returns {Object | null}
   */
  getPinAt(gridX, gridY) {
    const project = this.appState.project;
    for (const comp of project.components) {
      const def = defaultRegistry.get(comp.type);
      if (!def) continue;
      const pins = ComponentModel.getGlobalPins(comp, def);
      const matched = pins.find(p => p.x === gridX && p.y === gridY);
      if (matched) {
        return {
          component: comp,
          pin: matched,
          x: matched.x,
          y: matched.y
        };
      }
    }
    return null;
  }

  /**
   * Handle mousedown to add vertices or finalize drawing.
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  onMouseDown(e, gridX, gridY) {
    if (e.button !== 0) return; // Only respond to left clicks

    const x = Math.round(gridX);
    const y = Math.round(gridY);

    if (e.detail >= 2) {
      // Double click - finalize wire
      if (this.points.length > 0) {
        const last = this.points[this.points.length - 1];
        if (last.x !== x || last.y !== y) {
          if (this.orthoMode && this.points.length > 0) {
            const penultimate = this.points[this.points.length - 1];
            if (x !== penultimate.x && y !== penultimate.y) {
              const cornerX = this.orthoVerticalFirst ? penultimate.x : x;
              const cornerY = this.orthoVerticalFirst ? y : penultimate.y;
              this.points.push({ x: cornerX, y: cornerY });
            }
          }
          this.points.push({ x, y });
        }
        this.commitWire();
      }
    } else {
      // Single click - add vertex
      if (this.points.length === 0) {
        this.points.push({ x, y });
      } else {
        const last = this.points[this.points.length - 1];
        if (last.x !== x || last.y !== y) {
          if (this.orthoMode) {
            if (x !== last.x && y !== last.y) {
              const cornerX = this.orthoVerticalFirst ? last.x : x;
              const cornerY = this.orthoVerticalFirst ? y : last.y;
              this.points.push({ x: cornerX, y: cornerY });
            }
          }
          this.points.push({ x, y });
        } else {
          // Clicked the same point again -> finalize!
          this.commitWire();
          return;
        }
      }
      this.appState.emit('change', { type: 'wire-preview' });
    }
  }

  /**
   * Handle mouse movement to update ghost endpoint and snapped coordinates.
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
      this.appState.emit('change', { type: 'wire-preview' });
    }
  }

  /**
   * Handle mouseup (no-op for vertex-based wire tool).
   * @param {MouseEvent} e - DOM event.
   * @param {number} gridX - World grid column index.
   * @param {number} gridY - World grid row index.
   */
  onMouseUp(e, gridX, gridY) {
    // No-op
  }

  /**
   * Handle keyboard shortcuts delegated from the main interface loop.
   * @param {KeyboardEvent} e - DOM event.
   */
  onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.commitWire();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.points = [];
      this.appState.emit('change', { type: 'wire-preview' });
    } else if (e.code === 'Space') {
      // Toggle orthogonal elbow direction
      e.preventDefault();
      this.orthoVerticalFirst = !this.orthoVerticalFirst;
      this.appState.emit('change', { type: 'wire-preview' });
    } else if (e.key.toLowerCase() === 'o' || e.key === 'خ') {
      e.preventDefault();
      this.orthoMode = !this.orthoMode;
      this.appState.emit('change', { type: 'wire-preview' });
      this.appState.emit('change', { type: 'wire-ortho-toggle' });
      console.log('Ortho Mode toggled:', this.orthoMode);
    }
  }

  /**
   * Commit the collected points list as a new Wire instance to state.
   */
  commitWire() {
    // Deduplicate consecutive points
    const cleanPoints = [];
    for (const p of this.points) {
      if (
        cleanPoints.length === 0 ||
        p.x !== cleanPoints[cleanPoints.length - 1].x ||
        p.y !== cleanPoints[cleanPoints.length - 1].y
      ) {
        cleanPoints.push(p);
      }
    }

    if (cleanPoints.length >= 2) {
      const wires = [];
      for (let i = 0; i < cleanPoints.length - 1; i++) {
        wires.push({
          id: 'wire_' + Math.random().toString(36).substr(2, 9),
          color: this.color,
          label: this.label,
          thickness: this.thickness,
          points: [
            { x: cleanPoints[i].x, y: cleanPoints[i].y },
            { x: cleanPoints[i+1].x, y: cleanPoints[i+1].y }
          ]
        });
      }
      this.commandManager.execute(new AddWireCommand(wires));
    }

    this.points = [];
    this.appState.emit('change', { type: 'wire-committed' });
  }

  /**
   * Draw the active drawing line overlay on the canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {number} spacing - Grid pixel unit scale.
   */
  drawOverlay(ctx, spacing) {
    if (this.points.length > 0) {
      ctx.save();
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.thickness;
      ctx.globalAlpha = 0.7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Draw established segments
      ctx.beginPath();
      ctx.moveTo(this.points[0].x * spacing, this.points[0].y * spacing);
      for (let i = 1; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x * spacing, this.points[i].y * spacing);
      }

      // 2. Draw ghost segment from last point to cursor
      const last = this.points[this.points.length - 1];
      if (this.orthoMode && (this.mouseGridX !== last.x || this.mouseGridY !== last.y)) {
        const cornerX = this.orthoVerticalFirst ? last.x : this.mouseGridX;
        const cornerY = this.orthoVerticalFirst ? this.mouseGridY : last.y;
        ctx.lineTo(cornerX * spacing, cornerY * spacing);
      }
      ctx.lineTo(this.mouseGridX * spacing, this.mouseGridY * spacing);
      ctx.stroke();

      // 3. Draw dot highlights at all vertices
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.9;
      this.points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * spacing, p.y * spacing, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.beginPath();
      ctx.arc(this.mouseGridX * spacing, this.mouseGridY * spacing, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Draw hover indicator dot
      ctx.save();
      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(this.mouseGridX * spacing, this.mouseGridY * spacing, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Highlight pin under cursor if any
    const pinInfo = this.getPinAt(this.mouseGridX, this.mouseGridY);
    if (pinInfo) {
      ctx.save();
      ctx.strokeStyle = '#2ea043'; // Green ring
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pinInfo.x * spacing, pinInfo.y * spacing, 8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#2ea043'; // Green solid center dot
      ctx.beginPath();
      ctx.arc(pinInfo.x * spacing, pinInfo.y * spacing, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw tooltip text showing pin label and component name
      ctx.fillStyle = '#2ea043';
      ctx.font = '10px sans-serif';
      ctx.fillText(
        `${pinInfo.component.name} pin ${pinInfo.pin.label || pinInfo.pin.id}`,
        pinInfo.x * spacing + 12,
        pinInfo.y * spacing + 4
      );
      ctx.restore();
    }
  }
}
