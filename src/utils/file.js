/**
 * @fileoverview File utility functions for project serialization, downloading, loading, and PNG exporting.
 */

import { GridRenderer } from '../canvas/grid-renderer.js';
import { WiresRenderer, ComponentsRenderer } from '../canvas/renderers.js';

/**
 * Serialize the active AppState project into a clean schema JSON object.
 * @param {import('../core/app-state.js').AppState} appState - Global state store.
 * @returns {Object} JSON-serializable project data structure.
 */
export function serializeProject(appState) {
  const project = appState.project;
  return {
    version: '1.0.0',
    name: project.name || 'Untitled Perfboard',
    board: {
      width: project.board.width,
      height: project.board.height,
      theme: project.board.theme,
      padOpacity: project.board.padOpacity !== undefined ? project.board.padOpacity : 1.0
    },
    components: project.components.map(c => ({
      id: c.id,
      type: c.type,
      name: c.name,
      gridX: c.gridX,
      gridY: c.gridY,
      rotation: c.rotation,
      flipped: c.flipped,
      locked: c.locked,
      properties: Object.assign({}, c.properties)
    })),
    wires: project.wires.map(w => ({
      id: w.id,
      color: w.color,
      label: w.label,
      thickness: w.thickness,
      points: w.points.map(p => ({ x: p.x, y: p.y }))
    })),
    labels: project.labels.map(l => ({
      id: l.id,
      text: l.text,
      gridX: l.gridX,
      gridY: l.gridY,
      fontSize: l.fontSize,
      color: l.color,
      rotation: l.rotation
    }))
  };
}

/**
 * Trigger browser file download of JSON project object.
 * @param {Object} projectData - The serialized project state.
 * @param {string} filename - Output name (e.g. "my-project.vero").
 */
export function downloadJSON(projectData, filename) {
  const jsonStr = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Open browser file picker and parse selected JSON project data.
 * Accepts .vero and .json files.
 * @returns {Promise<Object>} Promise resolving to parsed project object.
 */
export function loadJSONFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vero,.json';

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          resolve(parsed);
        } catch (err) {
          reject(new Error('Invalid project file format: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('File reading error.'));
      reader.readAsText(file);
    });

    input.click();
  });
}

/**
 * Render the entire perfboard design onto an offscreen canvas and trigger a PNG download.
 *
 * @param {import('../core/app-state.js').AppState} appState - Global state store.
 * @param {Object} [options] - Export options.
 * @param {number} [options.scale=2] - Pixel scale multiplier (1, 2, or 4). Default 2 for high-DPI.
 * @param {boolean} [options.transparentBg=false] - If true, the background is transparent (no board color).
 */
export function exportPNG(appState, options = {}) {
  const { scale = 2, transparentBg = false } = options;
  const project = appState.project;
  const board = project.board;

  // Base 24px grid spacing multiplied by scale for sharpness
  const baseSpacing = 24;
  const spacing = baseSpacing * scale;

  const width = board.width * spacing;
  const height = board.height * spacing;

  // 1. Create offscreen canvas at full resolution
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('Failed to get 2D context for PNG export offscreen canvas.');
    return;
  }

  const isDark = board.theme === 'dark';
  const appBgColor = isDark ? '#0e1117' : '#f6f8fa';

  if (!transparentBg) {
    // 2. Clear backdrop with app background
    ctx.fillStyle = appBgColor;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Render physical board grid holes (board substrate + copper pads)
  const gridRenderer = new GridRenderer();
  gridRenderer.draw(ctx, board, spacing, transparentBg ? 'transparent' : appBgColor);

  // 4. Render wires layer (no selection highlight — clean export)
  const emptySelection = { componentIds: [], wireIds: [], labelIds: [] };
  WiresRenderer.drawAll(ctx, project, emptySelection, spacing);

  // 5. Render components layer
  ComponentsRenderer.drawAll(ctx, project, emptySelection, spacing);

  // 6. Generate image blob and download
  canvas.toBlob((blob) => {
    if (!blob) {
      console.error('Failed to generate PNG blob from offscreen canvas.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (project.name || 'Untitled_Perfboard').replace(/[^a-z0-9_-]/gi, '_');
    const scaleSuffix = scale > 1 ? `_${scale}x` : '';
    a.download = `${safeName}${scaleSuffix}.png`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}
