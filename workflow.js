// SevaPath — Workflow Engine
// State machine for case lifecycle management

const WorkflowEngine = (() => {
  const states = {
    DRAFT: { label: 'Draft', labelHi: 'प्रारूप', color: '#61756d' },
    SUBMITTED: { label: 'Submitted', labelHi: 'जमा किया गया', color: '#2980b9' },
    RECEIVED: { label: 'Received', labelHi: 'प्राप्त', color: '#2980b9' },
    ASSIGNED: { label: 'Assigned', labelHi: 'सौंपा गया', color: '#8e44ad' },
    UNDER_REVIEW: { label: 'Under Review', labelHi: 'समीक्षा में', color: '#e67e22' },
    ACTION_REQUIRED: { label: 'Action Required', labelHi: 'कार्रवाई आवश्यक', color: '#c0392b' },
    CITIZEN_RESPONDED: { label: 'Citizen Responded', labelHi: 'नागरिक ने जवाब दिया', color: '#27ae60' },
    UNDER_VERIFICATION: { label: 'Under Verification', labelHi: 'सत्यापन में', color: '#e67e22' },
    INSPECTION_REQUIRED: { label: 'Inspection Required', labelHi: 'निरीक्षण आवश्यक', color: '#d35400' },
    INSPECTION_COMPLETED: { label: 'Inspection Completed', labelHi: 'निरीक्षण पूर्ण', color: '#27ae60' },
    RECOMMENDATION_PENDING: { label: 'Recommendation Pending', labelHi: 'सिफारिश लंबित', color: '#8e44ad' },
    FORWARDED: { label: 'Forwarded', labelHi: 'भेजा गया', color: '#2980b9' },
    FINAL_APPROVAL_PENDING: { label: 'Final Approval Pending', labelHi: 'अंतिम स्वीकृति लंबित', color: '#e67e22' },
    APPROVED: { label: 'Approved', labelHi: 'स्वीकृत', color: '#27ae60' },
    REJECTED: { label: 'Rejected', labelHi: 'अस्वीकृत', color: '#c0392b' },
    COMPLETED: { label: 'Completed', labelHi: 'पूर्ण', color: '#27ae60' },
    ON_HOLD: { label: 'On Hold', labelHi: 'रोका हुआ', color: '#7f8c8d' },
    ESCALATED: { label: 'Escalated', labelHi: 'संवर्धित', color: '#c0392b' },
    SLA_BREACHED: { label: 'SLA Breached', labelHi: 'SLA उल्लंघन', color: '#c0392b' }
  };

  const transitions = {
    DRAFT: ['SUBMITTED'],
    SUBMITTED: ['RECEIVED', 'REJECTED'],
    RECEIVED: ['ASSIGNED', 'REJECTED'],
    ASSIGNED: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'REJECTED'],
    UNDER_REVIEW: ['ACTION_REQUIRED', 'UNDER_VERIFICATION', 'FORWARDED', 'REJECTED', 'ON_HOLD', 'ESCALATED'],
    ACTION_REQUIRED: ['CITIZEN_RESPONDED', 'REJECTED', 'ESCALATED'],
    CITIZEN_RESPONDED: ['UNDER_VERIFICATION', 'REJECTED'],
    UNDER_VERIFICATION: ['INSPECTION_REQUIRED', 'RECOMMENDATION_PENDING', 'FORWARDED', 'APPROVED', 'REJECTED', 'ESCALATED'],
    INSPECTION_REQUIRED: ['INSPECTION_COMPLETED', 'REJECTED'],
    INSPECTION_COMPLETED: ['RECOMMENDATION_PENDING', 'APPROVED', 'REJECTED'],
    RECOMMENDATION_PENDING: ['FINAL_APPROVAL_PENDING', 'FORWARDED', 'REJECTED'],
    FORWARDED: ['ASSIGNED', 'UNDER_REVIEW'],
    FINAL_APPROVAL_PENDING: ['APPROVED', 'REJECTED'],
    APPROVED: ['COMPLETED', 'FORWARDED'],
    REJECTED: ['ACTION_REQUIRED'],
    ON_HOLD: ['UNDER_REVIEW', 'ESCALATED'],
    ESCALATED: ['UNDER_REVIEW', 'SLA_BREACHED'],
    SLA_BREACHED: ['ESCALATED', 'UNDER_REVIEW']
  };

  const departments = {
    revenue: { name: 'Revenue Department', nameHi: 'राजस्व विभाग', officer: 'OFFICER_RK', officerName: 'Officer RK' },
    land_records: { name: 'Land Records Office', nameHi: 'भूमि अभिलेख कार्यालय', officer: 'OFFICER_LS', officerName: 'Officer LS' },
    municipal: { name: 'Municipal Office', nameHi: 'नगर निगम कार्यालय', officer: 'OFFICER_MS', officerName: 'Officer MS' }
  };

  const actions = {
    accept: { from: ['RECEIVED'], to: 'ASSIGNED', event: 'Case accepted' },
    startReview: { from: ['ASSIGNED', 'FORWARDED'], to: 'UNDER_REVIEW', event: 'Review started' },
    requestDocument: { from: ['UNDER_REVIEW', 'UNDER_VERIFICATION'], to: 'ACTION_REQUIRED', event: 'Document requested' },
    requestClarification: { from: ['UNDER_REVIEW'], to: 'ACTION_REQUIRED', event: 'Clarification requested' },
    citizenRespond: { from: ['ACTION_REQUIRED'], to: 'CITIZEN_RESPONDED', event: 'Citizen responded' },
    startVerification: { from: ['CITIZEN_RESPONDED'], to: 'UNDER_VERIFICATION', event: 'Verification started' },
    scheduleInspection: { from: ['UNDER_VERIFICATION'], to: 'INSPECTION_REQUIRED', event: 'Inspection scheduled' },
    completeInspection: { from: ['INSPECTION_REQUIRED'], to: 'INSPECTION_COMPLETED', event: 'Inspection completed' },
    recommend: { from: ['UNDER_VERIFICATION', 'INSPECTION_COMPLETED'], to: 'RECOMMENDATION_PENDING', event: 'Recommendation submitted' },
    forward: { from: ['UNDER_VERIFICATION', 'RECOMMENDATION_PENDING', 'APPROVED'], to: 'FORWARDED', event: 'Case forwarded' },
    approve: { from: ['UNDER_VERIFICATION', 'INSPECTION_COMPLETED', 'RECOMMENDATION_PENDING', 'FINAL_APPROVAL_PENDING'], to: 'APPROVED', event: 'Case approved' },
    reject: { from: ['UNDER_REVIEW', 'UNDER_VERIFICATION', 'INSPECTION_REQUIRED', 'INSPECTION_COMPLETED', 'RECOMMENDATION_PENDING', 'FINAL_APPROVAL_PENDING'], to: 'REJECTED', event: 'Case rejected' },
    returnForCorrection: { from: ['UNDER_REVIEW', 'UNDER_VERIFICATION'], to: 'ACTION_REQUIRED', event: 'Returned for correction' },
    putOnHold: { from: ['UNDER_REVIEW'], to: 'ON_HOLD', event: 'Case put on hold' },
    escalate: { from: ['UNDER_REVIEW', 'ACTION_REQUIRED', 'UNDER_VERIFICATION', 'ON_HOLD', 'SLA_BREACHED'], to: 'ESCALATED', event: 'Case escalated' },
    resolveEscalation: { from: ['ESCALATED', 'SLA_BREACHED'], to: 'UNDER_REVIEW', event: 'Escalation resolved' },
    complete: { from: ['APPROVED'], to: 'COMPLETED', event: 'Case completed' }
  };

  function getAvailableTransitions(status) {
    return transitions[status] || [];
  }

  function canTransition(from, to) {
    return transitions[from]?.includes(to) || false;
  }

  function getStateInfo(status, lang = 'en') {
    const s = states[status] || states.DRAFT;
    return {
      status,
      label: lang === 'hi' ? s.labelHi : s.label,
      color: s.color
    };
  }

  function getDepartmentInfo(dept, lang = 'en') {
    const d = departments[dept] || departments.revenue;
    return {
      key: dept,
      name: lang === 'hi' ? d.nameHi : d.name,
      officer: d.officer,
      officerName: d.officerName
    };
  }

  function getActionInfo(actionKey) {
    return actions[actionKey] || null;
  }

  function getAllActions() {
    return Object.keys(actions);
  }

  function getActionsForStatus(status) {
    return Object.entries(actions)
      .filter(([_, a]) => a.from.includes(status))
      .map(([key, a]) => ({ key, ...a }));
  }

  return { getStateInfo, getDepartmentInfo, getActionInfo, getActionsForStatus, canTransition, getAvailableTransitions, departments };
})();
