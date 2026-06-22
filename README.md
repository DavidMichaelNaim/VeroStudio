# VeroStudio

VeroStudio is a browser-based editor for designing electronic circuits on a blank Perfboard (Perforated Prototype Board). 

Unlike standard PCB layout software (like KiCad or Altium), VeroStudio is designed to help you organize components visually and manually plan wiring layouts on a perfboard, exactly as you would when building a physical prototype.

* **GitHub Pages Ready**: Runs 100% client-side. No compilation, no bundlers, no package managers, and no backend needed.
* **Pure Tech Stack**: Built entirely using HTML5 Canvas, CSS3, and Vanilla JavaScript (ES6 Modules).

---

## Features

- **Infinite Grid Workspace**: Dynamic viewport panning and zooming with mouse or keyboard spacebar shortcuts.
- **Perfect Grid Snapping**: Component pins and wire coordinates snap to standard $24\text{px} \times 24\text{px}$ perfboard holes.
- **Electronic Component Set**:
  - Resistors, Capacitors, LEDs (with editable color options), ICs (with configurable pin count), and Transistors.
  - Interactive placement, rotation (`R`), custom labeling, and deletion.
- **Wire Drawing Engine**:
  - Hand-drawn, multi-segment point placement.
  - Settable wire colors (e.g., Red, Blue, Black, Green) and text labels.
- **Clean Selection & Layout Controls**:
  - Drag-to-select marquee box, single-item selection, and multi-component move.
- **Local Persistence & Export**:
  - Save circuit schematics as a local JSON file (`.vero`).
  - Load existing `.vero` projects from disk.
  - Export board layouts as a transparent high-resolution PNG image for documentation.

---

## How to Run

Because VeroStudio utilizes native ES Modules directly in the browser, modern security settings (CORS) restrict loading modules via the `file://` protocol. 

Therefore, you must host the files using a simple local web server:

### Option A: Using Python (Pre-installed on most systems)
Open your terminal inside the project directory and run:
```bash
python -m http.server 8000
```
Then, open your browser and navigate to: `http://localhost:8000`

### Option B: Using Node.js (via npx)
Open your terminal inside the project directory and run:
```bash
npx serve
```
Then, navigate to the local URL printed in your terminal.

---

## Project Structure

```
VeroStudio/
├── index.html          # Main HTML layout wrapper
├── index.css           # Styling rules and variables for Light/Dark themes
├── CHANGELOG.md        # Summary of changes per phase
├── KNOWN_ISSUES.md     # Documented technical limitations
├── PROJECT_RULES.md    # Codebase style and architectural guidelines
├── src/                # Application source code
│   ├── main.js         # Master bootstrap and event routing entry point
│   ├── core/           # AppState (pub-sub) and CommandManager (history)
│   ├── canvas/         # Viewport transformations and Render managers
│   ├── tools/          # Active interaction tool state implementations
│   ├── components/     # Electronic symbol registries and graphics
│   ├── models/         # Data model geometries (ComponentModel, WireModel)
│   ├── ui/             # Toolbox sidebar, Properties panel, ContextMenu, and StatusBar
│   └── utils/          # Save/Load utilities and offscreen PNG exporter
└── test/
    └── test-runner.html# Browser-based automated unit test diagnostics
```

---

## Running Tests

To run the unit tests, start your local web server as shown in the "How to Run" section and open:

`http://localhost:8000/test/test-runner.html`

The diagnostic test runner executes 12 assertion suites verifying the core AppState, Command undo/redo operations, Viewport coordinate translation math, Component rotation trigonometry, Wire hit-testing, and JSON schema serialization.

---

## Architecture Principles

VeroStudio follows a strict unidirectional data flow to ensure predictable UI rendering and reliable undo/redo management:

1. **User Events** (mouse inputs, keystrokes) are captured and translated into board grid coordinates by the canvas viewport.
2. The active **Interaction Tool** processes the coordinates and passes a transaction **Command** to the **Command Manager**.
3. The **Command Manager** executes the command, pushing it to the history stack, which modifies the **AppState**.
4. **AppState** triggers a `'change'` notification to all sub-subscribers.
5. The **Canvas Controller** detects the change and schedules a high-performance redraw inside `requestAnimationFrame`.
6. Separate **Renderers** fetch the updated state models and paint the canvas layer-by-layer (Grid $\rightarrow$ Wires $\rightarrow$ Components $\rightarrow$ Selection Outlines).
