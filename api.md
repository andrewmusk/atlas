# Subsystem: API Layer

**ID:** API  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Exposes the full Atlas state to external applications and agents via HTTP. Read and write access to nodes, status, chat, and snapshots. This is what makes Atlas queryable from other apps and what agents use to update state as work lands.

---

## Capabilities

| ID | Description |
|---|---|
| API-CAP-001 | Read any node or set of nodes |
| API-CAP-002 | Update node status |
| API-CAP-003 | Create and update nodes (requirements, capabilities, etc.) |
| API-CAP-004 | Read and post to node chat threads |
| API-CAP-005 | Request and retrieve snapshots and diffs |

---

## Interfaces

**Wraps:** All other subsystems  
**Consumed by:** External apps, agents, UI (all UI reads/writes go through API)

---

## Requirements

### API-REQ-001
**Capability:** API-CAP-001  
**Type:** Functional  
**Statement:** The system shall expose an endpoint to read any node by ID, returning its full payload, status, parent, dependencies, and attachments.  
**Acceptance Criteria:**
- `GET /nodes/:id` returns full node data
- Non-existent ID returns 404 with message
- Unauthorized requests return 401

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-002

---

### API-REQ-002
**Capability:** API-CAP-001  
**Type:** Functional  
**Statement:** The system shall expose an endpoint to list all children of a node, with optional type filtering.  
**Acceptance Criteria:**
- `GET /nodes/:id/children?type=requirement` returns matching children
- Returns empty array (not 404) when no children exist

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-008

---

### API-REQ-003
**Capability:** API-CAP-002  
**Type:** Functional  
**Statement:** The system shall expose an endpoint to update a node's status.  
**Acceptance Criteria:**
- `PATCH /nodes/:id/status` accepts `{ "status": "building", "author": "agent-id", "author_type": "agent" }`
- Transition rules are enforced
- Change is logged in the changelog with the provided author
- Invalid transitions return 400 with a description

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CLOG-REQ-002

---

### API-REQ-004
**Capability:** API-CAP-003  
**Type:** Functional  
**Statement:** The system shall expose endpoints to create and update nodes.  
**Acceptance Criteria:**
- `POST /nodes` creates a node with the provided type, parent, and payload
- `PATCH /nodes/:id` updates a node's payload (partial update)
- Both endpoints validate hierarchy rules and required fields
- Creation returns the full created node including assigned ID

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001, HIER-REQ-004

---

### API-REQ-005
**Capability:** API-CAP-004  
**Type:** Functional  
**Statement:** The system shall expose an endpoint to retrieve a node's chat thread as a structured context payload.  
**Acceptance Criteria:**
- `GET /nodes/:id/chat` returns node metadata, full payload, and message history
- Response format is JSON suitable for direct agent consumption
- Returns empty message history (not 404) if no messages exist

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CHAT-REQ-003

---

### API-REQ-006
**Capability:** API-CAP-004  
**Type:** Functional  
**Statement:** The system shall expose an endpoint to post a message to a node's chat thread.  
**Acceptance Criteria:**
- `POST /nodes/:id/chat` accepts `{ "content": "...", "author": "id", "author_type": "human|agent" }`
- Message is appended to the thread
- Returns the created message with timestamp

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CHAT-REQ-002

---

### API-REQ-007
**Capability:** API-CAP-005  
**Type:** Functional  
**Statement:** The system shall expose endpoints to create snapshots and retrieve diffs.  
**Acceptance Criteria:**
- `POST /projects/:id/snapshots` creates a snapshot and returns its ID and timestamp
- `GET /projects/:id/snapshots` lists all snapshots
- `GET /projects/:id/diff?from=snap_id&to=snap_id` returns a structured diff object

**Priority:** Should  
**Status:** not_started  
**Dependencies:** SNAP-REQ-001, SNAP-REQ-003

---

### API-REQ-008
**Capability:** API-CAP-001  
**Type:** Non-functional  
**Statement:** All API endpoints shall require authentication via API key.  
**Acceptance Criteria:**
- Requests without a valid API key return 401
- API keys are scoped to a project
- Key management (create/revoke) is handled outside v1 scope — keys are manually provisioned

**Priority:** Must  
**Status:** not_started  
**Dependencies:** none
