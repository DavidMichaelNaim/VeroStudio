# VeroStudio Known Issues & Technical Limitations

| Issue ID | Description | Phase Logged | Status | Workaround / Resolution |
|---|---|---|---|---|
| KI-001 | Offscreen canvas and spatial indices deferred for MVP | Phase 1 | Deferred | Direct loop rendering is sufficient for MVP-sized perfboards (e.g. up to 100x100 grid cells). |
| KI-002 | `commands.js` exceeds 300-line file limit (~540 lines) | Phase 5 | Accepted | All commands are co-located in one file for import simplicity. No functional issue. Can be split into domain-specific files in a future refactor. |
| KI-003 | Wire Tool uses single-click vertex model; no orthogonal auto-routing | Phase 7 | Deferred | Freeform multi-point wires are placed by clicking each vertex. Orthogonal snapping and auto-routing are post-MVP features. |
| KI-004 | Export PNG renders at fixed 24px/unit (zoom 1.0); does not capture the screen viewport | Phase 10 | By Design | The offscreen canvas renders the full board at 1:1 scale for deterministic pixel output. A viewport-matched export option can be added in the future. |
| KI-005 | Context menu must be shown on canvas; component right-click from panel is not supported | Phase 8 | By Design | The ContextMenu listener is bound to the canvas element. Properties panel interactions use dedicated action buttons. |
| KI-006 | LED color property in the ComponentsRenderer uses only the `color` property from the definition; live re-draw requires a redraw trigger | Phase 5 | Working | Changing LED color via the Properties Panel issues `UpdateComponentPropertyCommand`, which triggers `updateProject` → `emit('change')` → canvas redraw. |
