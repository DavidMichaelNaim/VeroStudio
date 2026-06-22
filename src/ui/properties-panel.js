/**
 * @fileoverview PropertiesPanel class rendering sidebar panel for editing selected element details.
 */

import { 
  RenameComponentCommand, 
  UpdateComponentPropertyCommand,
  UpdateWirePropertyCommand,
  UpdateProjectNameCommand,
  ResizeBoardCommand,
  RotateComponentsCommand,
  UpdatePadOpacityCommand
} from '../core/commands.js';
import { defaultRegistry } from '../components/registry.js';

export class PropertiesPanel {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state store.
   * @param {import('../core/command-manager.js').CommandManager} commandManager - Command engine.
   * @param {HTMLElement} container - DOM container element.
   */
  constructor(appState, commandManager, container) {
    this.appState = appState;
    this.commandManager = commandManager;
    this.container = container;

    // Subscribe to state change channels to update fields reactively
    this.appState.subscribe('selection', () => this.render());
    this.appState.subscribe('project', () => this.renderOnProjectUpdate());

    this.render();
  }

  /**
   * Guarded rendering to prevent active focus loss on text inputs while editing.
   */
  renderOnProjectUpdate() {
    // Only full redraw if active element is not an input in this panel
    if (
      document.activeElement && 
      this.container.contains(document.activeElement) && 
      document.activeElement.tagName === 'INPUT'
    ) {
      return;
    }
    this.render();
  }

  /**
   * Main render routing based on active selection lists.
   */
  render() {
    this.container.innerHTML = '';
    const selection = this.appState.selection;
    const project = this.appState.project;

    const compCount = selection.componentIds.length;
    const wireCount = selection.wireIds.length;
    const labelCount = selection.labelIds.length;
    const totalCount = compCount + wireCount + labelCount;

    if (totalCount === 0) {
      this.renderBoardProperties(project);
    } else if (compCount === 1 && totalCount === 1) {
      const comp = project.components.find(c => c.id === selection.componentIds[0]);
      if (comp) {
        this.renderComponentProperties(comp);
      } else {
        this.renderBoardProperties(project);
      }
    } else if (wireCount === 1 && totalCount === 1) {
      const wire = project.wires.find(w => w.id === selection.wireIds[0]);
      if (wire) {
        this.renderWireProperties(wire);
      } else {
        this.renderBoardProperties(project);
      }
    } else {
      this.renderMultipleSelectionProperties(selection);
    }
  }

  /**
   * Render editor when nothing is selected (board configuration).
   * @private
   */
  renderBoardProperties(project) {
    const wrapper = document.createElement('div');
    wrapper.className = 'prop-section animate-fade-in';

    const title = document.createElement('div');
    title.className = 'prop-title';
    title.textContent = 'Board Properties';
    wrapper.appendChild(title);

    // Name input
    const gName = this.createFieldGroup('Project Name', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'prop-input';
      input.value = project.name;
      input.addEventListener('change', (e) => {
        const nextVal = e.target.value.trim() || 'Untitled Perfboard';
        if (nextVal !== project.name) {
          this.commandManager.execute(new UpdateProjectNameCommand(nextVal));
        }
      });
      return input;
    });
    wrapper.appendChild(gName);

    // Width & Height input row
    const row = document.createElement('div');
    row.className = 'prop-input-row';

    const gWidth = this.createFieldGroup('Width (Holes)', () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'prop-input';
      input.value = project.board.width;
      input.min = 5;
      input.max = 200;
      input.addEventListener('change', (e) => {
        const val = Math.max(5, Math.min(200, parseInt(e.target.value, 10) || 30));
        if (val !== project.board.width) {
          this.commandManager.execute(new ResizeBoardCommand(val, project.board.height));
        }
      });
      return input;
    });
    row.appendChild(gWidth);

    const gHeight = this.createFieldGroup('Height (Holes)', () => {
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'prop-input';
      input.value = project.board.height;
      input.min = 5;
      input.max = 200;
      input.addEventListener('change', (e) => {
        const val = Math.max(5, Math.min(200, parseInt(e.target.value, 10) || 20));
        if (val !== project.board.height) {
          this.commandManager.execute(new ResizeBoardCommand(project.board.width, val));
        }
      });
      return input;
    });
    row.appendChild(gHeight);
    wrapper.appendChild(row);

    // Pad Opacity input slider
    const padOpacity = project.board.padOpacity !== undefined ? project.board.padOpacity : 1.0;
    const gOpacity = this.createFieldGroup(`Holes Opacity: ${Math.round(padOpacity * 100)}%`, (headerLabel) => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 0;
      slider.max = 100;
      slider.value = Math.round(padOpacity * 100);
      slider.style.width = '100%';
      
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        headerLabel.textContent = `Holes Opacity: ${val}%`;
      });
      
      slider.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10) / 100;
        if (Math.abs(val - padOpacity) > 0.01) {
          this.commandManager.execute(new UpdatePadOpacityCommand(val));
        }
      });
      return slider;
    });
    wrapper.appendChild(gOpacity);

    this.container.appendChild(wrapper);
  }

  /**
   * Render editor for a single selected Component.
   * @private
   */
  renderComponentProperties(comp) {
    const wrapper = document.createElement('div');
    wrapper.className = 'prop-section animate-fade-in';

    const title = document.createElement('div');
    title.className = 'prop-title';
    title.textContent = `${comp.type.toUpperCase()} Properties`;
    wrapper.appendChild(title);

    // Editable Name Label
    const gName = this.createFieldGroup('Designator', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'prop-input';
      input.value = comp.name;
      input.addEventListener('change', (e) => {
        const nextVal = e.target.value.trim();
        if (nextVal && nextVal !== comp.name) {
          this.commandManager.execute(new RenameComponentCommand(comp.id, nextVal));
        }
      });
      return input;
    });
    wrapper.appendChild(gName);

    // Type (static)
    const gType = this.createFieldGroup('Type', () => {
      const el = document.createElement('div');
      el.style.fontSize = '0.85rem';
      el.style.color = 'var(--text-secondary)';
      el.style.padding = '4px 0';
      el.textContent = comp.type.toUpperCase();
      return el;
    });
    wrapper.appendChild(gType);

    // Value custom property
    if (comp.properties.value !== undefined) {
      const gVal = this.createFieldGroup('Value', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'prop-input';
        input.value = comp.properties.value;
        input.addEventListener('change', (e) => {
          const nextVal = e.target.value.trim();
          if (nextVal !== comp.properties.value) {
            this.commandManager.execute(new UpdateComponentPropertyCommand(comp.id, 'value', nextVal));
          }
        });
        return input;
      });
      wrapper.appendChild(gVal);
    }

    // Color property (LED specific)
    if (comp.properties.color !== undefined) {
      const gColor = this.createFieldGroup('LED Color', () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.className = 'prop-input';
        input.style.height = '36px';
        input.style.padding = '2px';
        input.value = comp.properties.color;
        input.addEventListener('change', (e) => {
          const nextVal = e.target.value;
          if (nextVal !== comp.properties.color) {
            this.commandManager.execute(new UpdateComponentPropertyCommand(comp.id, 'color', nextVal));
          }
        });
        return input;
      });
      wrapper.appendChild(gColor);
    }

    // Pin Labels Editor
    if (comp.properties && Array.isArray(comp.properties.pinLabels)) {
      const pinSectionTitle = document.createElement('div');
      pinSectionTitle.className = 'toolbox-section-title';
      pinSectionTitle.textContent = 'Pin Labels';
      wrapper.appendChild(pinSectionTitle);

      const pinsContainer = document.createElement('div');
      pinsContainer.style.display = 'flex';
      pinsContainer.style.flexDirection = 'column';
      pinsContainer.style.gap = '8px';
      pinsContainer.style.marginBottom = '8px';

      const def = defaultRegistry.get(comp.type);
      const pins = def?.pins || [];

      comp.properties.pinLabels.forEach((label, idx) => {
        const pinDef = pins[idx];
        const pinName = pinDef ? (pinDef.id === pinDef.label ? `Pin ${pinDef.id}` : `Pin ${pinDef.id} (${pinDef.label})`) : `Pin ${idx + 1}`;
        
        const gPin = this.createFieldGroup(pinName, () => {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'prop-input';
          input.value = label;
          input.addEventListener('change', (e) => {
            const nextVal = e.target.value.trim();
            if (nextVal !== comp.properties.pinLabels[idx]) {
              const newLabels = [...comp.properties.pinLabels];
              newLabels[idx] = nextVal;
              this.commandManager.execute(new UpdateComponentPropertyCommand(comp.id, 'pinLabels', newLabels));
            }
          });
          return input;
        });
        pinsContainer.appendChild(gPin);
      });
      wrapper.appendChild(pinsContainer);
    }

    // Coordinates X/Y Display
    const gCoords = this.createFieldGroup('Grid Coordinate', () => {
      const el = document.createElement('div');
      el.style.fontSize = '0.85rem';
      el.style.color = 'var(--text-secondary)';
      el.style.padding = '4px 0';
      el.textContent = `X: ${comp.gridX}, Y: ${comp.gridY}`;
      return el;
    });
    wrapper.appendChild(gCoords);

    // Rotation Control Button
    const rotateBtn = document.createElement('button');
    rotateBtn.className = 'btn prop-row-btn';
    rotateBtn.innerHTML = '🔄 Rotate 90°';
    rotateBtn.addEventListener('click', () => {
      this.commandManager.execute(new RotateComponentsCommand([comp.id], 90));
    });
    wrapper.appendChild(rotateBtn);

    this.container.appendChild(wrapper);
  }

  /**
   * Render editor for a single selected Wire.
   * @private
   */
  renderWireProperties(wire) {
    const wrapper = document.createElement('div');
    wrapper.className = 'prop-section animate-fade-in';

    const title = document.createElement('div');
    title.className = 'prop-title';
    title.textContent = 'Wire Properties';
    wrapper.appendChild(title);

    // Label text
    const gLabel = this.createFieldGroup('Wire Label', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'prop-input';
      input.value = wire.label || '';
      input.placeholder = 'e.g. VCC, GND';
      input.addEventListener('change', (e) => {
        const nextVal = e.target.value.trim();
        if (nextVal !== wire.label) {
          this.commandManager.execute(new UpdateWirePropertyCommand(wire.id, 'label', nextVal));
        }
      });
      return input;
    });
    wrapper.appendChild(gLabel);

    // Thickness Slider
    const gThickness = this.createFieldGroup(`Thickness: ${wire.thickness}px`, (headerLabel) => {
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = 1;
      slider.max = 8;
      slider.value = wire.thickness;
      slider.style.width = '100%';
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        headerLabel.textContent = `Thickness: ${val}px`;
      });
      slider.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (val !== wire.thickness) {
          this.commandManager.execute(new UpdateWirePropertyCommand(wire.id, 'thickness', val));
        }
      });
      return slider;
    });
    wrapper.appendChild(gThickness);

    // Color Swatches
    const swatches = [
      { name: 'Red', hex: '#ef4444' },
      { name: 'Blue', hex: '#3b82f6' },
      { name: 'Green', hex: '#10b981' },
      { name: 'Yellow', hex: '#f59e0b' },
      { name: 'Orange', hex: '#f97316' },
      { name: 'Black', hex: '#1e293b' },
      { name: 'White', hex: '#f8fafc' }
    ];

    const gColor = this.createFieldGroup('Wire Color', () => {
      const colorContainer = document.createElement('div');
      
      const grid = document.createElement('div');
      grid.className = 'color-picker-grid';

      swatches.forEach((sw) => {
        const sEl = document.createElement('div');
        sEl.className = `color-swatch ${wire.color === sw.hex ? 'active' : ''}`;
        sEl.style.backgroundColor = sw.hex;
        sEl.title = sw.name;
        sEl.addEventListener('click', () => {
          if (wire.color !== sw.hex) {
            this.commandManager.execute(new UpdateWirePropertyCommand(wire.id, 'color', sw.hex));
          }
        });
        grid.appendChild(sEl);
      });

      // Custom color picker input element
      const customEl = document.createElement('input');
      customEl.type = 'color';
      customEl.style.padding = '0';
      customEl.style.border = 'none';
      customEl.style.height = '24px';
      customEl.style.width = '100%';
      customEl.style.cursor = 'pointer';
      customEl.style.borderRadius = '4px';
      customEl.value = swatches.some(s => s.hex === wire.color) ? '#000000' : wire.color;
      customEl.title = 'Custom Color';
      customEl.addEventListener('change', (e) => {
        const nextVal = e.target.value;
        if (nextVal !== wire.color) {
          this.commandManager.execute(new UpdateWirePropertyCommand(wire.id, 'color', nextVal));
        }
      });
      grid.appendChild(customEl);

      colorContainer.appendChild(grid);
      return colorContainer;
    });
    wrapper.appendChild(gColor);

    this.container.appendChild(wrapper);
  }

  /**
   * Render generic details for multiple active selected elements.
   * @private
   */
  renderMultipleSelectionProperties(selection) {
    const wrapper = document.createElement('div');
    wrapper.className = 'prop-section animate-fade-in';

    const title = document.createElement('div');
    title.className = 'prop-title';
    title.textContent = 'Selection Info';
    wrapper.appendChild(title);

    const list = document.createElement('div');
    list.style.fontSize = '0.85rem';
    list.style.color = 'var(--text-secondary)';
    list.style.lineHeight = '1.6';

    if (selection.componentIds.length > 0) {
      const item = document.createElement('div');
      item.textContent = `Components Selected: ${selection.componentIds.length}`;
      list.appendChild(item);
    }
    if (selection.wireIds.length > 0) {
      const item = document.createElement('div');
      item.textContent = `Wires Selected: ${selection.wireIds.length}`;
      list.appendChild(item);
    }
    if (selection.labelIds.length > 0) {
      const item = document.createElement('div');
      item.textContent = `Labels Selected: ${selection.labelIds.length}`;
      list.appendChild(item);
    }

    wrapper.appendChild(list);

    // Multi delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn prop-row-btn';
    deleteBtn.style.backgroundColor = 'var(--danger-color)';
    deleteBtn.style.color = '#ffffff';
    deleteBtn.style.borderColor = 'transparent';
    deleteBtn.textContent = '🗑 Delete Selection';
    deleteBtn.addEventListener('click', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    });
    wrapper.appendChild(deleteBtn);

    this.container.appendChild(wrapper);
  }

  /**
   * Helper to build a labeled row segment.
   * @private
   */
  createFieldGroup(labelText, fieldBuilder) {
    const group = document.createElement('div');
    group.className = 'prop-group';

    const label = document.createElement('label');
    label.className = 'prop-label';
    label.textContent = labelText;
    group.appendChild(label);

    const element = fieldBuilder(label);
    group.appendChild(element);

    return group;
  }
}
