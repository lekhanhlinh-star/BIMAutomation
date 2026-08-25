# Project: RevitAPP Modernization & MCP Integration

## Architecture
RevitAPP is a professional structural engineering automation suite for Autodesk Revit (2022–2027) featuring:
1. **In-Revit Native Engine (.NET C#)**: High-performance single-threaded STA Revit API execution via `IExternalEventHandler` / `ExternalEvent` queue with atomic transactions, rollback protection, and license entitlement gating.
2. **Standardized Model Context Protocol (MCP) Server**: Streamable HTTP endpoint on loopback `http://127.0.0.1:8765/mcp` (MCP Spec `2025-11-25`) protected by 256-bit Bearer Token at `%LocalAppData%\RevitAPP\mcp-access-token.txt`. Exposes 57 structural BIM tools categorized into 8 functional groups.
3. **Web Platform & Client UI**: React 18 + Vite 6 + Tailwind CSS v4 web platform providing interactive hero prompt simulator, 57 MCP tools search/exploration hub, client JSON configuration snippets (Claude Desktop, Cursor), 5-tier license pricing matrix aligned with 12/13 Feature Codes, and unified `BIMAutomation` branding with `BIMAutomation` ribbon tab navigation.
4. **Backend Licensing & Entitlements**: Server-Authoritative Google OAuth 2.0 PKCE activation via `https://bimautomation.myminiserver.info` supporting 12 feature codes, 14-day anti-abuse hardware fingerprint trial, and automated installer `RevitAPP.Installer.exe`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Hero Headline & Copy | Exact copy "Gõ một câu. Revit tự vẽ xong hệ thép", description highlighting 57 MCP tools, 5 rebar tools, safe confirmation | M3 | ORIGINAL_REQUEST §R1 |
| 2 | Interactive Prompt Typewriter | Component showing 3 realistic scenarios (Column C7 preset, Beam Excel table, Footing V1 preset) | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Why AI Can Draw Rebar Section | 5 architecture pillars: Direct Engine, STA Threading ExternalEvent, Transaction Rollback, License Gate, Safe In-Revit Confirmation | M2 | ORIGINAL_REQUEST §R1 |
| 4 | AI Rebar Showcase & Pipeline | 5 AI Rebar tools (Column, Beam, Footing, Wall, Slab) + Continuous beam/footing sheet generation pipeline | M2 | ORIGINAL_REQUEST §R1 |
| 5 | Inaccurate Claims Purge | Remove MEP routing, standalone Auto Dimension, Batch Rename 500 Sheets, 2-way sync 10k params, fake testimonials | M3 | ORIGINAL_REQUEST §R1 |
| 6 | 18 Ribbon Commands Presentation | 4 panels on `BIMAutomation` tab: Rebar (5), Drawing Rebar (5), CAD Tools (4), Commands (4) | M3 | ORIGINAL_REQUEST §R2 |
| 7 | Interactive 57 MCP Tools Hub | 57 tools categorized across 8 groups with real-time search, category filtering, parameter detail cards | M2 | ORIGINAL_REQUEST §R2 |
| 8 | MCP Technical Endpoint Specs | Streamable HTTP `http://127.0.0.1:8765/mcp`, MCP spec `2025-11-25`, Loopback-only, Bearer Token 256-bit at `%LocalAppData%\RevitAPP\mcp-access-token.txt` | M1, M2 | ORIGINAL_REQUEST §R3 |
| 9 | External AI Client Config Boxes | One-click copy code snippets for `claude_desktop_config.json` and `.cursor/mcp.json` | M2 | ORIGINAL_REQUEST §R3 |
| 10 | Technical Documentation | Create `docs/revit_mcp.md` (full 57 tools & MCP specs) and update `docs/revit_addin_integration.md`, `README.md` | M1 | ORIGINAL_REQUEST §R3 |
| 11 | Pricing Matrix & 12 Feature Codes | 5 tiers (Trial 14 days, Rebar Suite, Rebar + AI Suite, Full Suite, Enterprise) matching 12 feature codes in backend | M3 | ORIGINAL_REQUEST §R4 |
| 12 | Download Page & Setup Requirements | Single installer `RevitAPP.Installer.exe` (Revit 2022–2027), Google OAuth PKCE activation via `https://bimautomation.myminiserver.info`, AutoCAD Full 2016+ requirement note | M3 | ORIGINAL_REQUEST §R4 |
| 13 | 9 Standardized Technical FAQs | Comprehensive answers covering TCVN 5574:2018, Revit safety, MCP security, Claude/Cursor integration, versions, Excel, AutoCAD, license portability, 14-day trial | M3 | ORIGINAL_REQUEST §R5 |
| 14 | Brand & Tab Standardization | Standardize name to **BIMAutomation** and tab to **BIMAutomation** across all pages, layouts, and docs | M3 | ORIGINAL_REQUEST §R5 |
| 15 | Verification & Zero-Error Build | `npm run build` with 0 errors, Vitest passing (49/49 tests pass), cross-device responsive UI with dark/light mode support | M4 | ORIGINAL_REQUEST §Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Technical Documentation & Specs | Create `docs/revit_mcp.md`, update `docs/revit_addin_integration.md`, `README.md` | none | DONE |
| M2 | Core Reusable UI Components | Build `HeroPromptTypewriter.jsx`, `McpToolsHub.jsx`, `WhyAiDrawsRebar.jsx`, `RebarShowcasePipeline.jsx`, `McpConfigSnippet.jsx` | M1 | DONE |
| M3 | Page Restructuring, Content & Branding | Update `HomePage.jsx`, `FeaturesPage.jsx`, `PricingPage.jsx`, `DownloadPage.jsx`, `FeatureComparisonTable.jsx`, `PublicLayout.jsx`, `BrandLogo.jsx`, `api/services.js` | M2 | DONE |
| M4 | Comprehensive Verification & Gate | Build verification (`npm run build`), Reviewers, Challengers, Forensic Auditor | M3 | DONE |

## Interface Contracts
### UI Components ↔ Pages Contract
- `HeroPromptTypewriter`: Self-contained interactive simulator component with scenario selector pills (Column C7, Beam Excel, Footing V1) and live typing terminal.
- `McpToolsHub`: Searchable catalog with 8 category tabs, search input state, tool modal/drawer, and copyable parameter JSON.
- `WhyAiDrawsRebar`: Responsive 5-card architectural grid detailing .NET engine, STA thread queue, Transaction rollback, License gate, and In-Revit confirmation dialog.
- `RebarShowcasePipeline`: 5 core rebar tool cards + 2 step-by-step visual pipelines (Beam Continuous Sheet, Footing Continuous Sheet).
- `McpConfigSnippet`: Tabbed code viewer (Claude Desktop / Cursor) with one-click copy and tooltip feedback.

### Backend ↔ Frontend Entitlements Contract
- 12/13 Feature Codes: `column-rebar`, `beam-rebar`, `footing-rebar`, `wall-rebar`, `beam-drawing`, `footing-drawing`, `chat-ai`, `utility-tools`, `mcp-read`, `mcp-write`, `model-from-cad`, `dwg-export`, `point-cloud`.
- 5 Tiers: Trial (all features, 14 days), Rebar Suite (manual rebar & drawings), Rebar + AI Suite (+ AI tools, MCP, chat), Full Suite (+ CAD tools, point cloud), Enterprise (+ multi-seat management & customization).

## Code Layout
- `docs/revit_mcp.md`: Full MCP protocol and 57 tools documentation.
- `docs/revit_addin_integration.md`: Add-in OAuth PKCE integration documentation.
- `README.md`: Root project documentation.
- `frontend/src/components/`:
  - `HeroPromptTypewriter.jsx`
  - `McpToolsHub.jsx`
  - `WhyAiDrawsRebar.jsx`
  - `RebarShowcasePipeline.jsx`
  - `McpConfigSnippet.jsx`
  - `FeatureComparisonTable.jsx`
  - `BrandLogo.jsx`
- `frontend/src/pages/public/`:
  - `HomePage.jsx`
  - `FeaturesPage.jsx`
  - `PricingPage.jsx`
  - `DownloadPage.jsx`
- `frontend/src/layouts/PublicLayout.jsx`
- `frontend/src/api/services.js`
