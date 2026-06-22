/**
 * @fileoverview ComponentModel class containing mathematical operations for component instances.
 */

export class ComponentModel {
  /**
   * Calculate the global grid positions of all terminals/pins for a component instance.
   * Takes rotation (0, 90, 180, 270) and horizontal mirroring (flip) into account.
   * @param {import('../core/app-state.js').Component} instance - Component instance from state.
   * @param {Object} definition - Component definition details from registry.
   * @returns {{id: string, x: number, y: number, label: string}[]} Pin array with global grid positions.
   */
  static getGlobalPins(instance, definition) {
    if (!definition || !definition.pins) return [];

    const rotRad = (instance.rotation * Math.PI) / 180;
    const cos = Math.round(Math.cos(rotRad));
    const sin = Math.round(Math.sin(rotRad));

    return definition.pins.map((pin) => {
      // 1. Handle Flip (mirror across relative vertical Y-axis)
      let rx = instance.flipped ? -pin.x : pin.x;
      let ry = pin.y;

      // 2. Handle Rotation around anchor (0, 0)
      // rx' = rx * cos - ry * sin
      // ry' = rx * sin + ry * cos
      const rotatedX = rx * cos - ry * sin;
      const rotatedY = rx * sin + ry * cos;

      // 3. Translate to board anchor coordinates
      return {
        id: pin.id,
        x: instance.gridX + rotatedX,
        y: instance.gridY + rotatedY,
        label: pin.label
      };
    });
  }

  /**
   * Computes the bounding box of a component instance in grid coordinates.
   * Useful for selection hit checking and render culling.
   * @param {import('../core/app-state.js').Component} instance - Component instance state.
   * @param {Object} definition - Registered component schema.
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}} Grid bounds.
   */
  static getBoundingBox(instance, definition) {
    const globalPins = this.getGlobalPins(instance, definition);
    
    if (globalPins.length === 0) {
      // If there are no pins, default to a 1x1 cell box at the anchor position
      return {
        minX: instance.gridX - 0.5,
        minY: instance.gridY - 0.5,
        maxX: instance.gridX + 0.5,
        maxY: instance.gridY + 0.5
      };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    globalPins.forEach((pin) => {
      minX = Math.min(minX, pin.x);
      minY = Math.min(minY, pin.y);
      maxX = Math.max(maxX, pin.x);
      maxY = Math.max(maxY, pin.y);
    });

    // Padding (expand by 0.5 grid units to cover visual component body drawings)
    return {
      minX: minX - 0.5,
      minY: minY - 0.5,
      maxX: maxX + 0.5,
      maxY: maxY + 0.5
    };
  }

  /**
   * Check if a screen-clicked grid coordinate falls within the component's bounding box.
   * @param {import('../core/app-state.js').Component} instance - Component instance.
   * @param {Object} definition - Component schema definition.
   * @param {number} gridX - Target grid horizontal coordinate.
   * @param {number} gridY - Target grid vertical coordinate.
   * @returns {boolean} True if the point is inside the bounding box.
   */
  static hitTest(instance, definition, gridX, gridY) {
    const box = this.getBoundingBox(instance, definition);
    return gridX >= box.minX && gridX <= box.maxX && gridY >= box.minY && gridY <= box.maxY;
  }
}
