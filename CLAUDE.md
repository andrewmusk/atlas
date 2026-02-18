# Atlas — Claude Code Instructions

## What is Atlas

Atlas is a company state machine. It is the source of truth for what a company is building, what's been built, and what's changed over time. Agents and humans share this state — agents build from it and update it as work lands.

## How to orient yourself

When starting a build session, read in this order:

1. `README.md` — what Atlas is and the core data model
2. `system-spec.md` — subsystem boundaries, key flows, open questions
3. The relevant subsystem file in `subsystems/` for whatever you're building

## How to work

- Every buildable unit of work maps to a **requirement** in a subsystem file. Requirements have IDs (e.g. `HIER-REQ-001`), acceptance criteria, and a status.
- Before building anything, identify which requirement(s) you're implementing.
- When you complete a requirement, note it. The goal is to update status from `not_started` → `building` → `built`.
- If you need to change a requirement (scope shift, new edge case), document what changed and why before proceeding.
- If you encounter something not covered by any requirement, flag it as a new requirement candidate rather than silently building it.

## Node hierarchy

```
Project → System → Subsystem → Capability → Requirement
```

Atlas itself is the first project. You are building Atlas.

## Status values

- `not_started` — defined, no work begun
- `building` — actively in progress
- `built` — complete and verified
- `deprecated` — no longer relevant

## Tech decisions

Tech stack is not locked in this spec — that's a build-time decision. The spec is implementation-agnostic. When you start building, propose a stack that fits the constraints in `system-spec.md` and confirm before proceeding.

## Key constraints

- The API layer must be queryable from external apps
- Chat history per node must be exportable as a structured JSON context payload for agents
- The node schema must be stable enough to version (think carefully before changing it)
- Snapshots must be portable — a snapshot export should be re-importable to seed a new project
