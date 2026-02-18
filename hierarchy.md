# Subsystem: Project & Hierarchy Management

**ID:** HIER  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Owns the creation and organization of the full node graph: projects, systems, subsystems, capabilities, requirements, and flows. This is the core data layer — everything else in Atlas builds on top of it.

---

## Capabilities

| ID | Description |
|---|---|
| HIER-CAP-001 | Create, read, update, and delete any node type |
| HIER-CAP-002 | Enforce parent-child hierarchy rules |
| HIER-CAP-003 | Manage dependency edges between nodes |
| HIER-CAP-004 | Assign and validate node IDs |

---

## Interfaces

**Outputs to:** All other subsystems read node data from this subsystem  
**Inputs from:** Status & Changelog Engine writes status and changelog back to nodes; API Layer exposes all CRUD operations externally

---

## Requirements

### HIER-REQ-001
**Capability:** HIER-CAP-001  
**Type:** Functional  
**Statement:** The system shall support creating nodes of type: project, system, subsystem, capability, requirement, flow.  
**Acceptance Criteria:**
- Each node type has its own required and optional fields
- Node creation validates required fields before saving
- Missing required fields return a descriptive validation error

**Priority:** Must  
**Status:** not_started  
**Dependencies:** none

---

### HIER-REQ-002
**Capability:** HIER-CAP-001  
**Type:** Functional  
**Statement:** The system shall support reading a single node by ID, returning its full payload, status, parent, dependencies, and attachments.  
**Acceptance Criteria:**
- GET by node ID returns all fields
- Non-existent node ID returns a 404 with descriptive message

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### HIER-REQ-003
**Capability:** HIER-CAP-001  
**Type:** Functional  
**Statement:** The system shall support updating the payload of any node.  
**Acceptance Criteria:**
- Update is partial (only provided fields are changed)
- Update triggers a changelog entry via Status & Changelog Engine
- updated_at timestamp is refreshed on every update

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### HIER-REQ-004
**Capability:** HIER-CAP-002  
**Type:** Constraint  
**Statement:** The system shall enforce a strict parent-child hierarchy: project → system → subsystem → capability → requirement.  
**Acceptance Criteria:**
- A requirement cannot be created without a parent capability
- A capability cannot be created without a parent subsystem
- Violations return a descriptive error identifying the constraint broken

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### HIER-REQ-005
**Capability:** HIER-CAP-003  
**Type:** Functional  
**Statement:** The system shall support declaring dependency edges between requirement nodes.  
**Acceptance Criteria:**
- A requirement can reference one or more other requirement IDs as dependencies
- Dependencies are returned when the requirement node is fetched
- Attempting to delete a node that is depended on returns a warning

**Priority:** Should  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### HIER-REQ-006
**Capability:** HIER-CAP-003  
**Type:** Constraint  
**Statement:** The system shall detect and reject circular dependency edges.  
**Acceptance Criteria:**
- Before saving a new dependency edge, the system checks for cycles in the full dependency graph
- If a cycle is detected, the save is rejected with an error identifying the cycle path
- No node is saved in an invalid state

**Priority:** Should  
**Status:** not_started  
**Dependencies:** HIER-REQ-005

---

### HIER-REQ-007
**Capability:** HIER-CAP-004  
**Type:** Functional  
**Statement:** The system shall auto-generate unique, human-readable IDs for each node based on subsystem and type.  
**Acceptance Criteria:**
- IDs follow the format `[SUBSYSTEM-ABBREV]-[TYPE-ABBREV]-[NNN]` (e.g. `HIER-REQ-001`)
- IDs are unique within the project
- IDs are immutable once assigned
- The NNN counter increments per subsystem per type

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### HIER-REQ-008
**Capability:** HIER-CAP-001  
**Type:** Functional  
**Statement:** The system shall support listing all children of a node (e.g. all requirements under a capability, all subsystems under a system).  
**Acceptance Criteria:**
- List endpoint accepts a parent node ID and optional type filter
- Returns all direct children matching the filter
- Returns empty array (not error) if no children exist

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001
