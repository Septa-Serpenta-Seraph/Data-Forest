# Project: Data Tree / Data Forest Roadmap

**Core Idea:** A web application to visually represent and interact with file/folder structures, evolving into a 3D navigable forest.

**Current Workspace:** `c:/Users/Adora/Desktop/Data Tree`

**Current State:**
*   Phase 1 (Core Visual Tree with basic biological styling) implemented.
*   Phase 2.A (Add New Files/Folders - client-side) implemented.
*   Phase 2.B (Two-Stage File Content Viewer - inline preview & dedicated panel, with copy/download/edit access) implemented.

---

## Phase 1: Core Visual Tree (Completed)
*   **Objective:** Create a basic, interactive, client-side visual tree using static, hardcoded data with initial "biological" styling.
*   **Key Deliverables:**
    *   `index.html`: Basic page structure.
    *   `style.css`: Styles for tree, connector lines, nature-themed icons.
    *   `script.js`: Renders static data, handles expand/collapse.

## Phase 2: Enhanced Local Tree Functionality (Client-Side Enhancements)
*   **Objective:** Add more dynamic interactions to the client-side 2D tree.
*   **Sub-Phases & Features:**
    *   **2.A: Add New Files/Folders (Completed)**
        *   Global "Add New Root Tree" button.
        *   Contextual "[+]" buttons on folders to add files or sub-folders.
        *   Prompts for name and type.
        *   Unique ID generation for nodes.
    *   **2.B: Two-Stage File Content Viewer (Completed)**
        *   **Inline Preview:**
            *   Triggered by clicking file name.
            *   Shows content snippet.
            *   Action icons: View Full (👁️), Copy Content (📋), Download File (💾), Edit File (✏️), Close Preview (❌).
        *   **Dedicated Viewer Panel:**
            *   Triggered by "View Full (👁️)" icon from inline preview.
            *   Displays full file content in a modal-like panel.
            *   Controls: Copy Content, Download File, Close Panel.
        *   Functionality for copying content to clipboard and downloading file content implemented.
        *   Basic in-tree file content editing via "✏️" icon (opens textarea, save/cancel).
*   **Phase 2 Completion Summary:** All core planned features for client-side enhancements are implemented. Known issues include an intermittent bug with drag-and-drop file disappearance.
*   **Completed Features in Phase 2:**
    *   **2.A: Add New Files/Folders (Completed)**
    *   **2.B: Two-Stage File Content Viewer (Completed)**
    *   **2.C: Drag-and-Drop Manipulation (Completed*):** Supports dropping into folders and reordering. *Known intermittent bug with file disappearance.
    *   **2.D: "Automatic Mode" for Layout (Sorting via Menu) (Completed)**
    *   **2.E: Refine "Add Node" UX (Completed)**
    *   **2.F: Deleting Nodes (Completed)**

## Phase 3: API Integration & "Data Forest" Backend (Future Full-Stack Vision)
*   **Objective:** Evolve the application into a persistent, multi-user system with API capabilities for LLM and external integrations, supporting the 2D tree view.
*   **Key Components:** Backend Server, Database, RESTful/GraphQL API, Real-time Communication (WebSockets), LLM Integration capabilities.
*   **Selected Technology Stack (as of 2025-05-21):**
    *   **Core Services (Networking, Concurrency, Mycelial Network Logic):** Go
    *   **LLM/Agent API Layer (Tasking, Agent Management, UI-facing API):** Python (FastAPI)
    *   **Database:** Neo4j (Graph Database)
    *   **Inter-Service Communication:** Primarily gRPC, potentially Message Queues (e.g., NATS, RabbitMQ).

## Phase 4: 3D Navigable Data Forest (Ultimate Vision)
*   **Objective:** Transform the "Data Forest" into an immersive, navigable 3D environment.
*   **Key Technologies & Concepts:** WebGL (e.g., Three.js, Babylon.js), 3D Assets, Navigation Controls, Interaction with 3D trees, Spatial Search, Performance Optimization, Integration with Backend.

---
