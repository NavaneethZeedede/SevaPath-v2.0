# SevaPath — Digital Government Case Lifecycle Prototype

A comprehensive prototype demonstrating a coordinated government case lifecycle system. SevaPath guides citizens through complex multi-department processes while providing officials with role-based work queues, SLA tracking, and escalation workflows.

## Quick Start

Open `portal.html` in a modern browser. No build step or server required.

### Demo Roles

| Role | What you can do |
|------|-----------------|
| **Citizen** | View case status, receive document requests, upload documents, track journey |
| **Officer** | Review cases, request documents, verify/reject documents, forward to next department |
| **Senior Officer** | Handle escalations, reassign cases, resolve SLA breaches |
| **Administrator** | View all cases, monitor department bottlenecks |

### Demo Controls

The prototype includes demonstration controls for walking through the full workflow:
- Advance Case Stage
- Trigger Document Request
- Simulate Citizen Upload
- Simulate Department Handoff
- Accept Handoff
- Trigger SLA Warning / Breach
- Simulate Escalation
- Reassign / Resolve Escalation
- Approve Case
- Reset Demo

## Architecture

### Technology Stack

- **Pure vanilla JavaScript** — no frameworks, no build tools
- **HTML5 + CSS3** — responsive, mobile-first design
- **No backend** — all data is synthetic and stored in-memory

### Module Structure

```
SevaPath/
├── portal.html          # Main application entry point
├── index.html           # Citizen journey landing page
├── portal-app.js        # Main UI controller (views, actions, demo controls)
├── case-store.js        # Single source of truth for all case data
├── workflow.js          # 18-state workflow engine with validated transitions
├── sla-engine.js        # SLA tracking with automatic breach detection
├── notifications.js     # Notification engine for citizens and officers
├── audit.js             # Audit trail recording all case activities
├── documents.js         # Document management with versioning
├── roles.js             # Role-based access control (6 roles)
├── portal-v2.css        # Complete styling (modals, queue, timeline, journey)
├── portal.css           # Base portal styles
├── styles.css           # Citizen journey styles
├── official.css         # Official dashboard styles
├── app.js               # Citizen journey logic
├── portal.js            # Legacy portal logic
└── portal-v2.js         # Legacy enhanced portal logic
```

### Core Modules

#### 1. Case Store (`case-store.js`)

Single source of truth for all case data. Implements the Observer pattern with `subscribe`/`notify` for reactive UI updates.

**Features:**
- 7 synthetic mock cases covering all workflow states
- CRUD operations for cases
- Timeline event recording
- Notification management
- Automatic UI refresh on data changes

**Data Structure:**
```javascript
{
  id: 'SVP-2026-00124',
  citizen: { id, name, nameHi, phone },
  lifeEvent: 'Death of property owner',
  service: 'Legal-heir verification & property transfer',
  status: 'UNDER_REVIEW',
  currentDepartment: 'revenue',
  currentOfficer: 'OFFICER_RK',
  tasks: [...],
  documents: [...],
  requests: [...],
  timeline: [...],
  dependencies: [...],
  handoffs: [...],
  escalations: [...],
  sla: { dueAt, warningThreshold, breached }
}
```

#### 2. Workflow Engine (`workflow.js`)

18-state finite state machine with validated transitions.

**States:**
```
DRAFT → SUBMITTED → RECEIVED → ASSIGNED → UNDER_REVIEW
                                              ↓
                    ACTION_REQUIRED ← CITIZEN_RESPONDED
                           ↓              ↓
                    UNDER_VERIFICATION ←──┘
                           ↓
                    INSPECTION_REQUIRED → INSPECTION_COMPLETED
                                                  ↓
                    RECOMMENDATION_PENDING → FORWARDED
                                                  ↓
                    FINAL_APPROVAL_PENDING → APPROVED → COMPLETED

Additional states: REJECTED, ON_HOLD, ESCALATED, SLA_BREACHED
```

**Features:**
- Validated state transitions (illegal transitions are blocked)
- Department routing (revenue → land_records → municipal)
- Officer assignment per department
- Available actions per state
- State metadata (label, color, description)

#### 3. SLA Engine (`sla-engine.js`)

Tracks service-level agreements with automatic breach detection.

**Features:**
- Three-tier status: Normal (green), At Risk (amber), Breached (red)
- Countdown formatting (days, hours, minutes)
- Automatic breach detection
- Cases filtered by SLA status
- Configurable warning thresholds

#### 4. Notification Engine (`notifications.js`)

Generates contextual notifications for all roles.

**Notification Types:**
- `document_requested` — Officer requests document from citizen
- `document_uploaded` — Citizen uploads document
- `case_forwarded` — Case moved to next department
- `case_approved` — Case approved
- `case_rejected` — Case returned for correction
- `sla_breached` — SLA exceeded, case escalated
- `escalation` — Case escalated to senior officer

#### 5. Audit Engine (`audit.js`)

Records all case activities with timestamps and actor information.

**Features:**
- Complete audit trail per case
- Public timeline (filtered for citizens)
- Formatted timestamps with locale support
- Actor attribution (who did what, when)

#### 6. Document Manager (`documents.js`)

Handles document creation, versioning, and verification.

**Features:**
- Document creation with metadata
- Version tracking (v1, v2, etc.)
- Verification states: pending, accepted, rejected
- Mock file handling (data URLs for prototype)
- Document status with color coding

#### 7. Roles & Permissions (`roles.js`)

Six role-based access control.

**Roles:**
| Role | Permissions |
|------|-------------|
| `citizen` | View own cases, upload documents, view timeline |
| `revenue_officer` | Review revenue cases, request documents, verify, forward |
| `land_records_officer` | Review land records cases, request documents, verify, forward |
| `municipal_officer` | Review municipal cases, request documents, verify, forward |
| `senior_officer` | Handle escalations, reassign cases, resolve SLA breaches |
| `administrator` | View all cases, monitor all departments |

## Key Features

### 1. Citizen ↔ Officer Two-Way Workflow

**Document Request Flow:**
1. Officer clicks "Request Document" in case detail
2. Modal form appears with: document name, reason, requirement level, accepted formats, max size, deadline, instructions
3. Citizen sees "Action Required" card prominently in dashboard
4. Citizen clicks "Upload Document" to fulfill request
5. Officer receives "Citizen Response Received" notification
6. Officer verifies or rejects the document
7. Case status updates accordingly

**States involved:** `UNDER_REVIEW` → `ACTION_REQUIRED` → `CITIZEN_RESPONDED` → `UNDER_VERIFICATION`

### 2. Cross-Department Handoff

**Handoff Flow:**
1. Officer clicks "Forward Case" in case detail
2. Modal shows: from department, to department, documents transferred
3. Officer adds forwarding reason and recommendation
4. Case status changes to `FORWARDED`
5. Receiving officer sees "New Case Received" with full history
6. Officer clicks "Accept Case" to begin review

**Handoff Record:**
```javascript
{
  id: 'HO_...',
  fromDepartment: 'revenue',
  fromOfficer: 'OFFICER_RK',
  toDepartment: 'land_records',
  toOfficer: 'OFFICER_LS',
  reason: 'Verification completed successfully',
  recommendation: 'Proceed with next stage review',
  documentsTransferred: 3,
  status: 'PENDING_ACCEPTANCE'
}
```

### 3. SLA Tracking & Escalation

**SLA Flow:**
1. Each case has SLA with due date and warning threshold
2. SLA Engine calculates status: Normal / At Risk / Breached
3. When SLA breaches, case auto-escalates to `SLA_BREACHED`
4. Senior Officer sees escalation in dashboard
5. Senior Officer can: Reassign case, Resolve escalation
6. Case returns to normal workflow after resolution

**SLA Status Display:**
- 🟢 Normal — Within SLA
- 🟡 At Risk — Approaching SLA deadline
- 🔴 Breached — SLA exceeded

### 4. Dependency Graph

Visual representation of task dependencies:
- ✓ Completed steps
- → Current step
- 🔒 Blocked steps (waiting for prerequisites)

**Features:**
- Click any task to see details
- "Why am I waiting?" explanation
- Downstream impact (how many steps are blocked)

### 5. Demo Controls Panel

Built-in demonstration controls for prototype walkthrough:
- Reset Demo — Reload page to initial state
- Advance Case Stage — Move to next workflow state
- Trigger Document Request — Simulate officer requesting document
- Simulate Citizen Upload — Simulate citizen uploading document
- Simulate Department Handoff — Forward case to next department
- Accept Handoff — Receiving officer accepts case
- Trigger SLA Warning — Set SLA to at-risk
- Trigger SLA Breach — Set SLA to breached
- Simulate Escalation — Escalate case to senior officer
- Reassign Case — Senior officer reassigns to different officer
- Resolve Escalation — Mark escalation as resolved
- Approve Case — Final approval

## File Descriptions

| File | Purpose |
|------|---------|
| `portal.html` | Main application with all views (citizen, officer, senior, admin) |
| `portal-app.js` | Main UI controller — handles all views, actions, demo controls |
| `case-store.js` | Central data store with Observer pattern |
| `workflow.js` | 18-state workflow engine |
| `sla-engine.js` | SLA tracking and breach detection |
| `notifications.js` | Notification generation for all roles |
| `audit.js` | Audit trail recording |
| `documents.js` | Document management with versioning |
| `roles.js` | Role-based access control |
| `portal-v2.css` | Complete styling for all components |
| `index.html` | Citizen journey landing page |
| `app.js` | Citizen journey logic |

## Prototype Boundaries

- All case identifiers, citizen data, and department integrations are synthetic
- No real government APIs are called
- No data persists on a server (all in-memory)
- Document uploads are simulated with mock files
- Speech synthesis depends on browser support
- SevaPath guides and sequences tasks; it never decides ownership or eligibility

## Production Considerations

For production deployment, the following would be required:

- Authenticated citizen and official accounts
- Jurisdiction-based access control
- Encrypted document storage
- Explicit consent management
- Append-only audit event store
- Versioned state machine rules
- Idempotent API adapters
- Human approval for every statutory decision
- State-specific verified rules
- Real department API integrations

## License

Prototype demonstration — not for production use.
