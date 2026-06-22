/**
 * @fileoverview AppState class managing core application state and event dispatching.
 */

/**
 * @typedef {Object} BoardState
 * @property {number} width - Board width in grid units.
 * @property {number} height - Board height in grid units.
 * @property {'light' | 'dark'} theme - UI color theme.
 */

/**
 * @typedef {Object} ViewportState
 * @property {number} panX - Viewport offset X in pixels.
 * @property {number} panY - Viewport offset Y in pixels.
 * @property {number} zoom - Viewport scale factor.
 * @property {number} minZoom - Minimum allowable zoom level.
 * @property {number} maxZoom - Maximum allowable zoom level.
 */

/**
 * @typedef {Object} SelectionState
 * @property {string[]} componentIds - Selected component IDs.
 * @property {string[]} wireIds - Selected wire IDs.
 * @property {string[]} labelIds - Selected label IDs.
 */

/**
 * @typedef {Object} ProjectState
 * @property {string} version - File schema version.
 * @property {string} name - Project name.
 * @property {BoardState} board - Board boundary and style configuration.
 * @property {Array} components - List of component instances.
 * @property {Array} wires - List of manual wire connections.
 * @property {Array} labels - List of custom text labels.
 */

export class AppState {
  constructor() {
    /** @type {ProjectState} */
    this.project = {
      version: '1.0.0',
      name: 'Untitled Perfboard',
      board: {
        width: 30,
        height: 20,
        theme: 'dark',
        padOpacity: 1.0
      },
      components: [],
      wires: [],
      labels: []
    };

    /** @type {ViewportState} */
    this.viewport = {
      panX: 0,
      panY: 0,
      zoom: 1.0,
      minZoom: 0.2,
      maxZoom: 5.0
    };

    /** @type {SelectionState} */
    this.selection = {
      componentIds: [],
      wireIds: [],
      labelIds: []
    };

    /** @type {string} */
    this.activeTool = 'select';

    /** @type {Record<string, any>} */
    this.activeToolParams = {};

    /** 
     * Subscription dictionary mapping event names to sets of callback functions.
     * @type {Map<string, Set<Function>>} 
     */
    this.subscribers = new Map();
  }

  /**
   * Subscribe to state change notifications.
   * @param {string} eventType - The state change category (e.g. 'project', 'viewport', 'selection', 'tool').
   * @param {Function} callback - Callback function called when state updates.
   * @returns {Function} Unsubscribe function to release resources.
   */
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      const set = this.subscribers.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(eventType);
        }
      }
    };
  }

  /**
   * Broadcast an event to all subscribers.
   * @param {string} eventType - Event category.
   * @param {any} data - Details of changes.
   */
  emit(eventType, data) {
    const list = this.subscribers.get(eventType);
    if (list) {
      for (const callback of list) {
        try {
          callback(data);
        } catch (err) {
          console.error(`Error in subscriber callback for '${eventType}':`, err);
        }
      }
    }
  }

  /**
   * Replace the active project data. Used during open or new actions.
   * @param {ProjectState} nextProject - The new project structure.
   */
  loadProject(nextProject) {
    const splitWires = [];
    if (Array.isArray(nextProject.wires)) {
      nextProject.wires.forEach((wire) => {
        if (wire.points && wire.points.length > 2) {
          for (let i = 0; i < wire.points.length - 1; i++) {
            splitWires.push({
              id: 'wire_' + Math.random().toString(36).substr(2, 9),
              color: wire.color,
              label: wire.label,
              thickness: wire.thickness,
              points: [
                { x: wire.points[i].x, y: wire.points[i].y },
                { x: wire.points[i + 1].x, y: wire.points[i + 1].y }
              ]
            });
          }
        } else if (wire.points && wire.points.length === 2) {
          splitWires.push(wire);
        }
      });
    }

    this.project = {
      version: nextProject.version || '1.0.0',
      name: nextProject.name || 'Untitled Perfboard',
      board: {
        width: typeof nextProject.board?.width === 'number' ? nextProject.board.width : 30,
        height: typeof nextProject.board?.height === 'number' ? nextProject.board.height : 20,
        theme: nextProject.board?.theme === 'light' ? 'light' : 'dark',
        padOpacity: typeof nextProject.board?.padOpacity === 'number' ? nextProject.board.padOpacity : 1.0
      },
      components: Array.isArray(nextProject.components) ? [...nextProject.components] : [],
      wires: splitWires,
      labels: Array.isArray(nextProject.labels) ? [...nextProject.labels] : []
    };
    
    this.clearSelection();
    this.emit('project', this.project);
    this.emit('change', { type: 'project', data: this.project });
  }

  /**
   * Perform direct modifications on the project structure.
   * Standard way for commands to modify the state store.
   * @param {Function} mutatorFn - Callback function receiving current project state for modification.
   */
  updateProject(mutatorFn) {
    mutatorFn(this.project);
    this.emit('project', this.project);
    this.emit('change', { type: 'project', data: this.project });
  }

  /**
   * Update viewport properties (offsets/zoom).
   * @param {Partial<ViewportState>} nextViewport - Viewport parameters to update.
   */
  updateViewport(nextViewport) {
    Object.assign(this.viewport, nextViewport);
    this.emit('viewport', this.viewport);
  }

  /**
   * Set active cursor tool.
   * @param {string} tool - Tool key (e.g. 'select', 'wire', 'component').
   * @param {Record<string, any>} [params={}] - Options for the tool (e.g. `{ componentType: 'resistor' }`).
   */
  setActiveTool(tool, params = {}) {
    this.activeTool = tool;
    this.activeToolParams = params;
    this.emit('tool', { tool, params });
  }

  /**
   * Update the selected elements.
   * @param {Partial<SelectionState>} selectionUpdate - Lists of component, wire, or label IDs to select.
   */
  updateSelection(selectionUpdate) {
    if (selectionUpdate.componentIds !== undefined) {
      this.selection.componentIds = [...selectionUpdate.componentIds];
    }
    if (selectionUpdate.wireIds !== undefined) {
      this.selection.wireIds = [...selectionUpdate.wireIds];
    }
    if (selectionUpdate.labelIds !== undefined) {
      this.selection.labelIds = [...selectionUpdate.labelIds];
    }
    this.emit('selection', this.selection);
  }

  /**
   * Reset all selections to empty.
   */
  clearSelection() {
    this.selection.componentIds = [];
    this.selection.wireIds = [];
    this.selection.labelIds = [];
    this.emit('selection', this.selection);
  }
}
