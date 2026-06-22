/**
 * @fileoverview Visual drawings and pin declarations for all electronic components.
 * Includes: Resistors, Capacitors, Diodes, LEDs, ICs, Transistors, MOSFETs.
 */

/**
 * Helper to draw a component lead line.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @param {boolean} isDark
 */
function drawLead(ctx, x1, y1, x2, y2, isDark) {
  ctx.strokeStyle = isDark ? '#8b949e' : '#57606a';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Draw pin label text at a given position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x @param {number} y
 * @param {boolean} isDark
 */
function drawPinLabel(ctx, text, x, y, isDark) {
  ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

// ─── Resistors ──────────────────────────────────────────────────────────────

function drawResistorBody(ctx, startX, endX, isSelected, isDark, bands) {
  const bodyStart = startX + 8;
  const bodyEnd = endX - 8;
  const bodyW = bodyEnd - bodyStart;

  ctx.fillStyle = isDark ? '#c9b097' : '#ddc4a9';
  ctx.strokeStyle = isSelected ? '#58a6ff' : '#8c6d53';
  ctx.lineWidth = isSelected ? 2 : 1.2;
  ctx.beginPath();
  ctx.roundRect(bodyStart, -6, bodyW, 12, 3);
  ctx.fill();
  ctx.stroke();

  const bandColors = bands || ['#8b5a2b', '#000000', '#ff9900', '#d4af37'];
  const step = bodyW / (bandColors.length + 1);
  ctx.lineWidth = 2.5;
  bandColors.forEach((color, i) => {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(bodyStart + step * (i + 1), -6);
    ctx.lineTo(bodyStart + step * (i + 1), 6);
    ctx.stroke();
  });
}

const RESISTOR_SM = {
  type: 'resistor_sm', name: 'Resistor (1/4W)', category: 'Resistors',
  width: 2, height: 0,
  defaultProperties: { value: '10k' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 2, y: 0, label: '2' }],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    drawLead(ctx, 0, 0, 10, 0, isDark);
    drawLead(ctx, 38, 0, len, 0, isDark);
    drawResistorBody(ctx, 0, len, isSel, isDark, ['#8b5a2b','#000000','#ff9900','#d4af37']);
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || '10k', len / 2, -11);
  }
};

const RESISTOR_LG = {
  type: 'resistor_lg', name: 'Resistor (1W)', category: 'Resistors',
  width: 3, height: 0,
  defaultProperties: { value: '10Ω' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 3, y: 0, label: '2' }],
  draw(ctx, props, isSel, isDark) {
    const len = 72;
    drawLead(ctx, 0, 0, 12, 0, isDark);
    drawLead(ctx, 60, 0, len, 0, isDark);
    // Larger body
    ctx.fillStyle = isDark ? '#b5a090' : '#d4b896';
    ctx.strokeStyle = isSel ? '#58a6ff' : '#7a5c44';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.roundRect(12, -8, 48, 16, 4); ctx.fill(); ctx.stroke();
    const bands = ['#8b5a2b','#000000','#ff9900','#d4af37'];
    const step = 48 / 5;
    ctx.lineWidth = 3;
    bands.forEach((c, i) => {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(12 + step * (i + 1), -8);
      ctx.lineTo(12 + step * (i + 1), 8);
      ctx.stroke();
    });
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || '10Ω', len / 2, -13);
  }
};

const RESISTOR_CERAMIC = {
  type: 'res_ceramic', name: 'Ceramic Resistor', category: 'Resistors',
  width: 2, height: 0,
  defaultProperties: { value: '100Ω' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 2, y: 0, label: '2' }],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    drawLead(ctx, 0, 0, 10, 0, isDark);
    drawLead(ctx, 38, 0, len, 0, isDark);
    ctx.fillStyle = isDark ? '#d4a843' : '#e8bc5a'; // yellow-cream
    ctx.strokeStyle = isSel ? '#58a6ff' : '#b8902a';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.roundRect(10, -5, 28, 10, 2); ctx.fill(); ctx.stroke();
    // Ceramic markings
    ctx.fillStyle = isDark ? '#1e293b' : '#334155';
    ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(props.value || '100Ω', 24, 0);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace';
    ctx.fillText(props.value || '100Ω', len / 2, -9);
  }
};

// ─── Capacitors ─────────────────────────────────────────────────────────────

const CAP_ELEC_SM = {
  type: 'cap_elec_sm', name: 'Electrolytic Cap (Small)', category: 'Capacitors',
  width: 1, height: 0,
  defaultProperties: { value: '10µF', voltage: '25V' },
  pins: [{ id: 'plus', x: 0, y: 0, label: '+' }, { id: 'minus', x: 1, y: 0, label: '-' }],
  draw(ctx, props, isSel, isDark) {
    const len = 24;
    drawLead(ctx, 0, 0, 6, 0, isDark);
    drawLead(ctx, 18, 0, len, 0, isDark);
    // Cylinder body
    ctx.fillStyle = isDark ? '#1e3a5f' : '#2563eb';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#3b82f6' : '#1d4ed8');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.ellipse(12, 0, 6, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Polarity stripe
    ctx.fillStyle = isDark ? '#93c5fd' : '#bfdbfe';
    ctx.beginPath(); ctx.ellipse(12, 0, 2.5, 9, 0, -Math.PI/2, Math.PI/2); ctx.fill();
    // + sign on left side
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8.5, -1.5); ctx.lineTo(8.5, 1.5); ctx.stroke();
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText((props.value || '10µF'), len / 2, -12);
  }
};

const CAP_ELEC_LG = {
  type: 'cap_elec_lg', name: 'Electrolytic Cap (Large)', category: 'Capacitors',
  width: 2, height: 0,
  defaultProperties: { value: '1000µF', voltage: '16V' },
  pins: [{ id: 'plus', x: 0, y: 0, label: '+' }, { id: 'minus', x: 2, y: 0, label: '-' }],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    drawLead(ctx, 0, 0, 12, 0, isDark);
    drawLead(ctx, 36, 0, len, 0, isDark);
    // Large cylinder
    ctx.fillStyle = isDark ? '#1e3a5f' : '#2563eb';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#3b82f6' : '#1d4ed8');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.ellipse(24, 0, 12, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Stripe
    ctx.fillStyle = isDark ? '#93c5fd' : '#bfdbfe';
    ctx.beginPath(); ctx.ellipse(24, 0, 5, 13, 0, -Math.PI/2, Math.PI/2); ctx.fill();
    // +
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(20, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17, -3); ctx.lineTo(17, 3); ctx.stroke();
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || '1000µF', len / 2, -16);
  }
};

const CAP_CERAMIC_SM = {
  type: 'cap_ceramic_sm', name: 'Ceramic Cap (Small)', category: 'Capacitors',
  width: 1, height: 0,
  defaultProperties: { value: '100nF' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 1, y: 0, label: '2' }],
  draw(ctx, props, isSel, isDark) {
    const len = 24;
    drawLead(ctx, 0, 0, 8, 0, isDark);
    drawLead(ctx, 16, 0, len, 0, isDark);
    ctx.fillStyle = isDark ? '#d97706' : '#f59e0b';
    ctx.strokeStyle = isSel ? '#58a6ff' : '#b45309';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(12, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#000000'; ctx.font = '6px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('104', 12, 0); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '7px monospace';
    ctx.fillText(props.value || '100nF', len / 2, -11);
  }
};

const CAP_CERAMIC_LG = {
  type: 'cap_ceramic_lg', name: 'Ceramic Cap (Large)', category: 'Capacitors',
  width: 1, height: 0,
  defaultProperties: { value: '10nF' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 1, y: 0, label: '2' }],
  draw(ctx, props, isSel, isDark) {
    const len = 24;
    drawLead(ctx, 0, 0, 6, 0, isDark);
    drawLead(ctx, 18, 0, len, 0, isDark);
    // Larger disc shape
    ctx.fillStyle = isDark ? '#b45309' : '#d97706';
    ctx.strokeStyle = isSel ? '#58a6ff' : '#92400e';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.ellipse(12, 0, 6, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = isDark ? '#fef3c7' : '#1e293b'; ctx.font = '5px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('103', 12, 0); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f'; ctx.font = '7px monospace';
    ctx.fillText(props.value || '10nF', len / 2, -13);
  }
};

// ─── Diodes ─────────────────────────────────────────────────────────────────

const DIODE = {
  type: 'diode', name: 'Diode', category: 'Diodes',
  width: 2, height: 0,
  defaultProperties: { value: '1N4007' },
  pins: [{ id: 'anode', x: 0, y: 0, label: 'A' }, { id: 'cathode', x: 2, y: 0, label: 'K' }],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    drawLead(ctx, 0, 0, 14, 0, isDark);
    drawLead(ctx, 34, 0, len, 0, isDark);
    // Diode body - glass bead style
    ctx.fillStyle = isDark ? '#374151' : '#6b7280';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#6b7280' : '#4b5563');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.ellipse(24, 0, 10, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Cathode band
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath(); ctx.ellipse(31, 0, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Triangle arrow symbol
    ctx.fillStyle = isDark ? '#94a3b8' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(16, -4); ctx.lineTo(28, 0); ctx.lineTo(16, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || '1N4007', len / 2, -9);
  }
};

const ZENER = {
  type: 'zener', name: 'Zener Diode', category: 'Diodes',
  width: 2, height: 0,
  defaultProperties: { value: '5.1V' },
  pins: [{ id: 'anode', x: 0, y: 0, label: 'A' }, { id: 'cathode', x: 2, y: 0, label: 'K' }],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    drawLead(ctx, 0, 0, 15, 0, isDark);
    drawLead(ctx, 33, 0, len, 0, isDark);
    // Glass bead orange-tinted
    ctx.fillStyle = isDark ? '#7c2d12' : '#c2410c';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#ea580c' : '#9a3412');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.ellipse(24, 0, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Zener-band with Z-shaped cathode
    ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, -7); ctx.lineTo(33, -5);
    ctx.moveTo(30, -5); ctx.lineTo(30, 5);
    ctx.moveTo(27, 5); ctx.lineTo(30, 7);
    ctx.stroke();
    // Triangle
    ctx.fillStyle = isDark ? '#fdba74' : '#fb923c';
    ctx.beginPath();
    ctx.moveTo(16, -4); ctx.lineTo(28, 0); ctx.lineTo(16, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Z:' + (props.value || '5.1V'), len / 2, -9);
  }
};

// ─── LED ────────────────────────────────────────────────────────────────────

const LED = {
  type: 'led', name: 'LED', category: 'Diodes',
  width: 1, height: 0,
  defaultProperties: { color: '#ff0000', value: 'Red LED' },
  pins: [{ id: 'anode', x: 0, y: 0, label: 'A' }, { id: 'cathode', x: 1, y: 0, label: 'K' }],
  draw(ctx, props, isSel, isDark) {
    const length = 24;
    const ledColor = props.color || '#ff0000';
    drawLead(ctx, 0, 0, 8, 0, isDark);
    drawLead(ctx, 16, 0, length, 0, isDark);
    ctx.save();
    ctx.translate(length / 2, 0);
    if (isDark) { ctx.shadowColor = ledColor; ctx.shadowBlur = 10; }
    ctx.fillStyle = ledColor + 'cc';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#ffffff' : '#4b5563');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 8, -Math.PI * 0.8, Math.PI * 0.8);
    ctx.lineTo(6, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(6, 5);
    ctx.strokeStyle = isDark ? '#e2e8f0' : '#374151'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = isDark ? '#cbd5e1' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-4, -2); ctx.lineTo(1, -2); ctx.lineTo(3, 2); ctx.lineTo(-4, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || 'LED', length / 2, -12);
  }
};

// ─── ICs ────────────────────────────────────────────────────────────────────

/**
 * Generic DIP IC drawer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} props
 * @param {boolean} isSel
 * @param {boolean} isDark
 * @param {number} pinCount - Total pins (must be even)
 * @param {string[]} pinLabels - Labels array, index 0 = pin1 (left-top going down, then right-bottom going up)
 */
function drawDIPIC(ctx, props, isSel, isDark, pinCount, pinLabels) {
  const halfPins = pinCount / 2;
  const rowH = 24; // grid spacing
  const bodyH = (halfPins - 1) * rowH;
  const bodyW = 52;

  // Lead stubs on both sides
  ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.lineWidth = 2;
  for (let i = 0; i < halfPins; i++) {
    const y = i * rowH;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(14, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bodyW + 14, y); ctx.lineTo(bodyW + 28, y); ctx.stroke();
  }

  // IC plastic body
  ctx.fillStyle = isDark ? '#1e293b' : '#334155';
  ctx.strokeStyle = isSel ? '#58a6ff' : '#0f172a';
  ctx.lineWidth = isSel ? 2 : 1.5;
  ctx.beginPath();
  ctx.roundRect(12, -8, bodyW, bodyH + 16, 5);
  ctx.fill(); ctx.stroke();

  // Top notch
  ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
  ctx.beginPath(); ctx.arc(12 + bodyW / 2, -8, 6, 0, Math.PI); ctx.fill();

  // Pin 1 dot
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath(); ctx.arc(18, -2, 2.5, 0, Math.PI * 2); ctx.fill();

  // Pin labels on body
  ctx.fillStyle = isDark ? '#94a3b8' : '#e2e8f0';
  ctx.font = 'bold 6px monospace';
  for (let i = 0; i < halfPins; i++) {
    const y = i * rowH;
    // Left side labels
    const lIdx = i;
    const lLabel = pinLabels && pinLabels[lIdx] ? pinLabels[lIdx] : String(lIdx + 1);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lLabel, 15, y);

    // Right side labels (reverse order)
    const rIdx = pinCount - 1 - i;
    const rLabel = pinLabels && pinLabels[rIdx] ? pinLabels[rIdx] : String(rIdx + 1);
    ctx.textAlign = 'right';
    ctx.fillText(rLabel, bodyW + 12, y);
  }

  // IC chip name in center
  ctx.save();
  ctx.translate(12 + bodyW / 2, bodyH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.min(10, 80 / pinLabels.length + 4)}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(props.value || 'IC', 0, 0);
  ctx.restore();
}

const IC_DIP4 = {
  type: 'ic_dip4', name: 'IC (DIP-4)', category: 'ICs',
  width: 2, height: 1,
  defaultProperties: { value: 'LM358', pinLabels: ['IN-', 'IN+', 'VCC', 'OUT'] },
  pins: [
    { id: '1', x: 0, y: 0, label: '1' }, { id: '2', x: 0, y: 1, label: '2' },
    { id: '3', x: 2, y: 1, label: '3' }, { id: '4', x: 2, y: 0, label: '4' }
  ],
  draw(ctx, props, isSel, isDark) {
    const pinLabels = props.pinLabels || ['1','2','3','4'];
    drawDIPIC(ctx, props, isSel, isDark, 4, pinLabels);
  }
};

const IC_DIP8 = {
  type: 'ic_dip8', name: 'IC (DIP-8)', category: 'ICs',
  width: 3, height: 3,
  defaultProperties: { value: 'NE555', pinLabels: ['GND','TRG','OUT','RST','VCC','THR','DIS','VCC'] },
  pins: [
    { id: '1', x: 0, y: 0, label: '1' }, { id: '2', x: 0, y: 1, label: '2' },
    { id: '3', x: 0, y: 2, label: '3' }, { id: '4', x: 0, y: 3, label: '4' },
    { id: '5', x: 3, y: 3, label: '5' }, { id: '6', x: 3, y: 2, label: '6' },
    { id: '7', x: 3, y: 1, label: '7' }, { id: '8', x: 3, y: 0, label: '8' }
  ],
  draw(ctx, props, isSel, isDark) {
    const pinLabels = props.pinLabels || ['1','2','3','4','5','6','7','8'];
    drawDIPIC(ctx, props, isSel, isDark, 8, pinLabels);
  }
};

const IC_DIP16 = {
  type: 'ic_dip16', name: 'IC (DIP-16)', category: 'ICs',
  width: 3, height: 7,
  defaultProperties: {
    value: '74HC00',
    pinLabels: ['1A','1B','1Y','2A','2B','2Y','GND','3Y','3B','3A','4Y','4B','4A','NC','NC','VCC']
  },
  pins: [
    { id: '1',  x: 0, y: 0, label: '1'  }, { id: '2',  x: 0, y: 1, label: '2'  },
    { id: '3',  x: 0, y: 2, label: '3'  }, { id: '4',  x: 0, y: 3, label: '4'  },
    { id: '5',  x: 0, y: 4, label: '5'  }, { id: '6',  x: 0, y: 5, label: '6'  },
    { id: '7',  x: 0, y: 6, label: '7'  }, { id: '8',  x: 0, y: 7, label: '8'  },
    { id: '9',  x: 3, y: 7, label: '9'  }, { id: '10', x: 3, y: 6, label: '10' },
    { id: '11', x: 3, y: 5, label: '11' }, { id: '12', x: 3, y: 4, label: '12' },
    { id: '13', x: 3, y: 3, label: '13' }, { id: '14', x: 3, y: 2, label: '14' },
    { id: '15', x: 3, y: 1, label: '15' }, { id: '16', x: 3, y: 0, label: '16' }
  ],
  draw(ctx, props, isSel, isDark) {
    const pinLabels = props.pinLabels || Array.from({length:16},(_,i)=>String(i+1));
    drawDIPIC(ctx, props, isSel, isDark, 16, pinLabels);
  }
};

// ─── Transistors ─────────────────────────────────────────────────────────────

const TRANSISTOR_BJT = {
  type: 'transistor_bjt', name: 'Transistor (BJT)', category: 'Transistors',
  width: 2, height: 0,
  defaultProperties: { value: '2N3904', type: 'NPN', pinLabels: ['E', 'B', 'C'] },
  pins: [
    { id: 'emitter',   x: 0, y: 0, label: 'E' },
    { id: 'base',      x: 1, y: 0, label: 'B' },
    { id: 'collector', x: 2, y: 0, label: 'C' }
  ],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    const labels = props.pinLabels || ['E','B','C'];
    // Leads
    drawLead(ctx, 0, 0, 16, 0, isDark);
    drawLead(ctx, 24, 0, 24, 0, isDark);
    drawLead(ctx, 48, 0, 32, 0, isDark);
    // TO-92 body
    ctx.fillStyle = isDark ? '#1e293b' : '#334155';
    ctx.strokeStyle = isSel ? '#58a6ff' : '#0f172a';
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(24, 0, 11, Math.PI, 0, false); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Flat face
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(35, 0); ctx.stroke();
    // Pin labels
    const pxArr = [0, 24, 48];
    labels.forEach((lbl, i) => drawPinLabel(ctx, lbl, pxArr[i], 15, isDark));
    // Name
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || '2N3904', len / 2, -15);
  }
};

const MOSFET = {
  type: 'mosfet', name: 'MOSFET', category: 'Transistors',
  width: 2, height: 0,
  defaultProperties: { value: 'IRF540', type: 'N-Ch', pinLabels: ['S', 'G', 'D'] },
  pins: [
    { id: 'source', x: 0, y: 0, label: 'S' },
    { id: 'gate',   x: 1, y: 0, label: 'G' },
    { id: 'drain',  x: 2, y: 0, label: 'D' }
  ],
  draw(ctx, props, isSel, isDark) {
    const len = 48;
    const labels = props.pinLabels || ['S','G','D'];
    // Leads
    drawLead(ctx, 0, 0, 16, 0, isDark);
    drawLead(ctx, 24, 0, 24, 0, isDark);
    drawLead(ctx, 48, 0, 32, 0, isDark);
    // TO-92 style body (green tinted for MOSFET differentiation)
    ctx.fillStyle = isDark ? '#14532d' : '#166534';
    ctx.strokeStyle = isSel ? '#58a6ff' : (isDark ? '#22c55e' : '#15803d');
    ctx.lineWidth = isSel ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(24, 0, 11, Math.PI, 0, false); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Gate line indicator (vertical bar)
    ctx.strokeStyle = isDark ? '#86efac' : '#4ade80'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(21, -6); ctx.lineTo(21, 6); ctx.stroke();
    // Gate arrow
    ctx.strokeStyle = isDark ? '#86efac' : '#4ade80'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(23, 0); ctx.lineTo(21, 0); ctx.stroke();
    // Flat face
    ctx.strokeStyle = isDark ? '#4ade80' : '#86efac'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(35, 0); ctx.stroke();
    // Pin labels
    const pxArr = [0, 24, 48];
    labels.forEach((lbl, i) => drawPinLabel(ctx, lbl, pxArr[i], 15, isDark));
    // Name
    ctx.fillStyle = isDark ? '#f0f6fc' : '#24292f';
    ctx.font = '7px monospace'; ctx.textAlign = 'center';
    ctx.fillText(props.value || 'IRF540', len / 2, -15);
  }
};

// ─── Standard Resistor (backward compat) ────────────────────────────────────

const RESISTOR = {
  type: 'resistor', name: 'Resistor (1/4W)', category: 'Resistors',
  width: 2, height: 0,
  defaultProperties: { value: '10k' },
  pins: [{ id: 'p1', x: 0, y: 0, label: '1' }, { id: 'p2', x: 2, y: 0, label: '2' }],
  draw: RESISTOR_SM.draw
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export const ComponentDefinitions = {
  // --- Resistors ---
  resistor: RESISTOR,
  resistor_sm: RESISTOR_SM,
  resistor_lg: RESISTOR_LG,
  res_ceramic: RESISTOR_CERAMIC,

  // --- Capacitors ---
  cap_elec_sm: CAP_ELEC_SM,
  cap_elec_lg: CAP_ELEC_LG,
  cap_ceramic_sm: CAP_CERAMIC_SM,
  cap_ceramic_lg: CAP_CERAMIC_LG,
  // backward compat
  capacitor: CAP_CERAMIC_SM,

  // --- Diodes & LED ---
  diode: DIODE,
  zener: ZENER,
  led: LED,

  // --- ICs ---
  ic_dip4:  IC_DIP4,
  ic_dip8:  IC_DIP8,
  ic_dip16: IC_DIP16,
  // backward compat
  ic: IC_DIP8,

  // --- Transistors / FETs ---
  transistor_bjt: TRANSISTOR_BJT,
  mosfet: MOSFET,
  // backward compat
  transistor: TRANSISTOR_BJT,
};
