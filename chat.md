# Subsystem: Chat System

**ID:** CHAT  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Node-scoped conversations between humans and agents. Every chat thread is attached to a specific node and exists only within that context. Chat history is a first-class artifact — it's loadable as agent context, making it part of the working memory for any node over time.

---

## Capabilities

| ID | Description |
|---|---|
| CHAT-CAP-001 | Create and retrieve chat threads scoped to a node |
| CHAT-CAP-002 | Support messages from human users and agents |
| CHAT-CAP-003 | Export chat thread as structured agent context payload |
| CHAT-CAP-004 | Support cross-node references within messages |
| CHAT-CAP-005 | Support attachments within chat |

---

## Interfaces

**Inputs from:** User or agent messages scoped to a node ID  
**Outputs to:** Node context payloads for agents  
**Reads:** Project & Hierarchy Management for node metadata and context  
**Uses:** Attachment Manager for file/link attachments in chat  
**Exposed via:** API Layer

---

## Requirements

### CHAT-REQ-001
**Capability:** CHAT-CAP-001  
**Type:** Functional  
**Statement:** The system shall support a single chat thread per node, created automatically on first message.  
**Acceptance Criteria:**
- One thread per node — not multiple parallel threads
- Thread is created automatically when the first message is sent to a node
- Thread is retrievable by node ID
- If no messages exist for a node, returns empty thread (not 404)

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### CHAT-REQ-002
**Capability:** CHAT-CAP-002  
**Type:** Functional  
**Statement:** The system shall record each message with author ID, author type, timestamp, and content.  
**Acceptance Criteria:**
- Author type is either `human` or `agent`
- Timestamp is recorded in UTC
- Content supports plain text at minimum; markdown rendering is a UI concern
- Messages are append-only — no editing or deletion

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CHAT-REQ-001

---

### CHAT-REQ-003
**Capability:** CHAT-CAP-003  
**Type:** Functional  
**Statement:** The system shall export a node's chat thread as a structured JSON context payload for agent consumption.  
**Acceptance Criteria:**
- Export includes: node ID, node type, node payload (full spec), and full message history in chronological order
- Export is available via API endpoint
- Format is JSON
- Export can be requested for any node regardless of whether it has messages

**Priority:** Must  
**Status:** not_started  
**Dependencies:** CHAT-REQ-001, HIER-REQ-002

---

### CHAT-REQ-004
**Capability:** CHAT-CAP-004  
**Type:** Functional  
**Statement:** The system shall parse and resolve node ID references within message content.  
**Acceptance Criteria:**
- Node IDs mentioned in a message (e.g. `HIER-REQ-001`) are detected and resolved to node metadata
- Resolved references are included in the context export as a `referenced_nodes` array
- If a referenced node ID doesn't exist, the reference is flagged but the message is still saved

**Priority:** Should  
**Status:** not_started  
**Dependencies:** CHAT-REQ-001, HIER-REQ-002

---

### CHAT-REQ-005
**Capability:** CHAT-CAP-005  
**Type:** Functional  
**Statement:** The system shall support attaching files and links to individual chat messages.  
**Acceptance Criteria:**
- A message can have zero or more attachments
- Attachment types: file upload, external link, or reference to another node
- Attachments are stored via Attachment Manager
- Attachments are included in the context export

**Priority:** Should  
**Status:** not_started  
**Dependencies:** CHAT-REQ-001
