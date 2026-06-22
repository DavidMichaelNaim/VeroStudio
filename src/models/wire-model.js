/**
 * @fileoverview WireModel class with geometry utilities for wire segment hit-testing and bounding boxes.
 */

export class WireModel {
  /**
   * Calculate the distance from point (px, py) to the line segment from (ax, ay) to (bx, by).
   * @param {number} px - Test point X (grid units).
   * @param {number} py - Test point Y (grid units).
   * @param {number} ax - Segment start X.
   * @param {number} ay - Segment start Y.
   * @param {number} bx - Segment end X.
   * @param {number} by - Segment end Y.
   * @returns {number} Shortest distance in grid units.
   */
  static distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) {
      // Degenerate segment (both endpoints are same point)
      return Math.hypot(px - ax, py - ay);
    }

    // Parameter t along the segment
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const closestX = ax + t * dx;
    const closestY = ay + t * dy;
    return Math.hypot(px - closestX, py - closestY);
  }

  /**
   * Hit test whether a grid point is close enough to any segment of a wire.
   * @param {Object} wire - Wire state object with `points` array.
   * @param {number} gridX - Test grid column.
   * @param {number} gridY - Test grid row.
   * @param {number} [threshold=0.4] - Maximum grid-unit distance to count as hit.
   * @returns {boolean} True if the point is near a wire segment.
   */
  static hitTest(wire, gridX, gridY, threshold = 0.4) {
    const pts = wire.points;
    if (!pts || pts.length < 2) return false;

    for (let i = 0; i < pts.length - 1; i++) {
      const dist = this.distanceToSegment(
        gridX, gridY,
        pts[i].x, pts[i].y,
        pts[i + 1].x, pts[i + 1].y
      );
      if (dist <= threshold) return true;
    }
    return false;
  }

  /**
   * Compute the axis-aligned bounding box of a wire in grid coordinates.
   * @param {Object} wire - Wire state object.
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}} Grid bounds.
   */
  static getBoundingBox(wire) {
    if (!wire.points || wire.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    wire.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    return { minX, minY, maxX, maxY };
  }
}
