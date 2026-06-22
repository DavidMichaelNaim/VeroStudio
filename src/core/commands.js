/**
 * @fileoverview Collection of concrete commands mutating the application state.
 */

import { defaultRegistry } from '../components/registry.js';
import { ComponentModel } from '../models/component-model.js';

/**
 * Command to change the size dimensions of the board grid.
 * @implements {Command}
 */
export class ResizeBoardCommand {
  /**
   * @param {number} nextWidth - The new board width.
   * @param {number} nextHeight - The new board height.
   */
  constructor(nextWidth, nextHeight) {
    this.name = 'Resize Board';
    this.nextWidth = nextWidth;
    this.nextHeight = nextHeight;
    this.prevWidth = 30;
    this.prevHeight = 20;
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    this.prevWidth = appState.project.board.width;
    this.prevHeight = appState.project.board.height;
    
    appState.updateProject((project) => {
      project.board.width = this.nextWidth;
      project.board.height = this.nextHeight;
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      project.board.width = this.prevWidth;
      project.board.height = this.prevHeight;
    });
  }
}

/**
 * Command to update the user-defined name of the project.
 * @implements {Command}
 */
export class UpdateProjectNameCommand {
  /**
   * @param {string} nextName - The new name of the project.
   */
  constructor(nextName) {
    this.name = 'Rename Project';
    this.nextName = nextName;
    this.prevName = '';
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    this.prevName = appState.project.name;
    appState.updateProject((project) => {
      project.name = this.nextName;
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      project.name = this.prevName;
    });
  }
}

/**
 * Command to toggle or set the current UI theme.
 * @implements {Command}
 */
export class SetThemeCommand {
  /**
   * @param {'light' | 'dark'} nextTheme - The theme to set.
   */
  constructor(nextTheme) {
    this.name = 'Change Theme';
    this.nextTheme = nextTheme;
    this.prevTheme = 'dark';
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    this.prevTheme = appState.project.board.theme;
    appState.updateProject((project) => {
      project.board.theme = this.nextTheme;
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      project.board.theme = this.prevTheme;
    });
  }
}

/**
 * Command to add a component instance to the project state.
 * @implements {Command}
 */
export class AddComponentCommand {
  /**
   * @param {Object} config - Config parameters for component.
   */
  constructor(config) {
    this.name = 'Add Component';
    this.component = {
      id: config.id || 'comp_' + Math.random().toString(36).substr(2, 9),
      type: config.type,
      name: config.name || (config.type.toUpperCase() + '1'),
      gridX: config.gridX,
      gridY: config.gridY,
      rotation: config.rotation || 0,
      flipped: config.flipped || false,
      locked: config.locked || false,
      properties: Object.assign({}, config.properties)
    };
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    appState.updateProject((project) => {
      project.components.push(this.component);
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      const idx = project.components.findIndex(c => c.id === this.component.id);
      if (idx !== -1) {
        project.components.splice(idx, 1);
      }
    });
  }
}

/**
 * Command to move one or more component instances in grid coordinates.
 * @implements {Command}
 */
export class MoveComponentsCommand {
  /**
   * @param {string[]} componentIds - List of component IDs to translate.
   * @param {number} dx - Columns offset delta.
   * @param {number} dy - Rows offset delta.
   * @param {string[]} [wireIds=[]] - List of wire IDs to translate entirely.
   */
  constructor(componentIds, dx, dy, wireIds = []) {
    this.name = 'Move Elements';
    this.componentIds = [...componentIds];
    this.dx = dx;
    this.dy = dy;
    this.wireIds = [...wireIds];
    /** @type {{wireId: string, pointIndex: number}[] | null} */
    this.connectedWirePoints = null;
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    appState.updateProject((project) => {
      // 1. Scan and link connected wire points on the first execute call
      if (this.connectedWirePoints === null) {
        this.connectedWirePoints = [];
        const pinPositions = [];

        this.componentIds.forEach((compId) => {
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
          // If the wire is fully selected to be moved, we don't adjust its individual points
          if (this.wireIds.includes(wire.id)) {
            return;
          }
          wire.points.forEach((pt, ptIdx) => {
            const isConnected = pinPositions.some(pin => pin.x === pt.x && pin.y === pt.y);
            if (isConnected) {
              this.connectedWirePoints.push({
                wireId: wire.id,
                pointIndex: ptIdx
              });
            }
          });
        });
      }

      // 2. Move components
      this.componentIds.forEach((id) => {
        const comp = project.components.find(c => c.id === id);
        if (comp && !comp.locked) {
          comp.gridX += this.dx;
          comp.gridY += this.dy;
        }
      });

      // 3. Move fully selected wires
      this.wireIds.forEach((id) => {
        const wire = project.wires.find(w => w.id === id);
        if (wire) {
          wire.points.forEach((pt) => {
            pt.x += this.dx;
            pt.y += this.dy;
          });
        }
      });

      // 4. Move connected wire points
      this.connectedWirePoints.forEach((conn) => {
        const wire = project.wires.find(w => w.id === conn.wireId);
        if (wire && wire.points[conn.pointIndex]) {
          wire.points[conn.pointIndex].x += this.dx;
          wire.points[conn.pointIndex].y += this.dy;
        }
      });
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      // Revert components
      this.componentIds.forEach((id) => {
        const comp = project.components.find(c => c.id === id);
        if (comp && !comp.locked) {
          comp.gridX -= this.dx;
          comp.gridY -= this.dy;
        }
      });

      // Revert fully selected wires
      this.wireIds.forEach((id) => {
        const wire = project.wires.find(w => w.id === id);
        if (wire) {
          wire.points.forEach((pt) => {
            pt.x -= this.dx;
            pt.y -= this.dy;
          });
        }
      });

      // Revert connected wire points
      if (this.connectedWirePoints) {
        this.connectedWirePoints.forEach((conn) => {
          const wire = project.wires.find(w => w.id === conn.wireId);
          if (wire && wire.points[conn.pointIndex]) {
            wire.points[conn.pointIndex].x -= this.dx;
            wire.points[conn.pointIndex].y -= this.dy;
          }
        });
      }
    });
  }
}

/**
 * Command to rotate selected component instances.
 * @implements {Command}
 */
export class RotateComponentsCommand {
  /**
   * @param {string[]} componentIds - List of component IDs.
   * @param {number} [angleDelta=90] - Delta angle in degrees.
   */
  constructor(componentIds, angleDelta = 90) {
    this.name = 'Rotate Component';
    this.componentIds = [...componentIds];
    this.angleDelta = angleDelta;
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    appState.updateProject((project) => {
      this.componentIds.forEach((id) => {
        const comp = project.components.find(c => c.id === id);
        if (comp && !comp.locked) {
          comp.rotation = (comp.rotation + this.angleDelta) % 360;
        }
      });
    });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      this.componentIds.forEach((id) => {
        const comp = project.components.find(c => c.id === id);
        if (comp && !comp.locked) {
          comp.rotation = (comp.rotation - this.angleDelta + 360) % 360;
        }
      });
    });
  }
}

/**
 * Command to delete one or more component instances from the board.
 * @implements {Command}
 */
export class DeleteComponentsCommand {
  /**
   * @param {string[]} componentIds - List of component IDs.
   */
  constructor(componentIds) {
    this.name = 'Delete Component';
    this.componentIds = [...componentIds];
    /** @type {{index: number, data: Object}[]} */
    this.deletedComponents = [];
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  execute(appState) {
    appState.updateProject((project) => {
      this.deletedComponents = [];
      this.componentIds.forEach((id) => {
        const idx = project.components.findIndex(c => c.id === id);
        if (idx !== -1) {
          this.deletedComponents.push({
            index: idx,
            data: Object.assign({}, project.components[idx])
          });
        }
      });

      // Sort index descending to delete from back to avoid shifting indices
      this.deletedComponents.sort((a, b) => b.index - a.index);
      this.deletedComponents.forEach((item) => {
        project.components.splice(item.index, 1);
      });
    });

    appState.updateSelection({ componentIds: [] });
  }

  /**
   * @param {import('./app-state.js').AppState} appState
   */
  undo(appState) {
    appState.updateProject((project) => {
      // Re-insert ascending order
      const sortedAsc = [...this.deletedComponents].sort((a, b) => a.index - b.index);
      sortedAsc.forEach((item) => {
        project.components.splice(item.index, 0, item.data);
      });
    });

    appState.updateSelection({ componentIds: [...this.componentIds] });
  }
}

/**
 * Command to rename a component instance.
 * @implements {Command}
 */
export class RenameComponentCommand {
  /**
   * @param {string} componentId - Target component ID.
   * @param {string} nextName - New display name.
   */
  constructor(componentId, nextName) {
    this.name = 'Rename Component';
    this.componentId = componentId;
    this.nextName = nextName;
    this.prevName = '';
  }

  execute(appState) {
    appState.updateProject((project) => {
      const comp = project.components.find(c => c.id === this.componentId);
      if (comp) {
        this.prevName = comp.name;
        comp.name = this.nextName;
      }
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      const comp = project.components.find(c => c.id === this.componentId);
      if (comp) comp.name = this.prevName;
    });
  }
}

/**
 * Command to update a component's custom property value.
 * @implements {Command}
 */
export class UpdateComponentPropertyCommand {
  /**
   * @param {string} componentId - Target component ID.
   * @param {string} key - Property key.
   * @param {any} nextValue - New value for the property.
   */
  constructor(componentId, key, nextValue) {
    this.name = 'Update Component Property';
    this.componentId = componentId;
    this.key = key;
    this.nextValue = nextValue;
    this.prevValue = undefined;
  }

  execute(appState) {
    appState.updateProject((project) => {
      const comp = project.components.find(c => c.id === this.componentId);
      if (comp) {
        this.prevValue = comp.properties[this.key];
        comp.properties[this.key] = this.nextValue;
      }
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      const comp = project.components.find(c => c.id === this.componentId);
      if (comp) comp.properties[this.key] = this.prevValue;
    });
  }
}

/**
 * Command to add a wire to the project.
 * @implements {Command}
 */
export class AddWireCommand {
  /**
   * @param {Object|Object[]} wire - Wire data object or array of wire objects.
   */
  constructor(wire) {
    this.name = 'Add Wire';
    if (Array.isArray(wire)) {
      this.wires = wire.map(w => ({ ...w }));
    } else {
      this.wires = [{ ...wire }];
    }
  }

  execute(appState) {
    appState.updateProject((project) => {
      this.wires.forEach((w) => {
        project.wires.push(w);
      });
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      this.wires.forEach((w) => {
        const idx = project.wires.findIndex(x => x.id === w.id);
        if (idx !== -1) project.wires.splice(idx, 1);
      });
    });
  }
}

/**
 * Command to delete one or more wires.
 * @implements {Command}
 */
export class DeleteWiresCommand {
  /**
   * @param {string[]} wireIds - Wire IDs to delete.
   */
  constructor(wireIds) {
    this.name = 'Delete Wires';
    this.wireIds = [...wireIds];
    this.deletedWires = [];
  }

  execute(appState) {
    appState.updateProject((project) => {
      this.deletedWires = [];
      this.wireIds.forEach((id) => {
        const idx = project.wires.findIndex(w => w.id === id);
        if (idx !== -1) {
          this.deletedWires.push({ index: idx, data: { ...project.wires[idx] } });
        }
      });
      this.deletedWires.sort((a, b) => b.index - a.index);
      this.deletedWires.forEach(item => project.wires.splice(item.index, 1));
    });
    appState.updateSelection({ wireIds: [] });
  }

  undo(appState) {
    appState.updateProject((project) => {
      [...this.deletedWires].sort((a, b) => a.index - b.index)
        .forEach(item => project.wires.splice(item.index, 0, item.data));
    });
    appState.updateSelection({ wireIds: [...this.wireIds] });
  }
}

/**
 * Command to update a wire property (color, label, thickness).
 * @implements {Command}
 */
export class UpdateWirePropertyCommand {
  /**
   * @param {string} wireId - Target wire ID.
   * @param {string} key - Property key.
   * @param {any} nextValue - New property value.
   */
  constructor(wireId, key, nextValue) {
    this.name = 'Update Wire';
    this.wireId = wireId;
    this.key = key;
    this.nextValue = nextValue;
    this.prevValue = undefined;
  }

  execute(appState) {
    appState.updateProject((project) => {
      const wire = project.wires.find(w => w.id === this.wireId);
      if (wire) {
        this.prevValue = wire[this.key];
        wire[this.key] = this.nextValue;
      }
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      const wire = project.wires.find(w => w.id === this.wireId);
      if (wire) wire[this.key] = this.prevValue;
    });
  }
}

/**
 * Command to add a free text label.
 * @implements {Command}
 */
export class AddLabelCommand {
  constructor(label) {
    this.name = 'Add Label';
    this.label = { ...label };
  }

  execute(appState) {
    appState.updateProject((project) => {
      project.labels.push(this.label);
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      const idx = project.labels.findIndex(l => l.id === this.label.id);
      if (idx !== -1) project.labels.splice(idx, 1);
    });
  }
}

/**
 * Command to delete selected labels.
 * @implements {Command}
 */
export class DeleteLabelsCommand {
  constructor(labelIds) {
    this.name = 'Delete Labels';
    this.labelIds = [...labelIds];
    this.deletedLabels = [];
  }

  execute(appState) {
    appState.updateProject((project) => {
      this.deletedLabels = [];
      this.labelIds.forEach((id) => {
        const idx = project.labels.findIndex(l => l.id === id);
        if (idx !== -1) {
          this.deletedLabels.push({ index: idx, data: { ...project.labels[idx] } });
        }
      });
      this.deletedLabels.sort((a, b) => b.index - a.index);
      this.deletedLabels.forEach(item => project.labels.splice(item.index, 1));
    });
    appState.updateSelection({ labelIds: [] });
  }

  undo(appState) {
    appState.updateProject((project) => {
      [...this.deletedLabels].sort((a, b) => a.index - b.index)
        .forEach(item => project.labels.splice(item.index, 0, item.data));
    });
    appState.updateSelection({ labelIds: [...this.labelIds] });
  }
}

/**
 * Command to update the copper pad opacity.
 * @implements {Command}
 */
export class UpdatePadOpacityCommand {
  /**
   * @param {number} nextOpacity - Opacity value between 0.0 and 1.0.
   */
  constructor(nextOpacity) {
    this.name = 'Update Pad Opacity';
    this.nextOpacity = nextOpacity;
    this.prevOpacity = 1.0;
  }

  execute(appState) {
    this.prevOpacity = appState.project.board.padOpacity !== undefined ? appState.project.board.padOpacity : 1.0;
    appState.updateProject((project) => {
      project.board.padOpacity = this.nextOpacity;
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      project.board.padOpacity = this.prevOpacity;
    });
  }
}

/**
 * Command to move a single wire vertex to a new snapped grid position.
 * @implements {Command}
 */
export class MoveWirePointCommand {
  /**
   * @param {string} wireId - Target wire ID.
   * @param {number} pointIndex - Index of the vertex inside wire.points[].
   * @param {number} newX - New grid X position.
   * @param {number} newY - New grid Y position.
   */
  constructor(wireId, pointIndex, newX, newY) {
    this.name = 'Move Wire Point';
    this.wireId = wireId;
    this.pointIndex = pointIndex;
    this.newX = newX;
    this.newY = newY;
    this.prevX = 0;
    this.prevY = 0;
  }

  execute(appState) {
    appState.updateProject((project) => {
      const wire = project.wires.find(w => w.id === this.wireId);
      if (wire && wire.points[this.pointIndex]) {
        this.prevX = wire.points[this.pointIndex].x;
        this.prevY = wire.points[this.pointIndex].y;
        wire.points[this.pointIndex].x = this.newX;
        wire.points[this.pointIndex].y = this.newY;
      }
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      const wire = project.wires.find(w => w.id === this.wireId);
      if (wire && wire.points[this.pointIndex]) {
        wire.points[this.pointIndex].x = this.prevX;
        wire.points[this.pointIndex].y = this.prevY;
      }
    });
  }
}

/**
 * Command to duplicate and paste a set of components and wires with a grid offset.
 * @implements {Command}
 */
export class PasteElementsCommand {
  /**
   * @param {Object[]} componentsToCopy - Array of component instances to copy.
   * @param {Object[]} wiresToCopy - Array of wire instances to copy.
   * @param {number} [targetX] - Grid target X (mouse cursor position).
   * @param {number} [targetY] - Grid target Y (mouse cursor position).
   */
  constructor(componentsToCopy = [], wiresToCopy = [], targetX, targetY) {
    this.name = 'Paste Elements';
    
    let deltaX = 2;
    let deltaY = 2;
    
    if (targetX !== undefined && targetY !== undefined) {
      // Find bounding box center of copied elements
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      componentsToCopy.forEach((comp) => {
        minX = Math.min(minX, comp.gridX);
        minY = Math.min(minY, comp.gridY);
        maxX = Math.max(maxX, comp.gridX);
        maxY = Math.max(maxY, comp.gridY);
      });
      
      wiresToCopy.forEach((wire) => {
        wire.points.forEach((pt) => {
          minX = Math.min(minX, pt.x);
          minY = Math.min(minY, pt.y);
          maxX = Math.max(maxX, pt.x);
          maxY = Math.max(maxY, pt.y);
        });
      });
      
      if (minX !== Infinity) {
        const centerX = Math.round((minX + maxX) / 2);
        const centerY = Math.round((minY + maxY) / 2);
        deltaX = targetX - centerX;
        deltaY = targetY - centerY;
      }
    }
    
    this.pastedComponents = componentsToCopy.map((comp) => ({
      id: 'comp_' + Math.random().toString(36).substr(2, 9),
      type: comp.type,
      name: comp.name + '_copy',
      gridX: comp.gridX + deltaX,
      gridY: comp.gridY + deltaY,
      rotation: comp.rotation,
      flipped: comp.flipped,
      locked: comp.locked,
      properties: Object.assign({}, comp.properties)
    }));

    this.pastedWires = wiresToCopy.map((wire) => ({
      id: 'wire_' + Math.random().toString(36).substr(2, 9),
      color: wire.color,
      label: wire.label,
      thickness: wire.thickness,
      points: wire.points.map(pt => ({ x: pt.x + deltaX, y: pt.y + deltaY }))
    }));

    this.prevSelection = null;
  }

  execute(appState) {
    appState.updateProject((project) => {
      this.pastedComponents.forEach(comp => project.components.push(comp));
      this.pastedWires.forEach(wire => project.wires.push(wire));
    });

    this.prevSelection = Object.assign({}, appState.selection);
    appState.updateSelection({
      componentIds: this.pastedComponents.map(c => c.id),
      wireIds: this.pastedWires.map(w => w.id),
      labelIds: []
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      this.pastedComponents.forEach((comp) => {
        const idx = project.components.findIndex(c => c.id === comp.id);
        if (idx !== -1) project.components.splice(idx, 1);
      });
      this.pastedWires.forEach((wire) => {
        const idx = project.wires.findIndex(w => w.id === wire.id);
        if (idx !== -1) project.wires.splice(idx, 1);
      });
    });

    if (this.prevSelection) {
      appState.updateSelection(this.prevSelection);
    }
  }
}

/**
 * Command to move one or more wire vertices.
 * @implements {Command}
 */
export class MoveWirePointsCommand {
  /**
   * @param {{wireId: string, pointIndex: number, newX: number, newY: number, prevX: number, prevY: number}[]} moves
   */
  constructor(moves) {
    this.name = 'Move Connections';
    this.moves = moves.map(m => Object.assign({}, m));
  }

  execute(appState) {
    appState.updateProject((project) => {
      this.moves.forEach((m) => {
        const wire = project.wires.find(w => w.id === m.wireId);
        if (wire && wire.points[m.pointIndex]) {
          wire.points[m.pointIndex].x = m.newX;
          wire.points[m.pointIndex].y = m.newY;
        }
      });
    });
  }

  undo(appState) {
    appState.updateProject((project) => {
      this.moves.forEach((m) => {
        const wire = project.wires.find(w => w.id === m.wireId);
        if (wire && wire.points[m.pointIndex]) {
          wire.points[m.pointIndex].x = m.prevX;
          wire.points[m.pointIndex].y = m.prevY;
        }
      });
    });
  }
}
