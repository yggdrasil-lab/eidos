# Project Eidos 🧿

*The Idea dimension for the AI-Native Platform.*

Eidos is the central, structured data backend for the homelab architecture. Transitioning from a passive repository of Markdown files, Eidos acts as the active intelligence infrastructure. It stores quantitative, time-series data (Health, Wealth, Career, Relationships) in an infinitely flexible hybrid JSON database, built specifically to interface with LLMs via the Model Context Protocol (MCP) and serve applications via GraphQL.

## Architecture

* **The Idea Dimension (Database):** A dedicated **PostgreSQL** database container to support infinite concurrency and future SaaS monetization.
* **The Eidos Payloads (Schema):** A hybrid approach utilizing a single `Events` table with a native `JSONB` column, taking advantage of Postgres's ultra-fast GIN indexing for complex queries.
* **The Magic Sequence (MCP):** A Node.js MCP server exposing SSE (Server-Sent Events) over an Express HTTP server. This allows AI agents (like Hermes and Antigravity) to perform raw SQL analytics and batch data ingestion.
* **The Swarm (Deployment):** Fully containerized and deployed to the Gaia Linux homelab via Docker Swarm and GitHub Actions.

## Repository Structure (Monorepo)

To accommodate multiple interconnected applications, Eidos is structured as a monorepo:
* `/db/`: The single source of truth for database schemas (e.g., `init.sql`).
* `/services/mcp/`: The TypeScript MCP Server (Express + SSE Transport).
* `/services/graphql/`: *(Planned)* The GraphQL API for serving Android clients.
* `/scripts/`: Reusable CI/CD ops-scripts (via git submodule).
* `.github/workflows/`: Automated CI/CD pipeline targeting the Gaia self-hosted runner.
* `init-server.sh`: Pre-deployment script to scaffold the necessary host directories on Gaia.

## Getting Started

### Local Development (Windows / Docker)
Because syncing `node_modules` over Google Drive causes file-locking friction, local development should be executed via Docker:

```bash
docker-compose up --build
```
*The MCP server will listen at `http://localhost:3000/sse`.*

### Deployment (Gaia)
Pushes to the `main` branch automatically trigger the `.github/workflows/deploy.yml` pipeline.
1. `init-server.sh` scaffolds the host paths (defaulting to `/opt/eidos/data`).
2. The image is built, tagged, and pushed to the local homelab registry.
3. The stack is deployed via Docker Swarm.

### Backups
Data redundancy is managed externally by the `charon` stack. The `charon/eidos-backup` cron service safely executes `pg_dump` on the live database at 02:00 AM, and `charon-archive` pushes the binary dump to Google Drive at 03:00 AM.

## Roadmap
- [x] Establish the core SQLite + JSON infrastructure.
- [x] Build the MCP Server for LLM integration.
- [ ] Develop the side-by-side GraphQL API layer.
- [ ] Build the first modular Android micro-app (e.g., Wealth or Health tracker).