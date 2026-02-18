# Atlas — System Spec

## Overview

**Name:** Atlas  
**Mission:** Give agents and humans a shared, queryable state of what a company is building — so that at any point in time you can say "this is the company" and agents can act on it.  
**Primary Users:** Founders/builders (defining and reviewing state), agents (reading state and updating it as work lands)

---

## Scope

**In Scope (v1)**
- Project, system, subsystem, capability, requirement, and flow management
- Node-scoped chat with attachments
- Status tracking and changelogs
- Requirement versioning
- Company state snapshots and diffs
- REST API for external app integration
- Builder UI for human navigation and editing

**Out of Scope (v1)**
- Native CI/CD integration (handled via webhooks/API)
- Multi-user permissions and roles
- Billing
- Real-time collaboration (multiple humans editing simultaneously)

---

## Success Metrics

- An agent given a node ID + context can start building without asking clarifying questions
- The full state of a project can be exported and used to regenerate it elsewhere
- Requirements can be diffed across two points in time
- Any subsystem's chat history is loadable as a structured agent context payload

---

## Constraints

- API must be queryable from external apps
- Chat history per node must be exportable as structured JSON
- Node schema must be stable enough to version
- Snapshot exports must be re-importable to seed a new project

---

## Subsystem Map

```
Atlas
├── Project & Hierarchy Management    (core graph — owns all nodes)
├── Status & Changelog Engine         (status transitions + requirement versioning)
├── Chat System                       (node-scoped conversations + attachments)
├── Attachment Manager                (files, links, references on any node)
├── Snapshot & Diff Engine            (point-in-time snapshots + diffs)
├── API Layer                         (external HTTP interface)
└── UI — Builder Interface            (human-facing app)
```

### Subsystem Interfaces

| From | To | What |
|---|---|---|
| All subsystems | Project & Hierarchy | Read node graph |
| Status & Changelog | Snapshot & Diff | Feeds all node states |
| Chat System | Attachment Manager | File/link attachments in chat |
| Chat System | Project & Hierarchy | Reads node context |
| API Layer | All subsystems | Wraps everything externally |
| UI | API Layer | All reads/writes go through API |

---

## Key Flows

### Happy Path: Adding a requirement

1. User navigates to a subsystem in the UI
2. Selects a capability and creates a new requirement
3. Fills in statement, acceptance criteria, priority
4. Status defaults to `not_started`
5. Requirement is assigned an ID and saved to the graph
6. Requirement is immediately queryable via API

### Happy Path: Agent builds a requirement

1. Agent queries API for a subsystem's `not_started` requirements
2. Agent marks target requirement as `building`
3. Agent loads node-scoped chat for context (prior decisions, notes)
4. Agent builds, posts updates to node chat as it goes
5. Agent marks requirement as `built`
6. Changelog records the full transition history

### Happy Path: State snapshot

1. User or agent requests a project snapshot
2. Atlas serializes the full node graph with all current statuses and payloads
3. Snapshot is saved as immutable, timestamped record
4. User can diff against any prior snapshot to see evolution

### Exception: Requirement changes mid-build

1. User edits a requirement statement while status is `building`
2. Changelog records the change: old value, new value, timestamp, author
3. Agent polling the node (or listening via webhook) detects the update
4. Agent re-reads the requirement, posts acknowledgment to node chat, continues or flags conflict

### Exception: Circular dependency detected

1. User or agent attempts to add a dependency edge that creates a cycle
2. System detects the cycle before saving
3. Returns a descriptive error identifying the cycle path
4. Node is not saved in invalid state

### Operational Flow: Starting a new project

1. User creates a Project node with name, mission, constraints
2. User (or agent) creates System node under the project
3. User (or agent) defines Subsystems with purpose, inputs, outputs, interfaces
4. Capabilities are added to each subsystem
5. Requirements are written per capability
6. Initial snapshot is taken — this is the "day zero" state
7. Agents begin picking up `not_started` requirements

---

## Open Questions

1. **Snapshot triggers** — manual only, or also auto-snapshot on every status transition to `built`? Auto-snapshots would make diffs more granular but create noise.

2. **Agent identity in chat** — how is an agent identified in a chat thread? By model + session ID? By a named agent persona defined in the project? This affects how chat history reads back.

3. **Flows as first-class nodes** — should flows have status (so you can track "this flow is validated") or remain as documentation attached to requirements? First-class adds power, adds complexity.

4. **UI scope for v1** — minimal read/write UI, or does v1 need to feel like a real product? Affects build prioritization significantly.
