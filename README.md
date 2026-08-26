# SevaPath prototype

Open `index.html` in a modern browser. It is a mobile-first, no-install demo of a coordinated government journey following the death of a property owner, plus a role-scoped official approval workbench.

## Demo flow

1. Select the life event using pictures.
2. Select affected assets.
3. Create a synthetic case with a dependency-aware task timeline.
4. Open the next task, hear it read aloud, and complete the mocked legal-heir preparation step.
5. Select **Official demo** from the welcome screen, review a prepared case, complete two checks, and approve + route it.

## System design

```text
Citizen mobile UI ─┐                     ┌─ Official workbench (RBAC)
                  ├─ API gateway + consent ┤
                  │                        └─ audit-event viewer
                  ▼
          Life-event interpreter (AI, bounded)
                  ▼
      Workflow engine + state-verified rule versions
            │              │              │
      Case store      Document vault   Notification service
            │              │              │
            └──── integration adapter / outbox ──── mocked department APIs
```

Production controls: authenticated citizen and official accounts; jurisdiction-based access; encrypted documents; explicit consent; append-only audit events; versioned state rules; idempotent API adapters; human approval for every statutory decision. AI never decides ownership or eligibility.

## Prototype boundaries

- All case identifiers, statuses, and integrations are synthetic.
- The browser speech feature is optional and depends on the device browser.
- SevaPath guides and sequences tasks; it never decides ownership, validates eligibility, or approves an application.
- Production use requires state-specific verified rules, authenticated departmental APIs, consent, audit logs, and human escalation channels.
