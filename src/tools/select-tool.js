/**
 * @fileoverview SelectTool class handling component selection, drag-and-drop movement, and drag marquee boxes.
 */

import { ComponentModel } from '../models/component-model.js';
import { defaultRegistry } from '../components/registry.js';
import { MoveComponentsCommand, MoveWirePointCommand, MoveWirePointsCommand } from '../core/commands.js';
import { WireModel } from '../models/wire-model.js';

export class SelectTool {
  /**
   * @param {import('../core/app-state.js').AppState} appState
   * @param {import('../core/command-manager.js').CommandManager} commandManager
   */
  constructor(appState, commandManager) {
    this.appState = appState;
    this.commandManager = commandManager;

    // Interaction states
    this.isDragging = false;
    this.isMarquee = false;

    // Drag tracking points in grid coordinates
    this.dragStartGridX = 0;
    this.dragStartGridY = 0;
    /** @type {Map<string, {x: number, y: number}>} */
    this.initialPositions = new Map(); // stores component coordinates at start of drag
    /** @type {Map<string, {x: number, y: number}[]>} */
    this.initialWirePositions = new Map(); // stores coordinates of wire vertices at start of drag
    /** @type {{wireId: string, pointIndex: number, startX: number, startY: number}[]} */
    this.connectedWirePoints = []; // stores connected wire coordinates at start of drag

    /** Wire vertex drag state */
    this.isDraggingWirePoint = false;
    /** @type {{wireId: string, pointIndex: number, startX: number, startY: number}[]} */
    this.draggedWirePoints = [];

    // Marquee tracking points in grid coordinates
    this.marqueeStartGridX = 0;
    this.marqueeStartGridY = 0;
    this.marqueeEndGridX = 0;
    this.marqueeEndGridY = 0;
  }

  /**
   * Capture click selection and trigger dragging or marquee.
   */
  onMouseDown(e, gridX, gridY) {
    const project = this.appState.project;
    const selection = this.appState.selection;

    // 1. Hit test wire VERTICES first (takes priority over components so user can select/drag connected wire ends)
    const VERTEX_THRESHOLD = 0.5; // Precise hit radius for vertex handles
    let hitVertex = null;
    for (let wi = project.wires.length - 1; wi >= 0; wi--) {
      const wire = project.wires[wi];
      for (let pi = 0; pi < wire.points.length; pi++) {
        const pt = wire.points[pi];
        if (Math.hypot(gridX - pt.x, gridY - pt.y) <= VERTEX_THRESHOLD) {
          hitVertex = { wireId: wire.id, pointIndex: pi, startX: pt.x, startY: pt.y };
          break;
        }
      }
      if (hitVertex) break;
    }

    if (hitVertex) {
      // Determine which wires are being dragged
      const isSelected = selection.wireIds.includes(hitVertex.wireId);
      let activeWireIds = [];
      
      if (e.shiftKey) {
        // Toggle selection
        const nextIds = isSelected
          ? selection.wireIds.filter(id => id !== hitVertex.wireId)
          : [...selection.wireIds, hitVertex.wireId];
        this.appState.updateSelection({ componentIds: [], wireIds: nextIds, labelIds: [] });
        activeWireIds = nextIds;
      } else {
        // Single select if not already selected (clears other selections for easy single-wire disconnect)
        if (!isSelected) {
          this.appState.updateSelection({ componentIds: [], wireIds: [hitVertex.wireId], labelIds: [] });
          activeWireIds = [hitVertex.wireId];
        } else {
          activeWireIds = selection.wireIds;
        }
      }

      const targetX = hitVertex.startX;
      const targetY = hitVertex.startY;

      // Find vertices at this coordinate that belong to the active selection
      const draggedVertices = [];
      project.wires.forEach((wire) => {
        if (activeWireIds.includes(wire.id)) {
          wire.points.forEach((pt, ptIdx) => {
            if (pt.x === targetX && pt.y === targetY) {
              draggedVertices.push({
                wireId: wire.id,
                pointIndex: ptIdx,
                startX: pt.x,
                startY: pt.y
              });
            }
          });
        }
      });

      // Begin vertex drag
      this.isDraggingWirePoint = true;
      this.dragStartGridX = gridX;
      this.dragStartGridY = gridY;
      this.draggedWirePoints = draggedVertices;
      return;
    }

    // 2. Hit test components
    let hitComp = null;
    // Iterate in reverse to select the top-most component first
    for (let i = project.components.length - 1; i >= 0; i--) {
      const comp = project.components[i];
      const def = defaultRegistry.get(comp.type);
      if (def && ComponentModel.hitTest(comp, def, gridX, gridY)) {
        hitComp = comp;
        break;
      }
    }

    if (hitComp) {
      // Component click selection logic
      const isSelected = selection.componentIds.includes(hitComp.id);
      
      if (e.shiftKey) {
        // Toggle selection
        const nextIds = isSelected 
          ? selection.componentIds.filter(id => id !== hitComp.id)
          : [...selection.componentIds, hitComp.id];
        this.appState.updateSelection({ componentIds: nextIds });
      } else {
        // Single select (only replace if not already in selection to allow dragging multiple items)
        if (!isSelected) {
          this.appState.updateSelection({ componentIds: [hitComp.id], wireIds: [], labelIds: [] });
        }
      }
    } else {
      // 3. Hit test wire body
      let hitWire = null;
      for (let i = project.wires.length - 1; i >= 0; i--) {
        const wire = project.wires[i];
        if (WireModel.hitTest(wire, gridX, gridY, 0.4)) {
          hitWire = wire;
          break;
        }
      }

      if (hitWire) {
        // Wire click selection logic
        const isSelected = selection.wireIds.includes(hitWire.id);
        
        if (e.shiftKey) {
          // Toggle selection
          const nextIds = isSelected
            ? selection.wireIds.filter(id => id !== hitWire.id)
            : [...selection.wireIds, hitWire.id];
          this.appState.updateSelection({ wireIds: nextIds });
        } else {
          // Single select wire
          if (!isSelected) {
            this.appState.updateSelection({ componentIds: [], wireIds: [hitWire.id], labelIds: [] });
          }
        }
      } else {
        // Clicked empty board area - start selection marquee box
        if (!e.shiftKey) {
          this.appState.clearSelection();
        }
        this.isMarquee = true;
        this.marqueeStartGridX = gridX;
        this.marqueeStartGridY = gridY;
        this.marqueeEndGridX = gridX;
        this.marqueeEndGridY = gridY;
        return;
      }
    }

    // Initialize dragging for selected components and/or wires
    const currentSelection = this.appState.selection;
    if (currentSelection.componentIds.length > 0 || currentSelection.wireIds.length > 0) {
      this.isDragging = true;
      this.dragStartGridX = gridX;
      this.dragStartGridY = gridY;

      // Cache start positions for components
      this.initialPositions.clear();
      currentSelection.componentIds.forEach((id) => {
        const comp = project.components.find(c => c.id === id);
        if (comp && !comp.locked) {
          this.initialPositions.set(id, { x: comp.gridX, y: comp.gridY });
        }
      });

      // Cache start positions for wires
      this.initialWirePositions.clear();
      currentSelection.wireIds.forEach((id) => {
        const wire = project.wires.find(w => w.id === id);
        if (wire) {
          this.initialWirePositions.set(id, wire.points.map(pt => ({ x: pt.x, y: pt.y })));
        }
      });

      // Cache connected wire points for real-time drag feedback (excluding wires that are being dragged entirely)
      this.connectedWirePoints = [];
      const pinPositions = [];
      this.initialPositions.forEach((startPos, compId) => {
        const comp = project.components.find(c => c.id === compId);
        if (comp) {
          const def = defaultRegistry.get(comp.type);
          if (def) {
            const pins = ComponentModel.getGlobalPins(comp, def);
            pins.forEach((pin) => {
              pinPositions.push({ x: pin.x, y: pin.y });
            });
          }
        }
      });

      project.wires.forEach((wire) => {
        if (currentSelection.wireIds.includes(wire.id)) return; // Already moving fully
        wire.points.forEach((pt, ptIdx) => {
          const isConnected = pinPositions.some(pin => pin.x === pt.x && pin.y === pt.y);
          if (isConnected) {
            this.connectedWirePoints.push({
              wireId: wire.id,
              pointIndex: ptIdx,
              startX: pt.x,
              startY: pt.y
            });
          }
        });
      });
    }
  }

  /**
   * Update component previews during drag or update marquee selection.
   */
  onMouseMove(e, gridX, gridY) {
    if (this.isDragging) {
      const dx = Math.round(gridX - this.dragStartGridX);
      const dy = Math.round(gridY - this.dragStartGridY);

      // Perform real-time visual movement by modifying coordinate properties
      this.appState.updateProject((project) => {
        // Move components visually
        this.initialPositions.forEach((startPos, id) => {
          const comp = project.components.find(c => c.id === id);
          if (comp) {
            comp.gridX = startPos.x + dx;
            comp.gridY = startPos.y + dy;
          }
        });

        // Move fully selected wires visually
        this.initialWirePositions.forEach((startPoints, wireId) => {
          const wire = project.wires.find(w => w.id === wireId);
          if (wire) {
            wire.points.forEach((pt, idx) => {
              if (startPoints[idx]) {
                pt.x = startPoints[idx].x + dx;
                pt.y = startPoints[idx].y + dy;
              }
            });
          }
        });

        // Move connected wire points visually
        this.connectedWirePoints.forEach((conn) => {
          const wire = project.wires.find(w => w.id === conn.wireId);
          if (wire && wire.points[conn.pointIndex]) {
            wire.points[conn.pointIndex].x = conn.startX + dx;
            wire.points[conn.pointIndex].y = conn.startY + dy;
          }
        });
      });
    } else if (this.isDraggingWirePoint) {
      // Real-time visual drag of the selected wire vertices
      const dx = Math.round(gridX - this.dragStartGridX);
      const dy = Math.round(gridY - this.dragStartGridY);
      this.appState.updateProject((project) => {
        this.draggedWirePoints.forEach((conn) => {
          const wire = project.wires.find(w => w.id === conn.wireId);
          if (wire && wire.points[conn.pointIndex]) {
            wire.points[conn.pointIndex].x = conn.startX + dx;
            wire.points[conn.pointIndex].y = conn.startY + dy;
          }
        });
      });
    } else if (this.isMarquee) {
      this.marqueeEndGridX = gridX;
      this.marqueeEndGridY = gridY;

      // Calculate marquee box bounds
      const minX = Math.min(this.marqueeStartGridX, this.marqueeEndGridX);
      const maxX = Math.max(this.marqueeStartGridX, this.marqueeEndGridX);
      const minY = Math.min(this.marqueeStartGridY, this.marqueeEndGridY);
      const maxY = Math.max(this.marqueeStartGridY, this.marqueeEndGridY);

      // Identify components intersecting marquee box
      const intersectingCompIds = [];
      this.appState.project.components.forEach((comp) => {
        const def = defaultRegistry.get(comp.type);
        if (!def) return;
        const box = ComponentModel.getBoundingBox(comp, def);
        
        // AABB intersection check
        const overlap = !(box.maxX < minX || box.minX > maxX || box.maxY < minY || box.minY > maxY);
        if (overlap) {
          intersectingCompIds.push(comp.id);
        }
      });

      // Identify wires intersecting marquee box
      const intersectingWireIds = [];
      this.appState.project.wires.forEach((wire) => {
        const box = WireModel.getBoundingBox(wire);
        
        // AABB intersection check
        const overlap = !(box.maxX < minX || box.minX > maxX || box.maxY < minY || box.minY > maxY);
        if (overlap) {
          intersectingWireIds.push(wire.id);
        }
      });

      this.appState.updateSelection({
        componentIds: intersectingCompIds,
        wireIds: intersectingWireIds,
        labelIds: []
      });
    }
  }

  /**
   * Commit drags or finalize marquee selects.
   */
  onMouseUp(e, gridX, gridY) {
    if (this.isDragging) {
      this.isDragging = false;
      const dx = Math.round(gridX - this.dragStartGridX);
      const dy = Math.round(gridY - this.dragStartGridY);

      if (dx !== 0 || dy !== 0) {
        // Revert temporary visual modifications before executing history command
        this.appState.updateProject((project) => {
          this.initialPositions.forEach((startPos, id) => {
            const comp = project.components.find(c => c.id === id);
            if (comp) {
              comp.gridX = startPos.x;
              comp.gridY = startPos.y;
            }
          });

          this.initialWirePositions.forEach((startPoints, wireId) => {
            const wire = project.wires.find(w => w.id === wireId);
            if (wire) {
              wire.points.forEach((pt, idx) => {
                if (startPoints[idx]) {
                  pt.x = startPoints[idx].x;
                  pt.y = startPoints[idx].y;
                }
              });
            }
          });

          this.connectedWirePoints.forEach((conn) => {
            const wire = project.wires.find(w => w.id === conn.wireId);
            if (wire && wire.points[conn.pointIndex]) {
              wire.points[conn.pointIndex].x = conn.startX;
              wire.points[conn.pointIndex].y = conn.startY;
            }
          });
        });

        // Execute command to perform movement transactionally (supports undo/redo)
        const componentIds = Array.from(this.initialPositions.keys());
        const wireIds = Array.from(this.initialWirePositions.keys());
        this.commandManager.execute(new MoveComponentsCommand(componentIds, dx, dy, wireIds));
      }
      this.initialPositions.clear();
      this.initialWirePositions.clear();
      this.connectedWirePoints = [];
    } else if (this.isDraggingWirePoint) {
      this.isDraggingWirePoint = false;
      const dx = Math.round(gridX - this.dragStartGridX);
      const dy = Math.round(gridY - this.dragStartGridY);
      const conns = this.draggedWirePoints;
      if (conns && conns.length > 0 && (dx !== 0 || dy !== 0)) {
        // Revert temp visual state so command captures pristine start
        this.appState.updateProject((project) => {
          conns.forEach((conn) => {
            const wire = project.wires.find(w => w.id === conn.wireId);
            if (wire && wire.points[conn.pointIndex]) {
              wire.points[conn.pointIndex].x = conn.startX;
              wire.points[conn.pointIndex].y = conn.startY;
            }
          });
        });
        // Commit undoable command
        const moves = conns.map(conn => ({
          wireId: conn.wireId,
          pointIndex: conn.pointIndex,
          prevX: conn.startX,
          prevY: conn.startY,
          newX: conn.startX + dx,
          newY: conn.startY + dy
        }));
        this.commandManager.execute(new MoveWirePointsCommand(moves));
      }
      this.draggedWirePoints = [];
    } else if (this.isMarquee) {
      this.isMarquee = false;
    }
  }

  /**
   * Draw visual aids like marquee bounding boxes.
   */
  drawOverlay(ctx, spacing) {
    if (this.isMarquee) {
      const x = this.marqueeStartGridX * spacing;
      const y = this.marqueeStartGridY * spacing;
      const w = (this.marqueeEndGridX - this.marqueeStartGridX) * spacing;
      const h = (this.marqueeEndGridY - this.marqueeStartGridY) * spacing;

      ctx.save();
      ctx.strokeStyle = '#58a6ff';
      ctx.fillStyle = 'rgba(88, 166, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]); // dashed outline
      
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }

  deactivate() {
    this.isDragging = false;
    this.isMarquee = false;
    this.isDraggingWirePoint = false;
    this.draggedWirePoints = [];
    this.initialPositions.clear();
    this.initialWirePositions.clear();
    this.connectedWirePoints = [];
  }
}
