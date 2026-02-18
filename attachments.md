# Subsystem: Attachment Manager

**ID:** ATTCH  
**Status:** not_started  
**Parent System:** Atlas

---

## Purpose

Handles files, links, images, and node references attached to any node or chat message. Lightweight — stores metadata and references rather than large blobs natively. The goal is to make any node a rich context container without Atlas becoming a file storage system.

---

## Capabilities

| ID | Description |
|---|---|
| ATTCH-CAP-001 | Attach and retrieve files, links, and node references on any node |
| ATTCH-CAP-002 | Attach files and links to individual chat messages |

---

## Interfaces

**Inputs from:** Any node create/update that includes attachments; Chat System for message attachments  
**Outputs to:** Node fetch responses include attachment metadata; Chat context exports include attachments

---

## Requirements

### ATTCH-REQ-001
**Capability:** ATTCH-CAP-001  
**Type:** Functional  
**Statement:** The system shall support attaching items of type `file`, `link`, and `node_reference` to any node.  
**Acceptance Criteria:**
- Each attachment has: id, type, label, value (URL or node ID), and created_at
- Attachments are returned as an array in the node's response
- Multiple attachments per node are supported

**Priority:** Must  
**Status:** not_started  
**Dependencies:** HIER-REQ-001

---

### ATTCH-REQ-002
**Capability:** ATTCH-CAP-001  
**Type:** Functional  
**Statement:** The system shall store file attachment metadata (name, type, size, URL) but not host file storage natively in v1 — files are referenced by external URL.  
**Acceptance Criteria:**
- File attachments store: filename, mime type, file size, and a URL pointing to the file's location
- Atlas does not serve file content — it stores the reference only
- This constraint is documented clearly in the API response

**Priority:** Must  
**Status:** not_started  
**Dependencies:** ATTCH-REQ-001

---

### ATTCH-REQ-003
**Capability:** ATTCH-CAP-002  
**Type:** Functional  
**Statement:** The system shall support attaching items to individual chat messages.  
**Acceptance Criteria:**
- A message can have zero or more attachments
- Attachment types are the same as node attachments (file, link, node_reference)
- Message attachments are included in the chat context export

**Priority:** Should  
**Status:** not_started  
**Dependencies:** ATTCH-REQ-001, CHAT-REQ-002
