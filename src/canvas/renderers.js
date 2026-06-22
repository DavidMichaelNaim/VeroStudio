/**
 * @fileoverview Main visual renderers for components, wires, labels, and overlays.
 */

import { defaultRegistry } from '../components/registry.js';

export class ComponentsRenderer {
  /**
   * Render all component instances on the perfboard canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {import('../core/app-state.js').ProjectState} project - Active project state.
   * @param {import('../core/app-state.js').SelectionState} selection - Selection list.
   * @param {number} spacing - Grid spacing in pixels.
   */
  static drawAll(ctx, project, selection, spacing) {
    const isDark = project.board.theme === 'dark';

    project.components.forEach((comp) => {
      const def = defaultRegistry.get(comp.type);
      if (!def) return;

      const isSelected = selection.componentIds.includes(comp.id);

      ctx.save();

      // Translate context to component's world grid anchor position
      ctx.translate(comp.gridX * spacing, comp.gridY * spacing);

      // Apply rotation (in degrees)
      if (comp.rotation !== 0) {
        ctx.rotate((comp.rotation * Math.PI) / 180);
      }

      // Apply horizontal mirror flip
      if (comp.flipped) {
        ctx.scale(-1, 1);
      }

      // Execute component drawing instructions
      def.draw(ctx, comp.properties, isSelected, isDark);

      ctx.restore();
    });
  }
}

export class WiresRenderer {
  /**
   * Render all wire connections on the perfboard canvas.
   * @param {CanvasRenderingContext2D} ctx - Canvas context.
   * @param {import('../core/app-state.js').ProjectState} project - Active project state.
   * @param {import('../core/app-state.js').SelectionState} selection - Selection list.
   * @param {number} spacing - Grid spacing in pixels.
   */
  static drawAll(ctx, project, selection, spacing) {
    const isDark = project.board.theme === 'dark';

    project.wires.forEach((wire) => {
      if (!wire.points || wire.points.length < 2) return;

      const isSelected = selection.wireIds.includes(wire.id);

      ctx.save();

      // 1. Draw Selection Highlight (underneath the wire)
      if (isSelected) {
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = wire.thickness * 3;
        ctx.globalAlpha = 0.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(wire.points[0].x * spacing, wire.points[0].y * spacing);
        for (let i = 1; i < wire.points.length; i++) {
          ctx.lineTo(wire.points[i].x * spacing, wire.points[i].y * spacing);
        }
        ctx.stroke();
      }

      // 2. Draw the actual wire
      ctx.restore();
      ctx.save();
      
      ctx.strokeStyle = wire.color || '#ff0000';
      ctx.lineWidth = wire.thickness || 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(wire.points[0].x * spacing, wire.points[0].y * spacing);
      for (let i = 1; i < wire.points.length; i++) {
        ctx.lineTo(wire.points[i].x * spacing, wire.points[i].y * spacing);
      }
      ctx.stroke();

      // 3. Draw vertex handles: blue rings on all points for selected; endpoint dots only for normal
      if (isSelected) {
        wire.points.forEach((pt) => {
          // Outer blue ring (indicates draggable handle)
          ctx.beginPath();
          ctx.arc(pt.x * spacing, pt.y * spacing, (wire.thickness || 2) * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#58a6ff';
          ctx.fill();
          // Inner dot in wire colour
          ctx.beginPath();
          ctx.arc(pt.x * spacing, pt.y * spacing, (wire.thickness || 2) * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = wire.color || '#ff0000';
          ctx.fill();
        });
      } else {
        // Endpoint dots only
        ctx.fillStyle = wire.color || '#ff0000';
        ctx.beginPath();
        ctx.arc(wire.points[0].x * spacing, wire.points[0].y * spacing, (wire.thickness || 2) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(wire.points[wire.points.length - 1].x * spacing, wire.points[wire.points.length - 1].y * spacing, (wire.thickness || 2) * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw wire label at the midpoint segment
      if (wire.label) {
        const mid = Math.floor((wire.points.length - 1) / 2);
        const p1 = wire.points[mid];
        const p2 = wire.points[mid + 1];
        const gx = (p1.x + p2.x) / 2;
        const gy = (p1.y + p2.y) / 2;
        const px = gx * spacing;
        const py = gy * spacing;

        ctx.font = '10px var(--font-sans, sans-serif)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textWidth = ctx.measureText(wire.label).width;

        // Draw background pill
        ctx.fillStyle = isDark ? '#21262d' : '#ffffff';
        ctx.strokeStyle = isDark ? '#30363d' : '#d0d7de';
        ctx.lineWidth = 1;
        const paddingX = 6;
        const paddingY = 3;
        const rectW = textWidth + paddingX * 2;
        const rectH = 10 + paddingY * 2;

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(px - rectW / 2, py - rectH / 2, rectW, rectH, 4);
        } else {
          ctx.rect(px - rectW / 2, py - rectH / 2, rectW, rectH);
        }
        ctx.fill();
        ctx.stroke();

        // Label text
        ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
        ctx.fillText(wire.label, px, py);
      }

      ctx.restore();
    });
  }
}
