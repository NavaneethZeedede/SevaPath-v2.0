// SevaPath — Notification Engine
// Manages notifications for citizens and officers

const NotificationEngine = (() => {
  const templates = {
    application_received: {
      citizen: { title: 'Application Received', titleHi: 'आवेदन प्राप्त', type: 'info' },
      officer: null
    },
    document_requested: {
      citizen: { title: 'Document Requested', titleHi: 'दस्तावेज़ अनुरोध', type: 'action' },
      officer: null
    },
    document_uploaded: {
      citizen: { title: 'Document Submitted', titleHi: 'दस्तावेज़ जमा', type: 'success' },
      officer: { title: 'Citizen Response', titleHi: 'नागरिक प्रतिक्रिया', type: 'info' }
    },
    case_forwarded: {
      citizen: { title: 'Case Forwarded', titleHi: 'केस भेजा गया', type: 'info' },
      officer: { title: 'Case Received', titleHi: 'केस प्राप्त', type: 'info' }
    },
    case_approved: {
      citizen: { title: 'Case Approved', titleHi: 'केस स्वीकृत', type: 'success' },
      officer: null
    },
    case_rejected: {
      citizen: { title: 'Case Returned', titleHi: 'केस वापस', type: 'warning' },
      officer: null
    },
    sla_warning: {
      citizen: null,
      officer: { title: 'SLA Warning', titleHi: 'SLA चेतावनी', type: 'warning' }
    },
    sla_breached: {
      citizen: { title: 'Case Escalated', titleHi: 'केस संवर्धित', type: 'warning' },
      officer: { title: 'SLA Breached', titleHi: 'SLA उल्लंघन', type: 'error' }
    },
    escalation: {
      citizen: null,
      officer: { title: 'Escalated Case', titleHi: 'संवर्धित केस', type: 'error' }
    }
  };

  function create(type, target, data = {}) {
    const template = templates[type]?.[target];
    if (!template) return null;

    return {
      id: `NOT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: template.type,
      title: template.title,
      titleHi: template.titleHi,
      message: data.message || '',
      messageHi: data.messageHi || '',
      caseId: data.caseId || null,
      timestamp: new Date().toISOString(),
      read: false
    };
  }

  function notifyCase(caseData, type, target, data = {}) {
    const notification = create(type, target, { ...data, caseId: caseData.id });
    if (!notification) return;

    if (target === 'citizen') {
      CaseStore.addNotification(caseData.id, notification);
    }
    return notification;
  }

  function getUnreadCount(notifications) {
    return notifications.filter(n => !n.read).length;
  }

  function markAsRead(notifications, notifId) {
    const n = notifications.find(x => x.id === notifId);
    if (n) n.read = true;
    return notifications;
  }

  function markAllRead(notifications) {
    notifications.forEach(n => { n.read = true; });
    return notifications;
  }

  return { create, notifyCase, getUnreadCount, markAsRead, markAllRead, templates };
})();
