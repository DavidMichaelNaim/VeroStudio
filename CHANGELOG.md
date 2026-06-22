# VeroStudio Changelog

## [Phase 1: Core Application] - 2026-06-21
### Added
- Core application structure, including directories for core, canvas, tools, components, models, ui, and utils.
- `AppState` (state store with pub-sub event notifications).
- `CommandManager` (bounds-limited transaction log for undo/redo).
- Concrete commands: `ResizeBoardCommand`, `UpdateProjectNameCommand`, and `SetThemeCommand`.
- Responsive layout panels and styling inside `index.html` and `index.css`.
- In-browser unit test diagnostics page (`test/test-runner.html`) verifying core mutations.
- Master bootstrap runner `src/main.js`.

## [Phase 2: Canvas Engine] - 2026-06-21
### Added
- `CanvasController` class (`src/canvas/canvas-controller.js`) scheduling dynamic redraws via `requestAnimationFrame` and managing high-DPI scaling.
- ResizeObserver tracking container size changes and resizing canvas buffer without layout jumping.
- Unit assertions to `test/test-runner.html` verifying canvas controller context initialization and render flags.
### Modified

## [Phase 3: Viewport (Pan / Zoom)] - 2026-06-21
### Added
- `Viewport` class (`src/canvas/viewport.js`) managing zoom scale levels, panning coordinate translation vectors, screen-to-grid mappings, and grid coordinate snapping.
- Mouse interaction listeners to canvas in `src/main.js` supporting middle-mouse drag panning, spacebar+left-drag panning, and mouse-wheel focal zoom.
- Interactive status bar tracking displaying mouse grid coordinates and current zoom percentage.
- Unit assertions to `test/test-runner.html` verifying coordinate matrix calculations and zoom focal pivot alignment.
### Modified

## [Phase 4: Board Rendering] - 2026-06-21
### Added
- `GridRenderer` class (`src/canvas/grid-renderer.js`) rendering the physical perfboard background with copper ring solder pads and center drill holes.
- Solder pad visual stylings responsive to Light and Dark theme selections.
- Unit assertions to `test/test-runner.html` executing a crash-free render verification of the Board grid.
### Modified

## [Phase 5: Component Engine] - 2026-06-21
### Added
- Component definitions (`src/components/definitions.js`) for Resistor, Capacitor, LED, IC, and Transistor, outlining pins and custom Canvas 2D draws.
- `ComponentRegistry` (`src/components/registry.js`) library registering definitions with a singleton `defaultRegistry`.
- `ComponentModel` geometry class (`src/models/component-model.js`) wrapping rotation math, horizontal flips, bounding-box layouts, and click hit-testing.
- `ComponentsRenderer` loop (`src/canvas/renderers.js`) drawing components inside translated, rotated, and scaled canvas contexts.
- `AddComponentCommand` in `src/core/commands.js` to transactionally insert components.
- Unit assertions to `test/test-runner.html` verifying component state changes, pin rotation trigonometry, and bounding box hits.
### Modified
- `src/canvas/canvas-controller.js` to draw component instances over the background perfboard.

## [Phase 6: Selection Engine] - 2026-06-21
### Added
- `ToolManager` class (`src/tools/tool-manager.js`) coordinating active canvas tools and routing input events.
- `SelectTool` class (`src/tools/select-tool.js`) handling component selection (click and drag-select marquee), drag-and-drop movement, and selection outlines.
- Keyboard bindings inside `src/main.js` ('R' for rotate, 'Delete'/'Backspace' for delete, 'Ctrl+Z'/'Ctrl+Y' for undo/redo).
- Concrete commands: `MoveComponentsCommand`, `RotateComponentsCommand`, and `DeleteComponentsCommand` inside `src/core/commands.js`.
### Modified
- `src/canvas/canvas-controller.js` to draw dashed marquee outlines and component selection highlights.
- `src/main.js` to initialize and route mouse events through `ToolManager` and bind selection/manipulation hotkeys.

## [Phase 7: Wire Engine] - 2026-06-21
### Added
- `WireTool` class (`src/tools/wire-tool.js`) supporting click-based point placing, active drawing overlays with cursor snap/ghost lines, and keyboard finalize (Enter) or cancel (Esc).
- `WiresRenderer` class (`src/canvas/renderers.js`) rendering physical multi-segment wires, selection bounding highlights, and midpoint text label pills.
- Wire diagnostic assertions inside `test/test-runner.html` validating `WireModel` geometry calculations and wire state mutation undo/redo commands.
### Modified
- `src/canvas/canvas-controller.js` to draw physical wires layer between the perfboard grid and components layer.
- `src/tools/select-tool.js` to incorporate `WireModel.hitTest()` click detection and AABB box-selection support.
- `src/main.js` to register `WireTool`, route keydown commands to active tools, and extend the Delete keyboard shortcut to clear selected wires.

## [Phase 8: Property Panel & Toolbox UI] - 2026-06-21
### Added
- `ComponentTool` class (`src/tools/component-tool.js`) enabling interactive placement of various component types with active rotation ('R') and cancel ('Esc').
- `Toolbox` class (`src/ui/toolbox.js`) generating left sidebar controls for selecting tool modes and electronic components.
- `PropertiesPanel` class (`src/ui/properties-panel.js`) for reactive configuration adjustments (renaming, dimensions, colors, values, thickness).
- `ContextMenu` class (`src/ui/context-menu.js`) delivering cursor right-click selections (Rotate, Delete, Clear, Undo, Redo).
- `StatusBar` class (`src/ui/status-bar.js`) keeping grid coordinate locations, selection details, zoom parameters, and item counts synced.
### Modified
- `src/tools/tool-manager.js` to automatically synchronize active tool states on AppState `'tool'` notification updates.
- `src/main.js` to bootstrap all new UI modules, prevent default canvas right-clicks, and route mousemove coordinates to the status bar tracker.
- `index.css` to add styling layouts for the left toolbox buttons, properties form inputs, color grids, and context menu lists.

## [Phase 9: Save / Load] - 2026-06-21
### Added
- File utility handlers (`src/utils/file.js`) performing clean serialization of project structures, trigger-saving JSON files to disk, and parsing loaded text files with reader events.
- Unit assertions inside `test/test-runner.html` verifying JSON schema output from the `serializeProject` utility.
### Modified
- `src/main.js` to wire top toolbar header actions (`btn-new`, `btn-open`, `btn-save`) into file serialization and upload loader handlers.

## [Phase 10: Export PNG] - 2026-06-21
### Added
- `exportPNG(appState)` function in `src/utils/file.js` rendering the full board onto an offscreen canvas (grid → wires → components) and triggering a `.png` download via `canvas.toBlob()`.
### Modified
- `index.html` fully cleaned up: right panel and left panel no longer contain placeholder inline-styled inputs (now delegated to `PropertiesPanel` and `Toolbox` JS modules); SEO meta description added.
- `src/main.js` to wire the `btn-export-png` toolbar button to `exportPNG(appState)` and to import the updated `exportPNG` export.

---
## MVP Complete — All 10 Phases Delivered
The VeroStudio perfboard designer MVP is fully implemented and ready for deployment to GitHub Pages.
