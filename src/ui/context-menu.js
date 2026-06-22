/**
 * @fileoverview ContextMenu class showing options on canvas right click.
 */

import { ComponentModel } from '../models/component-model.js';
import { defaultRegistry } from '../components/registry.js';
import { WireModel } from '../models/wire-model.js';
import { 
  RotateComponentsCommand, 
  DeleteComponentsCommand, 
  DeleteWiresCommand 
} from '../core/commands.js';

export class ContextMenu {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state store.
   * @param {import('../core/command-manager.js').CommandManager} commandManager - Command engine.
   * @param {import('../canvas/canvas-controller.js').CanvasController} canvasController - Canvas controller.
   */
  constructor(appState, commandManager, canvasController) {
    this.appState = appState;
    this.commandManager = commandManager;
    this.canvasController = canvasController;
    /** @type {HTMLDivElement | null} */
    this.menuEl = null;

    this.init();
  }

  /**
   * Initialize DOM element structure and listeners.
   */
  init() {
    this.menuEl = document.createElement('div');
    this.menuEl.className = 'context-menu';
    this.menuEl.style.position = 'absolute';
    this.menuEl.style.display = 'none';
    this.menuEl.style.zIndex = '1000';
    document.body.appendChild(this.menuEl);

    // Hide context menu on normal click anywhere or window blur
    window.addEventListener('click', () => this.hide());
    window.addEventListener('blur', () => this.hide());

    const canvas = this.canvasController.canvas;
    if (canvas) {
      canvas.addEventListener('contextmenu', (e) => this.show(e));
    }
  }

  /**
   * Render and show context menu at click coordinate position.
   * @param {MouseEvent} e - DOM event.
   */
  show(e) {
    e.preventDefault();
    this.hide();

    const canvas = this.canvasController.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert click coordinates to grid coordinates to detect item hits
    const gridPos = this.canvasController.viewport.screenToGrid(mouseX, mouseY);
    this.autoSelectAt(gridPos.x, gridPos.y);

    this.buildMenu();

    this.menuEl.style.display = 'block';

    const menuWidth = this.menuEl.offsetWidth || 160;
    const menuHeight = this.menuEl.offsetHeight || 120;
    
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 8;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 8;
    }

    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
  }

  /**
   * Hide the menu container.
   */
  hide() {
    if (this.menuEl) {
      this.menuEl.style.display = 'none';
    }
  }

  /**
   * Auto select component or wire under cursor if not already in selection.
   * @private
   */
  autoSelectAt(gridX, gridY) {
    const project = this.appState.project;
    const selection = this.appState.selection;

    // 1. Component hit test
    let hitComp = null;
    for (let i = project.components.length - 1; i >= 0; i--) {
      const comp = project.components[i];
      const def = defaultRegistry.get(comp.type);
      if (def && ComponentModel.hitTest(comp, def, gridX, gridY)) {
        hitComp = comp;
        break;
      }
    }

    if (hitComp) {
      if (!selection.componentIds.includes(hitComp.id)) {
        this.appState.updateSelection({ componentIds: [hitComp.id], wireIds: [], labelIds: [] });
      }
      return;
    }

    // 2. Wire hit test
    let hitWire = null;
    for (let i = project.wires.length - 1; i >= 0; i--) {
      const wire = project.wires[i];
      if (WireModel.hitTest(wire, gridX, gridY, 0.4)) {
        hitWire = wire;
        break;
      }
    }

    if (hitWire) {
      if (!selection.wireIds.includes(hitWire.id)) {
        this.appState.updateSelection({ componentIds: [], wireIds: [hitWire.id], labelIds: [] });
      }
      return;
    }
  }

  /**
   * Re-assemble menu list items dynamically based on selection.
   * @private
   */
  buildMenu() {
    this.menuEl.innerHTML = '';
    const selection = this.appState.selection;

    const compCount = selection.componentIds.length;
    const wireCount = selection.wireIds.length;
    const totalCount = compCount + wireCount;

    const ul = document.createElement('ul');
    ul.className = 'context-menu-list';

    if (compCount > 0) {
      const rotateItem = this.createMenuItem('🔄 Rotate 90°', () => {
        this.commandManager.execute(new RotateComponentsCommand(selection.componentIds, 90));
      });
      ul.appendChild(rotateItem);
    }

    if (totalCount > 0) {
      const deleteItem = this.createMenuItem('🗑 Delete', () => {
        if (selection.componentIds.length > 0) {
          this.commandManager.execute(new DeleteComponentsCommand(selection.componentIds));
        }
        if (selection.wireIds.length > 0) {
          this.commandManager.execute(new DeleteWiresCommand(selection.wireIds));
        }
      });
      ul.appendChild(deleteItem);

      const clearItem = this.createMenuItem('🚫 Clear Selection', () => {
        this.appState.clearSelection();
      });
      ul.appendChild(clearItem);

      const sep = document.createElement('li');
      sep.className = 'context-menu-separator';
      ul.appendChild(sep);
    }

    // History controls
    const undoItem = this.createMenuItem('↩ Undo', () => {
      this.commandManager.undo();
    });
    if (!this.commandManager.canUndo()) undoItem.classList.add('disabled');
    ul.appendChild(undoItem);

    const redoItem = this.createMenuItem('↪ Redo', () => {
      this.commandManager.redo();
    });
    if (!this.commandManager.canRedo()) redoItem.classList.add('disabled');
    ul.appendChild(redoItem);

    this.menuEl.appendChild(ul);
  }

  /**
   * Helper to create a styled menu list item.
   * @private
   */
  createMenuItem(text, onClick) {
    const li = document.createElement('li');
    li.className = 'context-menu-item';
    li.textContent = text;
    li.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
      this.hide();
    });
    return li;
  }
}
