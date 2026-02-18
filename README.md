# Atlas

Atlas is a company state machine — a living, queryable representation of what a company is building, what's been built, and what's changed over time. It is the source of truth that agents build from and report back to.

At any point in time, Atlas represents the full state of a company: its systems, subsystems, capabilities, requirements, and the conversations around them. That state can be snapshotted, diffed, and used to regenerate the company from scratch.

---

## Core Concepts

**Project** — the top-level container. A company, product, or initiative.

**System** — the highest-level architectural boundary within a project. Usually one per product.

**Subsystem** — a major functional area that can be built somewhat independently. Has defined inputs, outputs, and interfaces to other subsystems.

**Capability** — what a subsystem must be able to do. Functional clusters, implementation-agnostic.

**Requirement** — an atomic, testable statement of what the system shall do. Traceable to a capability. The primary unit of work for agents.

**Flow** — a scenario (happy path, exception, or operational) that exercises a set of requirements end-to-end.

**Chat** — a conversation scoped to a specific node (system, subsystem, capability, or requirement). Carries only the context relevant to that node.

---

## Node Status

Every node carries a status:

| Status | Meaning |
|---|---|
| `not_started` | Defined but no work begun |
| `building` | Actively being worked on |
| `built` | Complete and verified |
| `deprecated` | No longer relevant — kept for history |

Status transitions are timestamped and logged. Requirements additionally version their full payload on every edit.

---

## Data Model

Every entity in Atlas is a node:

```json
{
  "id": "HIER-REQ-001",
  "type": "requirement",
  "status": "not_started",
  "parent_id": "HIER-CAP-001",
  "dependencies": ["HIER-REQ-002"],
  "payload": {
    "statement": "The system shall...",
    "acceptance_criteria": ["..."],
    "priority": "must",
    "type": "functional",
    "risks": "...",
    "notes": "..."
  },
  "attachments": [],
  "created_at": "2026-02-17T00:00:00Z",
  "updated_at": "2026-02-17T00:00:00Z",
  "changelog": [
    {
      "timestamp": "2026-02-17T00:00:00Z",
      "author": "jeff",
      "author_type": "human",
      "change": "Created"
    }
  ]
}
```

The full graph of nodes at any timestamp is the **company state snapshot**.

---

## ID Format

IDs follow the pattern: `[SUBSYSTEM-ABBREV]-[TYPE]-[NNN]`

Examples:
- `HIER-REQ-001` — first requirement in the Hierarchy subsystem
- `CHAT-CAP-002` — second capability in the Chat subsystem
- `API-REQ-005` — fifth requirement in the API subsystem

IDs are immutable once assigned.

---

## Requirement Format

```
ID: [SUBSYSTEM-REQ-NNN]
Capability: [parent capability ID]
Type: Functional | Non-functional | Constraint
Statement: "The system shall..."
Acceptance Criteria:
  - ...
Priority: Must | Should | Could
Status: not_started | building | built | deprecated
Dependencies: [other REQ IDs]
Risks: ...
Changelog:
  - [timestamp] [author]: [what changed]
```

---

## Chat Architecture

Chats are first-class nodes. Every chat is scoped to a specific node and carries only that node's context.

- When an agent works on a requirement, it loads the requirement node + scoped chat history as its full context
- Conversations don't bleed across subsystems
- Chat history for a node is part of its record — a log of decisions, questions, and rationale
- Chat threads are exportable as structured JSON context payloads for agent consumption

---

## Attachments

Any node can have attachments:
- Files (designs, diagrams, docs)
- Links (PRs, external references)
- Images
- References to other nodes

---

## The First Project

Atlas is built inside Atlas. The spec in this repo describes Atlas itself as the first project — so building Atlas is simultaneously validating the approach.
