# Subsystem: Snapshot & Diff Engine

**ID:** SNAP  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Produces point-in-time snapshots of the full project state and diffs between any two snapshots. The foundation for "this is the company at t=now" and for regenerating a project from a prior state.

---

## Capabilities

| ID | Description |
|---|---|
| SNAP-CAP-001 | Generate named or timestamped snapshots of the full node graph |
| SNAP-CAP-002 | Diff two snapshots to produce a structured change summary |
| SNAP-CAP-003 | Export a snapshot as a portable, re-importable JSON document |

---

## Interfaces

**Inputs from:** Status & Changelog Engine (all current node states and changelogs)  
**Exposed via:** API Layer

---

## Requirements

### SNAP-REQ-001
**Capability:** SNAP-CAP-001  
**Type:** Functional  
**Statement:** The system shall generate a full snapshot of the project node graph on demand, capturing all node payloads and statuses at the moment of the request.  
**Acceptance Criteria:**
- Snapshot captures every node in the project with its full payload and current status
- Snapshot is timestamped automatically
- Snapshot can optionally be given a human-readable name
- Snapshots are immutable once created

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CLOG-REQ-001, HIER-REQ-002

---

### SNAP-REQ-002
**Capability:** SNAP-CAP-001  
**Type:** Functional  
**Statement:** The system shall list all snapshots for a project in reverse chronological order.  
**Acceptance Criteria:**
- List returns: snapshot ID, name (if set), timestamp, node count
- Oldest and newest snapshots are always identifiable

**Priority:** Must  
**Status:** not_started  
**Dependencies:** SNAP-REQ-001

---

### SNAP-REQ-003
**Capability:** SNAP-CAP-002  
**Type:** Functional  
**Statement:** The system shall produce a structured diff between any two snapshots of the same project.  
**Acceptance Criteria:**
- Diff identifies: nodes added, nodes removed, status changes, payload changes
- Payload changes show field-level old vs. new values
- Diff is structured JSON
- Diff can be requested between any two snapshot IDs, including non-adjacent ones

**Priority:** Must  
**Status:** not_started  
**Dependencies:** SNAP-REQ-001

---

### SNAP-REQ-004
**Capability:** SNAP-CAP-003  
**Type:** Functional  
**Statement:** The system shall export any snapshot as a standalone JSON document that can be re-imported to seed a new project.  
**Acceptance Criteria:**
- Export includes: full node graph, all changelogs, all statuses, all requirement versions
- An import endpoint accepts the export JSON and recreates the full project state
- Re-imported projects are independent copies — changes don't sync back to the original

**Priority:** Should  
**Status:** not_started  
**Dependencies:** SNAP-REQ-001
