/**
 * @fileoverview Viewport class managing viewport coordinate conversions, panning, and zoom operations.
 */

export class Viewport {
  /**
   * @param {import('../core/app-state.js').AppState} appState - The global state store.
   */
  constructor(appState) {
    /** @type {import('../core/app-state.js').AppState} */
    this.appState = appState;
    
    /** @type {number} */
    this.gridSpacing = 24; // 24px base spacing
  }

  // Getters targeting central AppState viewport slice
  get panX() { return this.appState.viewport.panX; }
  get panY() { return this.appState.viewport.panY; }
  get zoom() { return this.appState.viewport.zoom; }

  /**
   * Translate viewport pan offsets.
   * @param {number} dx - Relative horizontal delta in pixels.
   * @param {number} dy - Relative vertical delta in pixels.
   */
  pan(dx, dy) {
    this.appState.updateViewport({
      panX: this.panX + dx,
      panY: this.panY + dy
    });
  }

  /**
   * Zoom the viewport, maintaining the focus point constant under the cursor.
   * @param {number} targetZoom - The desired final zoom scale.
   * @param {number} focusScreenX - Screen horizontal pivot point.
   * @param {number} focusScreenY - Screen vertical pivot point.
   */
  zoomTo(targetZoom, focusScreenX, focusScreenY) {
    const limits = this.appState.viewport;
    const clampedZoom = Math.max(limits.minZoom, Math.min(limits.maxZoom, targetZoom));
    
    if (clampedZoom === this.zoom) return;

    // Convert focus screen point to world coordinates before zooming
    const worldX = (focusScreenX - this.panX) / this.zoom;
    const worldY = (focusScreenY - this.panY) / this.zoom;

    // Calculate new pan offsets to align world coordinate back under cursor focus point
    const nextPanX = focusScreenX - worldX * clampedZoom;
    const nextPanY = focusScreenY - worldY * clampedZoom;

    this.appState.updateViewport({
      zoom: clampedZoom,
      panX: nextPanX,
      panY: nextPanY
    });
  }

  /**
   * Converts a screen space pixel position into world grid space units.
   * @param {number} screenX - Horizontal pixel position.
   * @param {number} screenY - Vertical pixel position.
   * @returns {{x: number, y: number}} Corresponding grid unit coordinates.
   */
  screenToGrid(screenX, screenY) {
    const gridX = (screenX - this.panX) / (this.zoom * this.gridSpacing);
    const gridY = (screenY - this.panY) / (this.zoom * this.gridSpacing);
    return { x: gridX, y: gridY };
  }

  /**
   * Converts a world grid coordinate into screen space pixel coordinates.
   * @param {number} gridX - Horizontal grid position.
   * @param {number} gridY - Vertical grid position.
   * @returns {{x: number, y: number}} Corresponding screen pixel position.
   */
  gridToScreen(gridX, gridY) {
    const screenX = this.panX + gridX * this.gridSpacing * this.zoom;
    const screenY = this.panY + gridY * this.gridSpacing * this.zoom;
    return { x: screenX, y: screenY };
  }

  /**
   * Snap a raw grid position to the nearest integer grid coordinate.
   * @param {number} val - Float grid value.
   * @returns {number} Snapped integer grid coordinate.
   */
  snap(val) {
    return Math.round(val);
  }

  /**
   * Snap a grid vector coordinate to nearest integer coordinates.
   * @param {number} gridX - Horizontal grid unit coordinate.
   * @param {number} gridY - Vertical grid unit coordinate.
   * @returns {{x: number, y: number}} Snapped grid coordinates.
   */
  snapToGrid(gridX, gridY) {
    return {
      x: this.snap(gridX),
      y: this.snap(gridY)
    };
  }

  /**
   * Apply viewport transform matrix (pan and zoom scale) onto canvas context.
   * @param {CanvasRenderingContext2D} ctx - Context to apply changes to.
   */
  applyTransform(ctx) {
    ctx.translate(this.panX, this.panY);
    ctx.scale(this.zoom, this.zoom);
  }
}
