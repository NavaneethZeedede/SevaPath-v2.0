// SevaPath — SLA Engine
// Service Level Agreement tracking and management

const SLAEngine = (() => {
  function calculateStatus(sla) {
    if (!sla) return { status: 'unknown', remaining: null, percentUsed: 0, label: 'N/A', color: '#61756d' };

    const now = new Date();
    const start = new Date(sla.startedAt);
    const due = new Date(sla.dueAt);
    const totalMs = due - start;
    const elapsedMs = now - start;
    const remainingMs = due - now;
    const percentUsed = Math.min(1, Math.max(0, elapsedMs / totalMs));

    if (remainingMs < 0) {
      return {
        status: 'breached',
        remaining: remainingMs,
        percentUsed: 1,
        breachedBy: Math.abs(remainingMs),
        label: formatDuration(Math.abs(remainingMs)),
        color: '#c0392b'
      };
    }

    if (percentUsed >= sla.warningThreshold) {
      return {
        status: 'at_risk',
        remaining: remainingMs,
        percentUsed,
        label: formatDuration(remainingMs),
        color: '#e67e22'
      };
    }

    return {
      status: 'normal',
      remaining: remainingMs,
      percentUsed,
      label: formatDuration(remainingMs),
      color: '#27ae60'
    };
  }

  function formatDuration(ms) {
    if (ms < 0) ms = -ms;
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) return `${days}d ${remainingHours}h`;
    if (hours > 0) return `${hours}h ${Math.floor((ms % 3600000) / 60000)}m`;
    return `${Math.floor(ms / 60000)}m`;
  }

  function checkAndUpdate(caseData) {
    const slaStatus = calculateStatus(caseData.sla);
    let updated = false;
    let newStatus = caseData.status;

    if (slaStatus.status === 'breached' && !caseData.sla.breached) {
      caseData.sla.breached = true;
      if (caseData.status !== 'ESCALATED' && caseData.status !== 'SLA_BREACHED') {
        newStatus = 'SLA_BREACHED';
      }
      updated = true;
    }

    return { slaStatus, updated, newStatus };
  }

  function getSLAProgress(sla) {
    const status = calculateStatus(sla);
    return Math.round(status.percentUsed * 100);
  }

  function getCasesBySLAStatus(cases) {
    const result = { normal: [], at_risk: [], breached: [] };
    Object.values(cases).forEach(c => {
      const s = calculateStatus(c.sla);
      if (s.status === 'breached') result.breached.push(c);
      else if (s.status === 'at_risk') result.at_risk.push(c);
      else result.normal.push(c);
    });
    return result;
  }

  return { calculateStatus, formatDuration, checkAndUpdate, getSLAProgress, getCasesBySLAStatus };
})();
