// SevaPath — Audit Engine
// Records all case activities for transparency

const AuditEngine = (() => {
  function record(caseData, action, actor, actorRole, details = {}) {
    const event = {
      id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      actor: actor || 'System',
      actorRole: actorRole || 'System',
      department: details.department || caseData.currentDepartment || '—',
      action: action,
      actionHi: details.actionHi || action,
      description: details.description || action,
      descriptionHi: details.descriptionHi || details.description || action,
      previousStatus: details.previousStatus || caseData.status,
      newStatus: details.newStatus || caseData.status
    };

    CaseStore.addTimelineEvent(caseData.id, event);
    return event;
  }

  function getFormattedTimestamp(iso, lang = 'en') {
    const d = new Date(iso);
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', options);
  }

  function getPublicTimeline(timeline) {
    const sensitiveActions = ['Internal note added', 'SLA check performed'];
    return timeline.filter(e => !sensitiveActions.includes(e.action));
  }

  function getInternalTimeline(timeline) {
    return timeline;
  }

  function summarizeActions(timeline) {
    const counts = {};
    timeline.forEach(e => {
      counts[e.action] = (counts[e.action] || 0) + 1;
    });
    return counts;
  }

  return { record, getFormattedTimestamp, getPublicTimeline, getInternalTimeline, summarizeActions };
})();
