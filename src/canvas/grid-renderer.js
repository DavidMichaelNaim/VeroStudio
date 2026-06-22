/**
 * @fileoverview GridRenderer class drawing the perfboard background structure and copper ring pads.
 */

export class GridRenderer {
  /**
   * Render the perfboard background base and grid holes.
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
   * @param {import('../core/app-state.js').BoardState} board - Current board state.
   * @param {number} spacing - Grid spacing in pixels (e.g. 24).
   * @param {string} appBgColor - Color of the surrounding app canvas backdrop.
   */
  draw(ctx, board, spacing, appBgColor) {
    const widthPx = board.width * spacing;
    const heightPx = board.height * spacing;

    // 1. Set theme colors
    const isDark = board.theme === 'dark';
    
    // Phenolic board substrate base color
    const boardBg = isDark ? '#1a202c' : '#ebdcc5';
    // Substrate border outline
    const boardBorder = isDark ? '#2d3748' : '#c2b09a';
    // Ring pad copper outline color
    const padStroke = isDark ? '#a05a2c' : '#c07a4a';
    // Inner copper ring color (solder mask/tinning)
    const padFill = isDark ? '#b7791f' : '#dd9a26';
    // Center hole color (matches surrounding background to simulate a cutout)
    const holeFill = appBgColor;

    ctx.save();

    // 2. Draw board substrate base shadow
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;
    
    ctx.fillStyle = boardBg;
    ctx.fillRect(0, 0, widthPx, heightPx);
    
    // Disable shadow for internal grid holes
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw board outer border
    ctx.strokeStyle = boardBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, widthPx, heightPx);

    // 3. Draw grid holes
    // Loop through grid coordinate intersections
    const padRadius = 3.5;
    const holeRadius = 1.2;
    const padOpacity = board.padOpacity !== undefined ? board.padOpacity : 1.0;

    for (let c = 0; c <= board.width; c++) {
      const cx = c * spacing;
      for (let r = 0; r <= board.height; r++) {
        const cy = r * spacing;

        // Draw copper pad circle
        ctx.save();
        ctx.globalAlpha = padOpacity;
        ctx.beginPath();
        ctx.arc(cx, cy, padRadius, 0, Math.PI * 2);
        ctx.fillStyle = padFill;
        ctx.fill();
        ctx.strokeStyle = padStroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();
        ctx.restore();

        // Draw center drill hole
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.fillStyle = holeFill;
        ctx.fill();
      }
    }

    ctx.restore();
  }
}
