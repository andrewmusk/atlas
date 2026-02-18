# Subsystem: Status & Changelog Engine

**ID:** CLOG  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Tracks the lifecycle of every node. Every status transition and every edit to a requirement payload is logged with a timestamp and author. This is the data that makes snapshots, diffs, and requirement versioning possible.

---

## Capabilities

| ID | Description |
|---|---|
| CLOG-CAP-001 | Manage and enforce status transitions per node |
| CLOG-CAP-002 | Version requirement payloads on every edit |
| CLOG-CAP-003 | Produce project-level state summaries |

---

## Interfaces

**Inputs from:** Project & Hierarchy Management (node graph), any subsystem that triggers a status change  
**Outputs to:** Snapshot & Diff Engine (reads all node states from here), API Layer (exposes status + changelog)

---

## Requirements

### CLOG-REQ-001
**Capability:** CLOG-CAP-001  
**Type:** Functional  
**Statement:** The system shall track status for every node using the values: `not_started`, `building`, `built`, `deprecated`.  
**Acceptance Criteria:**
- Default status on node creation is `not_started`
- Status field is required and always present on any node
- Invalid status values are rejected

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### CLOG-REQ-002
**Capability:** CLOG-CAP-001  
**Type:** Constraint  
**Statement:** The system shall enforce valid status transitions: `not_started → building → built`, and `any → deprecated`.  
**Acceptance Criteria:**
- Attempting an invalid transition (e.g. `not_started → built`) returns an error
- `deprecated` can be set from any status
- Transition from `built` back to `building` is allowed (for rework) but logged with a note

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CLOG-REQ-001

---

### CLOG-REQ-003
**Capability:** CLOG-CAP-001  
**Type:** Functional  
**Statement:** The system shall log every status transition with a timestamp and author.  
**Acceptance Criteria:**
- Each log entry contains: previous status, new status, timestamp, author ID, author type (human | agent)
- Transition log is append-only — never overwritten
- Log is accessible via the node's changelog field

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CLOG-REQ-001

---

### CLOG-REQ-004
**Capability:** CLOG-CAP-002  
**Type:** Functional  
**Statement:** The system shall version requirement payloads on every edit, storing the full previous version in the changelog.  
**Acceptance Criteria:**
- Every save of a requirement payload creates a new version entry
- Each version entry stores: version number, timestamp, author, full previous payload snapshot, and a field-level diff summary
- Previous versions are retrievable by version index
- Non-requirement nodes log edits but do not store full payload versions

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-003

---

### CLOG-REQ-005
**Capability:** CLOG-CAP-003  
**Type:** Functional  
**Statement:** The system shall produce a project-level state summary showing node counts by status across all types.  
**Acceptance Criteria:**
- Summary is computable on demand
- Breakdown available at project level and per subsystem
- Summary includes: total nodes, count per status, count per type

**Priority:** Should  
**Status:** not_started  
**Dependencies:** CLOG-REQ-001
