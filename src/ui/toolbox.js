/**
 * @fileoverview Toolbox class rendering left sidebar buttons for selecting modes and components.
 */

export class Toolbox {
  /**
   * @param {import('../core/app-state.js').AppState} appState - Global state store.
   * @param {HTMLElement} container - DOM container element.
   */
  constructor(appState, container) {
    this.appState = appState;
    this.container = container;
    /** @type {Map<string, HTMLButtonElement>} */
    this.buttons = new Map();

    this.render();
    
    // Subscribe to tool changes to keep active highlights correct
    this.appState.subscribe('tool', ({ tool, params }) => this.updateActiveButton(tool, params));
    this.updateActiveButton(this.appState.activeTool, this.appState.activeToolParams);
  }

  /**
   * Render the toolbox button lists.
   */
  render() {
    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'toolbox-list';

    // 1. Core Editor Tools
    const coreTitle = document.createElement('div');
    coreTitle.className = 'toolbox-section-title';
    coreTitle.textContent = 'Tools';
    wrapper.appendChild(coreTitle);

    const selectBtn = this.createToolButton('select', '↖', 'Move Tool  [V]', () => {
      this.appState.setActiveTool('select');
    });
    wrapper.appendChild(selectBtn);
    this.buttons.set('select', selectBtn);

    const wireBtn = this.createToolButton('wire', '⚡', 'Wire Tool  [W]', () => {
      this.appState.setActiveTool('wire');
    });
    wrapper.appendChild(wireBtn);
    this.buttons.set('wire', wireBtn);

    // 2. Component Placement
    const categories = {
      'Resistors': [
        { type: 'resistor_sm', icon: '▰', name: 'Resistor (1/4W)' },
        { type: 'resistor_lg', icon: '▰', name: 'Resistor (1W)' },
        { type: 'res_ceramic', icon: '▰', name: 'Ceramic Resistor' }
      ],
      'Capacitors': [
        { type: 'cap_elec_sm', icon: '╍', name: 'Electrolytic Cap (SM)' },
        { type: 'cap_elec_lg', icon: '╍', name: 'Electrolytic Cap (LG)' },
        { type: 'cap_ceramic_sm', icon: '╍', name: 'Ceramic Cap (SM)' },
        { type: 'cap_ceramic_lg', icon: '╍', name: 'Ceramic Cap (LG)' }
      ],
      'Diodes': [
        { type: 'diode', icon: '▶', name: 'Diode' },
        { type: 'zener', icon: '▶', name: 'Zener Diode' },
        { type: 'led', icon: '🚨', name: 'LED' }
      ],
      'ICs': [
        { type: 'ic_dip4', icon: '█', name: 'IC (DIP-4)' },
        { type: 'ic_dip8', icon: '█', name: 'IC (DIP-8)' },
        { type: 'ic_dip16', icon: '█', name: 'IC (DIP-16)' }
      ],
      'Transistors': [
        { type: 'transistor_bjt', icon: '⏃', name: 'Transistor (BJT)' },
        { type: 'mosfet', icon: '⏃', name: 'MOSFET' }
      ]
    };

    Object.entries(categories).forEach(([catName, list]) => {
      const catTitle = document.createElement('div');
      catTitle.className = 'toolbox-section-title';
      catTitle.textContent = catName;
      wrapper.appendChild(catTitle);

      list.forEach((c) => {
        const btnKey = `component:${c.type}`;
        const btn = this.createToolButton(btnKey, c.icon, c.name, () => {
          this.appState.setActiveTool('component', { componentType: c.type });
        });
        wrapper.appendChild(btn);
        this.buttons.set(btnKey, btn);
      });
    });

    this.container.appendChild(wrapper);
  }

  /**
   * Helper to create a styled tool button.
   * @private
   */
  createToolButton(key, icon, label, onClick) {
    const btn = document.createElement('button');
    btn.className = 'toolbox-btn';
    btn.setAttribute('data-tool-key', key);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toolbox-icon';
    iconSpan.textContent = icon;
    btn.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'toolbox-btn-label';
    labelSpan.textContent = label;
    btn.appendChild(labelSpan);

    btn.addEventListener('click', onClick);
    return btn;
  }

  /**
   * Synchronize active button CSS classes with AppState active tool.
   * @param {string} tool - Tool key name.
   * @param {Record<string, any>} params - Tool params.
   */
  updateActiveButton(tool, params) {
    this.buttons.forEach(btn => btn.classList.remove('active'));

    let activeKey = tool;
    if (tool === 'component' && params && params.componentType) {
      activeKey = `component:${params.componentType}`;
    }

    const activeBtn = this.buttons.get(activeKey);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
}
