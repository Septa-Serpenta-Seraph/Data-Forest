# Data-Forest

Welcome to the Data-Forest project!

This project aims to create a dynamic environment for visualizing, managing, and interacting with hierarchical data structures, evolving into a "Data Forest" with backend persistence, API capabilities for LLM integration, bot orchestration, and eventually a 3D navigable interface.

## Current Structure

-   `frontend/`: Contains the client-side Data Tree application (HTML, CSS, JavaScript).
-   `backend/`: Will house the backend services.
    -   `go_services/`: For core services written in Go.
    -   `python_api/`: For the Python/FastAPI service handling LLM/Agent interactions.
    -   `proto/`: For shared Protocol Buffer definitions (if using gRPC).
-   `docs/`: Contains project documentation like `BUGS.md` and `ROADMAP.md`.
-   `scripts/`: For utility and automation scripts.

## Development Prerequisites

To contribute to or run this project locally, you will need the following installed:

-   **Git:** For version control.
-   **Docker Desktop:** For running containerized services, particularly Neo4j. Ensure it's configured to use WSL 2 on Windows if applicable.
-   **Go:** The Go programming language (latest stable version recommended) for core backend services.
-   **Python:** Python (version 3.8+ recommended) for the LLM/Agent API layer.
-   **Neo4j:** While it will be run via Docker for development, understanding its basics will be helpful.

(Specific version numbers and further setup details for Go and Python services will be added as they are developed.)

## Getting Started

(To be filled in as backend services are developed)
