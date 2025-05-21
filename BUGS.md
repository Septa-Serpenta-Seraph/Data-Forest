# Data Tree - Bug List

## Drag and Drop
*   **File Disappearance (Intermittent):** Occasionally, a file can disappear entirely after a drag-and-drop operation. Steps to reproduce are currently unknown. (Reported: 2025-05-21 by Adora)
    *   *Note to Dev: Investigate `moveNode` logic, especially edge cases in `findNodeDetails` or list splicing, and ensure `draggedNodeId` is always valid and cleared appropriately. Check for race conditions or incorrect state updates during rapid drag operations.*
    *   **Update (2025-05-21):** Extensive console logging added to `dragstart`, `dragover`, `drop`, `findNodeById`, `findNodeDetails`, `isDescendant`, and `moveNode` functions in `script.js` to help diagnose this. Further direct investigation deferred to prioritize Phase 3. Logs will be available for future debugging sessions.
*   **General "Jank" (Drop Indicator Misalignment):** Some drag-and-drop interactions, particularly reordering top-level items, feel imprecise. The blue drop indicator bar can be misaligned with the mouse cursor. (Reported: 2025-05-21 by Adora with screenshots).
    *   **Update (2025-05-21):** Enhanced logging in `dragover` (coordinate calculations, target element details) added to `script.js` to help diagnose. Further direct investigation deferred to prioritize Phase 3. Logs will be available for future debugging.
