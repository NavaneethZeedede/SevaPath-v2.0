// SevaPath — Case Store (Single Source of Truth)
// Central state management for all cases

const CaseStore = (() => {
  let cases = {};
  let listeners = [];

  function notify() {
    listeners.forEach(fn => fn(cases));
  }

  function init() {
    cases = generateMockCases();
    notify();
  }

  function get(id) {
    return cases[id] || null;
  }

  function getAll() {
    return { ...cases };
  }

  function getByRole(role, officerId = null) {
    return Object.values(cases).filter(c => {
      if (role === 'citizen') return c.citizen.id === 'CITIZEN_001';
      if (role === 'officer') return c.currentOfficer === officerId || c.currentOfficer === 'OFFICER_RK';
      if (role === 'senior') return true;
      if (role === 'admin') return true;
      return false;
    });
  }

  function update(id, updates) {
    if (!cases[id]) return null;
    cases[id] = { ...cases[id], ...updates, updatedAt: new Date().toISOString() };
    notify();
    return cases[id];
  }

  function addTimelineEvent(id, event) {
    if (!cases[id]) return;
    cases[id].timeline.push({
      id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...event
    });
    cases[id].updatedAt = new Date().toISOString();
    notify();
  }

  function addNotification(id, notification) {
    if (!cases[id]) return;
    cases[id].notifications.push({
      id: `NOT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    });
    notify();
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => { listeners = listeners.filter(l => l !== fn); };
  }

  function generateMockCases() {
    const now = new Date();
    const daysAgo = (d) => new Date(now - d * 86400000).toISOString();
    const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

    return {
      'SVP-2026-00124': {
        id: 'SVP-2026-00124',
        citizen: { id: 'CITIZEN_001', name: 'Anita Sharma', nameHi: 'अनिता शर्मा', phone: '+91-XXXXX-1234' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Agricultural land', 'Residential property'],
        assetsHi: ['कृषि भूमि', 'आवासीय संपत्ति'],
        service: 'Legal-heir verification & property transfer',
        serviceHi: 'कानूनी वारिस सत्यापन और संपत्ति हस्तांतरण',
        currentDepartment: 'revenue',
        currentDepartmentHi: 'राजस्व',
        currentOfficer: 'OFFICER_RK',
        currentOfficerName: 'Officer RK',
        status: 'UNDER_REVIEW',
        priority: 'normal',
        sla: { startedAt: daysAgo(2), dueAt: daysAgo(-1), slaHours: 72, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(1),
        documents: [
          { id: 'DOC_001', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(2), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' }
        ],
        requests: [],
        tasks: [
          { id: 'TASK_001', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_002', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'active', department: 'revenue', blocks: ['TASK_003', 'TASK_004', 'TASK_005'] },
          { id: 'TASK_003', name: 'Land mutation', nameHi: 'भूमि म्यूटेशन', status: 'blocked', department: 'land_records', dependsOn: ['TASK_002'] },
          { id: 'TASK_004', name: 'Property record update', nameHi: 'संपत्ति रिकॉर्ड अपडेट', status: 'blocked', department: 'municipal', dependsOn: ['TASK_002'] },
          { id: 'TASK_005', name: 'Property tax update', nameHi: 'संपत्ति कर अपडेट', status: 'blocked', department: 'municipal', dependsOn: ['TASK_004'] }
        ],
        decisions: [],
        timeline: [
          { id: 'EVT_001', timestamp: daysAgo(2), actor: 'Anita Sharma', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted legal-heir verification request.', descriptionHi: 'नागरिक ने कानूनी वारिस सत्यापन अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_002', timestamp: daysAgo(2), actor: 'System', actorRole: 'System', department: 'Revenue', action: 'Case received', description: 'Application received by Revenue Department.', descriptionHi: 'राजस्व विभाग ने आवेदन प्राप्त किया।', previousStatus: 'SUBMITTED', newStatus: 'RECEIVED' },
          { id: 'EVT_003', timestamp: daysAgo(1), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Case assigned', description: 'Case assigned to Revenue Officer RK.', descriptionHi: 'केस राजस्व अधिारी RK को सौंपा गया।', previousStatus: 'RECEIVED', newStatus: 'ASSIGNED' },
          { id: 'EVT_004', timestamp: daysAgo(1), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Review started', description: 'Officer began document review.', descriptionHi: 'अधिकारी ने दस्तावेज़ समीक्षा शुरू की।', previousStatus: 'ASSIGNED', newStatus: 'UNDER_REVIEW' }
        ],
        dependencies: [
          { taskId: 'TASK_002', dependsOn: ['TASK_001'], blocks: ['TASK_003', 'TASK_004', 'TASK_005'] },
          { taskId: 'TASK_003', dependsOn: ['TASK_002'], blocks: [] },
          { taskId: 'TASK_004', dependsOn: ['TASK_002'], blocks: ['TASK_005'] },
          { taskId: 'TASK_005', dependsOn: ['TASK_004'], blocks: [] }
        ],
        approvals: [],
        escalations: [],
        handoffs: [],
        notifications: []
      },
      'SVP-2026-00118': {
        id: 'SVP-2026-00118',
        citizen: { id: 'CITIZEN_002', name: 'Rajesh Kumar', nameHi: 'राजेश कुमार', phone: '+91-XXXXX-5678' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Agricultural land only'],
        assetsHi: ['केवल कृषि भूमि'],
        service: 'Farm-land mutation',
        serviceHi: 'कृषि भूमि म्यूटेशन',
        currentDepartment: 'revenue',
        currentDepartmentHi: 'राजस्व',
        currentOfficer: 'OFFICER_RK',
        currentOfficerName: 'Officer RK',
        status: 'ACTION_REQUIRED',
        priority: 'normal',
        sla: { startedAt: daysAgo(3), dueAt: daysAgo(-2), slaHours: 72, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(3),
        updatedAt: hoursAgo(5),
        documents: [
          { id: 'DOC_101', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(3), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' }
        ],
        requests: [
          { id: 'REQ_001', documentName: 'Legal-Heir Certificate', documentNameHi: 'कानूनी वारिस प्रमाण पत्र', reason: 'Required to verify inheritance eligibility for land mutation.', reasonHi: 'भूमि म्यूटेशन के लिए विरासत पात्रता सत्यापित करने हेतु आवश्यक।', required: true, formats: ['PDF', 'JPG', 'PNG'], maxSize: '10 MB', deadline: daysAgo(-4), status: 'pending', requestedBy: 'OFFICER_RK', requestedAt: hoursAgo(5) }
        ],
        tasks: [
          { id: 'TASK_101', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_102', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'action_required', department: 'revenue', blocks: ['TASK_103'] },
          { id: 'TASK_103', name: 'Land mutation', nameHi: 'भूमि म्यूटेशन', status: 'blocked', department: 'land_records', dependsOn: ['TASK_102'] }
        ],
        decisions: [],
        timeline: [
          { id: 'EVT_101', timestamp: daysAgo(3), actor: 'Rajesh Kumar', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted farm-land mutation request.', descriptionHi: 'नागरिक ने कृषि भूमि म्यूटेशन अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_102', timestamp: daysAgo(3), actor: 'System', actorRole: 'System', department: 'Revenue', action: 'Case received', description: 'Application received by Revenue Department.', descriptionHi: 'राजस्व विभाग ने आवेदन प्राप्त किया।', previousStatus: 'SUBMITTED', newStatus: 'RECEIVED' },
          { id: 'EVT_103', timestamp: hoursAgo(5), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Document requested', description: 'Officer requested Legal-Heir Certificate from citizen.', descriptionHi: 'अधिकारी ने नागरिक से कानूनी वारिस प्रमाण पत्र मांगा।', previousStatus: 'UNDER_REVIEW', newStatus: 'ACTION_REQUIRED' }
        ],
        dependencies: [
          { taskId: 'TASK_102', dependsOn: ['TASK_101'], blocks: ['TASK_103'] },
          { taskId: 'TASK_103', dependsOn: ['TASK_102'], blocks: [] }
        ],
        approvals: [],
        escalations: [],
        notifications: [
          { id: 'NOT_101', timestamp: hoursAgo(5), type: 'document_request', title: 'Document Requested', titleHi: 'दस्तावेज़ अनुरोध', message: 'Revenue Officer requested: Legal-Heir Certificate', messageHi: 'राजस्व अधिकारी ने अनुरोध किया: कानूनी वारिस प्रमाण पत्र', read: false }
        ]
      },
      'SVP-2026-00108': {
        id: 'SVP-2026-00108',
        citizen: { id: 'CITIZEN_003', name: 'Priya Patel', nameHi: 'प्रिया पटेल', phone: '+91-XXXXX-9012' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Residential property only'],
        assetsHi: ['केवल आवासीय संपत्ति'],
        service: 'House record update',
        serviceHi: 'घर का रिकॉर्ड अपडेट',
        currentDepartment: 'revenue',
        currentDepartmentHi: 'राजस्व',
        currentOfficer: 'OFFICER_RK',
        currentOfficerName: 'Officer RK',
        status: 'CITIZEN_RESPONDED',
        priority: 'high',
        sla: { startedAt: daysAgo(1), dueAt: daysAgo(-2), slaHours: 48, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(1),
        updatedAt: hoursAgo(2),
        documents: [
          { id: 'DOC_201', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(1), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' },
          { id: 'DOC_202', name: 'Legal-Heir Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: hoursAgo(2), status: 'under_review', version: 1, requestedBy: 'OFFICER_RK', verificationStatus: 'pending' }
        ],
        requests: [
          { id: 'REQ_201', documentName: 'Legal-Heir Certificate', documentNameHi: 'कानूनी वारिस प्रमाण पत्र', reason: 'Required for house record transfer.', reasonHi: 'घर रिकॉर्ड स्थानांतरण हेतु आवश्यक।', required: true, formats: ['PDF', 'JPG', 'PNG'], maxSize: '10 MB', deadline: daysAgo(-3), status: 'fulfilled', requestedBy: 'OFFICER_RK', requestedAt: daysAgo(1) }
        ],
        tasks: [
          { id: 'TASK_201', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_202', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'under_verification', department: 'revenue', blocks: ['TASK_203'] },
          { id: 'TASK_203', name: 'Property record update', nameHi: 'संपत्ति रिकॉर्ड अपडेट', status: 'blocked', department: 'municipal', dependsOn: ['TASK_202'] }
        ],
        decisions: [],
        timeline: [
          { id: 'EVT_201', timestamp: daysAgo(1), actor: 'Priya Patel', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted house record update request.', descriptionHi: 'नागरिक ने घर रिकॉर्ड अपडेट अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_202', timestamp: daysAgo(1), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Document requested', description: 'Officer requested Legal-Heir Certificate.', descriptionHi: 'अधिकारी ने कानूनी वारिस प्रमाण पत्र मांगा।', previousStatus: 'UNDER_REVIEW', newStatus: 'ACTION_REQUIRED' },
          { id: 'EVT_203', timestamp: hoursAgo(2), actor: 'Priya Patel', actorRole: 'Citizen', department: '—', action: 'Document uploaded', description: 'Citizen uploaded Legal-Heir Certificate.', descriptionHi: 'नागरिक ने कानूनी वारिस प्रमाण पत्र अपलोड किया।', previousStatus: 'ACTION_REQUIRED', newStatus: 'CITIZEN_RESPONDED' }
        ],
        dependencies: [
          { taskId: 'TASK_202', dependsOn: ['TASK_201'], blocks: ['TASK_203'] },
          { taskId: 'TASK_203', dependsOn: ['TASK_202'], blocks: [] }
        ],
        approvals: [],
        escalations: [],
        handoffs: [],
        notifications: []
      },
      'SVP-2026-00101': {
        id: 'SVP-2026-00101',
        citizen: { id: 'CITIZEN_004', name: 'Amit Singh', nameHi: 'अमित सिंह', phone: '+91-XXXXX-3456' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Agricultural land', 'Residential property'],
        assetsHi: ['कृषि भूमि', 'आवासीय संपत्ति'],
        service: 'Property tax update',
        serviceHi: 'संपत्ति कर अपडेट',
        currentDepartment: 'land_records',
        currentDepartmentHi: 'भूमि अभिलेख',
        currentOfficer: 'OFFICER_LS',
        currentOfficerName: 'Officer LS',
        status: 'UNDER_VERIFICATION',
        priority: 'normal',
        sla: { startedAt: daysAgo(4), dueAt: daysAgo(-1), slaHours: 96, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(5),
        updatedAt: hoursAgo(3),
        documents: [
          { id: 'DOC_301', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(5), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' },
          { id: 'DOC_302', name: 'Legal-Heir Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(4), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' }
        ],
        requests: [],
        tasks: [
          { id: 'TASK_301', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_302', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'completed', department: 'revenue', blocks: ['TASK_303'] },
          { id: 'TASK_303', name: 'Land mutation', nameHi: 'भूमि म्यूटेशन', status: 'active', department: 'land_records', dependsOn: ['TASK_302'] },
          { id: 'TASK_304', name: 'Property tax update', nameHi: 'संपत्ति कर अपडेट', status: 'blocked', department: 'municipal', dependsOn: ['TASK_303'] }
        ],
        decisions: [],
        timeline: [
          { id: 'EVT_301', timestamp: daysAgo(5), actor: 'Amit Singh', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted property tax update request.', descriptionHi: 'नागरिक ने संपत्ति कर अपडेट अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_302', timestamp: daysAgo(4), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Verification completed', description: 'Revenue verification completed. Case forwarded to Land Records.', descriptionHi: 'राजस्व सत्यापन पूर्ण। केस भूमि अभिलेख को भेजा गया।', previousStatus: 'UNDER_VERIFICATION', newStatus: 'FORWARDED' },
          { id: 'EVT_303', timestamp: hoursAgo(3), actor: 'Officer LS', actorRole: 'Land Records Officer', department: 'Land Records', action: 'Review started', description: 'Land Records officer began verification.', descriptionHi: 'भूमि अभिलेख अधिकारी ने सत्यापन शुरू किया।', previousStatus: 'RECEIVED', newStatus: 'UNDER_VERIFICATION' }
        ],
        dependencies: [
          { taskId: 'TASK_302', dependsOn: ['TASK_301'], blocks: ['TASK_303'] },
          { taskId: 'TASK_303', dependsOn: ['TASK_302'], blocks: ['TASK_304'] },
          { taskId: 'TASK_304', dependsOn: ['TASK_303'], blocks: [] }
        ],
        approvals: [],
        escalations: [],
        handoffs: [],
        notifications: []
      },
      'SVP-2026-00095': {
        id: 'SVP-2026-00095',
        citizen: { id: 'CITIZEN_005', name: 'Sunita Devi', nameHi: 'सुनीता देवी', phone: '+91-XXXXX-7890' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Agricultural land', 'Residential property'],
        assetsHi: ['कृषि भूमि', 'आवासीय संपत्ति'],
        service: 'Land + home transition',
        serviceHi: 'ज़मीन + घर संक्रमण',
        currentDepartment: 'municipal',
        currentDepartmentHi: 'नगर निगम',
        currentOfficer: 'OFFICER_MS',
        currentOfficerName: 'Officer MS',
        status: 'INSPECTION_REQUIRED',
        priority: 'high',
        sla: { startedAt: daysAgo(6), dueAt: daysAgo(-3), slaHours: 120, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(7),
        updatedAt: hoursAgo(6),
        documents: [
          { id: 'DOC_401', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(7), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' },
          { id: 'DOC_402', name: 'Legal-Heir Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(6), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' }
        ],
        requests: [],
        tasks: [
          { id: 'TASK_401', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_402', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'completed', department: 'revenue' },
          { id: 'TASK_403', name: 'Land mutation', nameHi: 'भूमि म्यूटेशन', status: 'completed', department: 'land_records' },
          { id: 'TASK_404', name: 'Property record update', nameHi: 'संपत्ति रिकॉर्ड अपडेट', status: 'inspection_required', department: 'municipal' }
        ],
        decisions: [],
        timeline: [
          { id: 'EVT_401', timestamp: daysAgo(7), actor: 'Sunita Devi', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted land + home transition request.', descriptionHi: 'नागरिक ने ज़मीन + घर संक्रमण अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_402', timestamp: daysAgo(5), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Forwarded to Land Records', description: 'Case forwarded to Land Records Office.', descriptionHi: 'केस भूमि अभिलेख कार्यालय को भेजा गया।', previousStatus: 'APPROVED', newStatus: 'FORWARDED' },
          { id: 'EVT_403', timestamp: daysAgo(3), actor: 'Officer LS', actorRole: 'Land Records Officer', department: 'Land Records', action: 'Forwarded to Municipal', description: 'Case forwarded to Municipal Office.', descriptionHi: 'केस नगर निगम को भेजा गया।', previousStatus: 'APPROVED', newStatus: 'FORWARDED' },
          { id: 'EVT_404', timestamp: hoursAgo(6), actor: 'Officer MS', actorRole: 'Municipal Officer', department: 'Municipal', action: 'Inspection scheduled', description: 'Physical inspection scheduled for property verification.', descriptionHi: 'संपत्ति सत्यापन हेतु भौतिक निरीक्षण निर्धारित।', previousStatus: 'UNDER_REVIEW', newStatus: 'INSPECTION_REQUIRED' }
        ],
        dependencies: [
          { taskId: 'TASK_402', dependsOn: ['TASK_401'], blocks: ['TASK_403'] },
          { taskId: 'TASK_403', dependsOn: ['TASK_402'], blocks: ['TASK_404'] },
          { taskId: 'TASK_404', dependsOn: ['TASK_403'], blocks: [] }
        ],
        approvals: [],
        escalations: [],
        handoffs: [],
        notifications: []
      },
      'SVP-2026-00089': {
        id: 'SVP-2026-00089',
        citizen: { id: 'CITIZEN_006', name: 'Vikram Joshi', nameHi: 'विक्रम जोशी', phone: '+91-XXXXX-2345' },
        lifeEvent: 'Record correction',
        lifeEventHi: 'रिकॉर्ड सुधार',
        assets: ['Agricultural land'],
        assetsHi: ['कृषि भूमि'],
        service: 'Farm-land record correction',
        serviceHi: 'कृषि भूमि रिकॉर्ड सुधार',
        currentDepartment: 'revenue',
        currentDepartmentHi: 'राजस्व',
        currentOfficer: 'OFFICER_RK',
        currentOfficerName: 'Officer RK',
        status: 'REJECTED',
        priority: 'normal',
        sla: { startedAt: daysAgo(5), dueAt: daysAgo(-2), slaHours: 72, warningThreshold: 0.8, breached: true },
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
        documents: [
          { id: 'DOC_501', name: 'Land Record (Form 7/12)', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(5), status: 'rejected', version: 1, verificationStatus: 'rejected' }
        ],
        requests: [],
        tasks: [
          { id: 'TASK_501', name: 'Document verification', nameHi: 'दस्तावेज़ सत्यापन', status: 'rejected', department: 'revenue' }
        ],
        decisions: [
          { id: 'DEC_001', officer: 'Officer RK', role: 'Revenue Officer', date: daysAgo(1), decision: 'reject', reason: 'The submitted land survey number does not match the registry records. Please provide the updated survey document (Form 7/12) with the correct plot number.', reasonHi: 'जमा किया गया भूमि सर्वे नंबर रजिस्ट्री रिकॉर्ड से मेल नहीं खाता। कृपया सही प्लॉट नंबर के साथ अपडेटेड सर्वे दस्तावेज़ (फॉर्म 7/12) प्रदान करें।' }
        ],
        timeline: [
          { id: 'EVT_501', timestamp: daysAgo(5), actor: 'Vikram Joshi', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted land record correction request.', descriptionHi: 'नागरिक ने भूमि रिकॉर्ड सुधार अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_502', timestamp: daysAgo(3), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Review completed', description: 'Officer reviewed documents and found discrepancies.', descriptionHi: 'अधिकारी ने दस्तावेज़ समीक्षा की और विसंगतियां पाईं।', previousStatus: 'UNDER_REVIEW', newStatus: 'UNDER_REVIEW' },
          { id: 'EVT_503', timestamp: daysAgo(1), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Case rejected', description: 'Case rejected due to survey number mismatch.', descriptionHi: 'सर्वे नंबर बेमेल के कारण केस अस्वीकृत।', previousStatus: 'UNDER_REVIEW', newStatus: 'REJECTED' }
        ],
        dependencies: [],
        approvals: [],
        escalations: [],
        notifications: [
          { id: 'NOT_501', timestamp: daysAgo(1), type: 'rejection', title: 'Case Returned', titleHi: 'केस वापस', message: 'Your case was returned. Please review the official comment and resubmit.', messageHi: 'आपका केस वापस कर दिया गया। कृपया अधिकारी की टिप्पणी देखें और फिर से जमा करें।', read: false }
        ]
      },
      'SVP-2026-00082': {
        id: 'SVP-2026-00082',
        citizen: { id: 'CITIZEN_007', name: 'Meena Gupta', nameHi: 'मीना गुप्ता', phone: '+91-XXXXX-6789' },
        lifeEvent: 'Death of property owner',
        lifeEventHi: 'संपत्ति स्वामी की मृत्यु',
        assets: ['Residential property'],
        assetsHi: ['आवासीय संपत्ति'],
        service: 'Property transfer',
        serviceHi: 'संपत्ति हस्तांतरण',
        currentDepartment: 'revenue',
        currentDepartmentHi: 'राजस्व',
        currentOfficer: 'OFFICER_RK',
        currentOfficerName: 'Officer RK',
        status: 'APPROVED',
        priority: 'low',
        sla: { startedAt: daysAgo(10), dueAt: daysAgo(7), slaHours: 72, warningThreshold: 0.8, breached: false },
        createdAt: daysAgo(10),
        updatedAt: daysAgo(7),
        documents: [
          { id: 'DOC_601', name: 'Death Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(10), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' },
          { id: 'DOC_602', name: 'Legal-Heir Certificate', type: 'application/pdf', uploadedBy: 'citizen', uploadedAt: daysAgo(9), status: 'verified', version: 1, verifiedBy: 'OFFICER_RK', verificationStatus: 'accepted' }
        ],
        requests: [],
        tasks: [
          { id: 'TASK_601', name: 'Death certificate', nameHi: 'मृत्यु प्रमाण पत्र', status: 'completed', department: 'revenue' },
          { id: 'TASK_602', name: 'Legal-heir verification', nameHi: 'कानूनी वारिस सत्यापन', status: 'completed', department: 'revenue' }
        ],
        decisions: [
          { id: 'DEC_601', officer: 'Officer RK', role: 'Revenue Officer', date: daysAgo(7), decision: 'approve', reason: 'All documents verified. Legal-heir verification approved.', reasonHi: 'सभी दस्तावेज़ सत्यापित। कानूनी वारिस सत्यापन स्वीकृत।' }
        ],
        timeline: [
          { id: 'EVT_601', timestamp: daysAgo(10), actor: 'Meena Gupta', actorRole: 'Citizen', department: '—', action: 'Application submitted', description: 'Citizen submitted property transfer request.', descriptionHi: 'नागरिक ने संपत्ति हस्तांतरण अनुरोध जमा किया।', previousStatus: 'DRAFT', newStatus: 'SUBMITTED' },
          { id: 'EVT_602', timestamp: daysAgo(8), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Verification completed', description: 'All documents verified successfully.', descriptionHi: 'सभी दस्तावेज़ सफलतापूर्वक सत्यापित।', previousStatus: 'UNDER_VERIFICATION', newStatus: 'APPROVED' },
          { id: 'EVT_603', timestamp: daysAgo(7), actor: 'Officer RK', actorRole: 'Revenue Officer', department: 'Revenue', action: 'Case approved', description: 'Legal-heir verification approved.', descriptionHi: 'कानूनी वारिस सत्यापन स्वीकृत।', previousStatus: 'APPROVED', newStatus: 'COMPLETED' }
        ],
        dependencies: [
          { taskId: 'TASK_602', dependsOn: ['TASK_601'], blocks: [] }
        ],
        approvals: [{ id: 'APR_001', level: 'revenue', officer: 'OFFICER_RK', date: daysAgo(7), decision: 'approved' }],
        escalations: [],
        handoffs: [],
        notifications: []
      }
    };
  }

  init();

  return { get, getAll, getByRole, update, addTimelineEvent, addNotification, subscribe };
})();
