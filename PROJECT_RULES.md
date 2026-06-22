# VeroStudio Permanent Project Rules

## Architecture Principles
1. **Unidirectional Data Flow**: User events trigger commands -> Commands mutate AppState -> AppState fires events -> Renderers redraw canvas.
2. **Zero-Build Requirement**: Direct GitHub Pages execution. Native ES Modules with full file names including extension (e.g. `./core/app-state.js`).
3. **Decoupled Render Logic**: Views do not compute state, and models do not draw directly. Renderers read from AppState and paint on Canvas 2D.
4. **Command Pattern**: All mutations affecting the circuit must be Undoable/Redoable using Command objects.

## Folder Structure
All application source code resides under `/src/`:
- `src/core/`: Application state and transaction managers.
- `src/canvas/`: Canvas managers, rendering layers, viewports.
- `src/tools/`: Interaction tools implementing a state machine.
- `src/components/`: Definition registry for components.
- `src/models/`: Logic models representing components, wires, labels.
- `src/ui/`: UI controller widgets (sidebars, dialogs, property panels).
- `src/utils/`: Math, layout calculations, and file loaders.

## Naming Conventions
- **Files**: kebab-case (e.g., `app-state.js`, `select-tool.js`).
- **Classes**: PascalCase (e.g., `AppState`, `SelectTool`).
- **Functions & Variables**: camelCase (e.g., `screenToGrid()`, `gridSpacing`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `GRID_SPACING = 24`).

## Coding Standards
1. **File Size Limit**: Keep files under ~300 lines of code. Split complex classes into helper modules if needed.
2. **Single Responsibility (SRP)**: A module, class, or function should do exactly one thing.
3. **ES6 Classes**: Standardize on classes for models, tools, and commands where instance state is beneficial.
4. **JSDoc**: Document all public classes, constructors, methods, parameters, types, and return values.
5. **No Globals**: Avoid modifying global namespaces. Access shared features through dependency injection or explicit imports.

## Rendering Philosophy
- Use HTML5 Canvas 2D for the entire design workspace (Grid, Wires, Components, Labels, Selection).
- Render elements in layers: background (grid holes) -> main items (wires, components, labels) -> interaction overlay (selection bounding box, drag previews).
- Use canvas coordinates mapped via `Viewport` scale/translation matrices.

## Component Registration Rules
Adding a component must require changes only to:
- A component definition file (`src/components/definitions.js` or separate files).
- The registry initialization (`src/components/registry.js`).
- Each definition must provide: `type`, visual `draw` function, `pins` (relative positions), and `defaultProperties`.
