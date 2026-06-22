import { AppState } from './core/app-state.js';
import { CommandManager } from './core/command-manager.js';
import { 
  ResizeBoardCommand, 
  UpdateProjectNameCommand, 
  SetThemeCommand,
  MoveComponentsCommand,
  RotateComponentsCommand,
  DeleteComponentsCommand,
  DeleteWiresCommand,
  PasteElementsCommand
} from './core/commands.js';
import { CanvasController } from './canvas/canvas-controller.js';
import { ToolManager } from './tools/tool-manager.js';
import { SelectTool } from './tools/select-tool.js';
import { WireTool } from './tools/wire-tool.js';
import { ComponentTool } from './tools/component-tool.js';

import { Toolbox } from './ui/toolbox.js';
import { PropertiesPanel } from './ui/properties-panel.js';
import { ContextMenu } from './ui/context-menu.js';
import { StatusBar } from './ui/status-bar.js';
import { serializeProject, downloadJSON, loadJSONFromFile, exportPNG } from './utils/file.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Core State & Command Initialization
  const appState = new AppState();
  const commandManager = new CommandManager(appState);

  // 1b. Canvas Engine Initialization
  const canvasElement = document.getElementById('main-canvas');
  const canvasController = new CanvasController(appState);
  if (canvasElement) {
    canvasController.initialize(canvasElement);
  }

  // 1c. Tool System Setup
  const toolManager = new ToolManager(appState, commandManager, canvasController.viewport);
  const selectTool = new SelectTool(appState, commandManager);
  const wireTool = new WireTool(appState, commandManager);
  const componentTool = new ComponentTool(appState, commandManager);
  toolManager.registerTool('select', selectTool);
  toolManager.registerTool('wire', wireTool);
  toolManager.registerTool('component', componentTool);
  toolManager.setTool('select');
  
  canvasController.toolManager = toolManager;

  // Initialize UI components
  let toolbox = null;
  const leftPanel = document.getElementById('left-panel');
  if (leftPanel) {
    const content = leftPanel.querySelector('.panel-content');
    if (content) {
      toolbox = new Toolbox(appState, content);
    }
  }

  let propertiesPanel = null;
  const rightPanel = document.getElementById('right-panel');
  if (rightPanel) {
    const content = rightPanel.querySelector('.panel-content');
    if (content) {
      propertiesPanel = new PropertiesPanel(appState, commandManager, content);
    }
  }

  let statusBar = null;
  const statusBarContainer = document.getElementById('status-bar');
  if (statusBarContainer) {
    statusBar = new StatusBar(appState, statusBarContainer);
  }

  const contextMenu = new ContextMenu(appState, commandManager, canvasController);

  // 2. DOM Elements Selection for Header Controls
  const btnNew = document.getElementById('btn-new');
  const btnOpen = document.getElementById('btn-open');
  const btnSave = document.getElementById('btn-save');
  const btnImportJson = document.getElementById('btn-import-json');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnExportPng = document.getElementById('btn-export-png');
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  // PNG Export Modal elements
  const exportModal = document.getElementById('export-png-modal');
  const exportConfirmBtn = document.getElementById('export-png-confirm');
  const exportCancelBtn = document.getElementById('export-png-cancel');
  const exportTransparentBg = document.getElementById('export-transparent-bg');

  /** Helper: get selected PNG scale from modal radios */
  function getSelectedExportScale() {
    const radios = document.querySelectorAll('input[name="export-scale"]');
    for (const radio of radios) {
      if (radio.checked) return parseInt(radio.value, 10);
    }
    return 2; // Default 2× High-DPI
  }

  // 3. Sync State -> UI Event Subscriptions

  // Handle Board Theme changes on document root
  appState.subscribe('project', (project) => {
    const theme = project.board.theme;
    document.documentElement.setAttribute('data-theme', theme);
  });

  // Handle Command History Changes (Enable/Disable Header Buttons)
  appState.subscribe('history', (historyInfo) => {
    if (historyInfo.canUndo) {
      btnUndo?.classList.remove('btn-disabled');
    } else {
      btnUndo?.classList.add('btn-disabled');
    }

    if (historyInfo.canRedo) {
      btnRedo?.classList.remove('btn-disabled');
    } else {
      btnRedo?.classList.add('btn-disabled');
    }
  });

  // 4. Header Actions Event Listeners

  // Undo button click
  btnUndo?.addEventListener('click', () => {
    commandManager.undo();
  });

  // Redo button click
  btnRedo?.addEventListener('click', () => {
    commandManager.redo();
  });

  // Theme switch button click
  btnThemeToggle?.addEventListener('click', () => {
    const currentTheme = appState.project.board.theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    commandManager.execute(new SetThemeCommand(nextTheme));
  });

  // New Project button click
  btnNew?.addEventListener('click', () => {
    if (confirm('Create a new project? Any unsaved changes will be lost.')) {
      commandManager.clear();
      const newProj = {
        version: '1.0.0',
        name: 'Untitled Perfboard',
        board: {
          width: 30,
          height: 20,
          theme: appState.project.board.theme
        },
        components: [],
        wires: [],
        labels: []
      };
      appState.loadProject(newProj);
      localStorage.setItem('verostudio_autosave', JSON.stringify(newProj));
    }
  });

  // Open Project button click
  btnOpen?.addEventListener('click', () => {
    loadJSONFromFile()
      .then((parsed) => {
        commandManager.clear();
        appState.loadProject(parsed);
        localStorage.setItem('verostudio_autosave', JSON.stringify(parsed));
      })
      .catch((err) => {
        if (err.message !== 'No file selected') {
          alert('Error loading file: ' + err.message);
        }
      });
  });

  // Save Project button click — download .vero JSON
  btnSave?.addEventListener('click', () => {
    const serialized = serializeProject(appState);
    const filename = (appState.project.name || 'Untitled_Perfboard').replace(/[^a-z0-9_-]/gi, '_') + '.vero';
    downloadJSON(serialized, filename);
  });

  // Import JSON button click — open a .json/.vero file and load it
  btnImportJson?.addEventListener('click', () => {
    loadJSONFromFile()
      .then((parsed) => {
        commandManager.clear();
        appState.loadProject(parsed);
        localStorage.setItem('verostudio_autosave', JSON.stringify(parsed));
        console.log('Project imported from JSON file.');
      })
      .catch((err) => {
        if (err.message !== 'No file selected') {
          alert('Error importing JSON: ' + err.message);
        }
      });
  });

  // Export JSON button click — download .json (identical to .vero but with .json extension)
  btnExportJson?.addEventListener('click', () => {
    const serialized = serializeProject(appState);
    const filename = (appState.project.name || 'Untitled_Perfboard').replace(/[^a-z0-9_-]/gi, '_') + '.json';
    downloadJSON(serialized, filename);
  });

  // Export PNG button click — open resolution modal
  btnExportPng?.addEventListener('click', () => {
    if (exportModal) exportModal.style.display = 'flex';
  });

  // Modal: Cancel
  exportCancelBtn?.addEventListener('click', () => {
    if (exportModal) exportModal.style.display = 'none';
  });

  // Modal: Confirm Download
  exportConfirmBtn?.addEventListener('click', () => {
    const scale = getSelectedExportScale();
    const transparent = exportTransparentBg ? exportTransparentBg.checked : false;
    if (exportModal) exportModal.style.display = 'none';
    exportPNG(appState, { scale, transparentBg: transparent });
  });

  // Close modal when clicking backdrop
  exportModal?.addEventListener('click', (e) => {
    if (e.target === exportModal) exportModal.style.display = 'none';
  });

  // Escape key closes modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && exportModal && exportModal.style.display !== 'none') {
      exportModal.style.display = 'none';
    }
  }, { capture: false });

  // Clipboard state for copy/paste
  let clipboard = { components: [], wires: [] };
  let lastMouseGridX = 0;
  let lastMouseGridY = 0;

  // Keyboard shortcut bounds listener
  let isSpacePressed = false;
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement === document.body) {
      const drawingWire = appState.activeTool === 'wire' && wireTool.points.length > 0;
      if (!drawingWire) {
        isSpacePressed = true;
        e.preventDefault();
      }
    }

    // Delegate to active tool keydown handler if defined
    if (toolManager.activeTool && typeof toolManager.activeTool.onKeyDown === 'function') {
      toolManager.activeTool.onKeyDown(e);
    }

    // Hotkeys active when NOT typing in input elements
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      // 'V' / 'ر' -> Switch to Move Tool (Select)
      if ((e.key === 'v' || e.key === 'V' || e.key === 'ر') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toolManager.setTool('select');
      }

      // 'W' / 'ص' -> Switch to Wire Tool
      if ((e.key === 'w' || e.key === 'W' || e.key === 'ص') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toolManager.setTool('wire');
      }

      // 'R' -> Rotate selected component(s)
      if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        if (appState.selection.componentIds.length > 0) {
          e.preventDefault();
          commandManager.execute(new RotateComponentsCommand(appState.selection.componentIds, 90));
        }
      }
      
      // 'Delete' / 'Backspace' -> Remove selected components and wires
      if (e.key === 'Delete' || e.key === 'Backspace') {
        let deletedSomething = false;
        if (appState.selection.componentIds.length > 0) {
          e.preventDefault();
          commandManager.execute(new DeleteComponentsCommand(appState.selection.componentIds));
          deletedSomething = true;
        }
        if (appState.selection.wireIds.length > 0) {
          e.preventDefault();
          commandManager.execute(new DeleteWiresCommand(appState.selection.wireIds));
          deletedSomething = true;
        }
      }
    }

    // Detect OS: cmd on mac, ctrl on windows
    const modifier = e.metaKey || e.ctrlKey;
    if (modifier && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          commandManager.redo(); // Ctrl + Shift + Z
        } else {
          commandManager.undo(); // Ctrl + Z
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        commandManager.redo(); // Ctrl + Y
      } else if (e.key.toLowerCase() === 'c') {
        const sel = appState.selection;
        const project = appState.project;
        
        const compsToCopy = project.components.filter(c => sel.componentIds.includes(c.id));
        const wiresToCopy = project.wires.filter(w => sel.wireIds.includes(w.id));
        
        if (compsToCopy.length > 0 || wiresToCopy.length > 0) {
          e.preventDefault();
          clipboard = {
            components: compsToCopy,
            wires: wiresToCopy
          };
          console.log(`Copied ${compsToCopy.length} components and ${wiresToCopy.length} wires.`);
        }
      } else if (e.key.toLowerCase() === 'v') {
        if (clipboard.components.length > 0 || clipboard.wires.length > 0) {
          e.preventDefault();
          commandManager.execute(new PasteElementsCommand(clipboard.components, clipboard.wires, lastMouseGridX, lastMouseGridY));
          console.log('Pasted elements.');
        }
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      isSpacePressed = false;
    }
  });

  // Viewport Pan/Zoom and Tool Interaction Mouse Bindings
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  canvasElement?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  canvasElement?.addEventListener('mousedown', (e) => {
    // Pan trigger: middle click (button 1) OR spacebar + left click (button 0)
    if (e.button === 1 || (e.button === 0 && isSpacePressed)) {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      canvasElement.style.cursor = 'grabbing';
      e.preventDefault();
    } else if (e.button === 0) {
      // Normal Left click -> Pass to active tool
      const rect = canvasElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const gridPos = canvasController.viewport.screenToGrid(mouseX, mouseY);
      toolManager.handleMouseDown(e, gridPos.x, gridPos.y);
    }
  });

  canvasElement?.addEventListener('mousemove', (e) => {
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPanning) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      canvasController.viewport.pan(dx, dy);
      startX = e.clientX;
      startY = e.clientY;
    } else {
      // Normal move -> Pass to active tool
      const gridPos = canvasController.viewport.screenToGrid(mouseX, mouseY);
      toolManager.handleMouseMove(e, gridPos.x, gridPos.y);
    }

    // Update coordinate tracking display in status bar
    const gridPos = canvasController.viewport.screenToGrid(mouseX, mouseY);
    const snapped = canvasController.viewport.snapToGrid(gridPos.x, gridPos.y);
    lastMouseGridX = snapped.x;
    lastMouseGridY = snapped.y;
    if (statusBar) {
      statusBar.setCoordinates(snapped.x, snapped.y);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (isPanning) {
      isPanning = false;
      if (canvasElement) {
        canvasElement.style.cursor = 'default';
      }
    } else {
      // Pass to active tool
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridPos = canvasController.viewport.screenToGrid(mouseX, mouseY);
        toolManager.handleMouseUp(e, gridPos.x, gridPos.y);
      }
    }
  });

  canvasElement?.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom in on wheel up, zoom out on wheel down
    const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    const nextZoom = canvasController.viewport.zoom * zoomFactor;
    
    canvasController.viewport.zoomTo(nextZoom, mouseX, mouseY);
  }, { passive: false });


  // 5. Initial Boot Sync Trigger
  const autosaved = localStorage.getItem('verostudio_autosave');
  if (autosaved) {
    try {
      const parsed = JSON.parse(autosaved);
      appState.loadProject(parsed);
      console.log('Restored project from autosave.');
    } catch (err) {
      console.error('Failed to load autosaved project:', err);
      appState.loadProject(appState.project);
    }
  } else {
    appState.loadProject(appState.project);
  }

  // Setup Autosave Interval (every 30 seconds)
  setInterval(() => {
    try {
      const serialized = serializeProject(appState);
      localStorage.setItem('verostudio_autosave', JSON.stringify(serialized));
      console.log('Project autosaved.');
    } catch (err) {
      console.error('Failed to autosave:', err);
    }
  }, 30000);
  
  // Expose instances globally ONLY for developer console debugging and tests
  window.__VeroStudio__ = {
    appState,
    commandManager,
    canvasController,
    toolManager
  };

  console.log('VeroStudio fully initialized — all 10 phases complete.');
});

