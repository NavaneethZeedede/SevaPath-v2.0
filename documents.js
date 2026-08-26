// SevaPath — Document Manager
// Handles document uploads, versioning, and status tracking

const DocumentManager = (() => {
  const documentStates = {
    submitted: { label: 'Submitted', labelHi: 'जमा किया गया', color: '#2980b9' },
    requested: { label: 'Requested', labelHi: 'अनुरोधित', color: '#e67e22' },
    received: { label: 'Received', labelHi: 'प्राप्त', color: '#27ae60' },
    under_review: { label: 'Under Review', labelHi: 'समीक्षा में', color: '#e67e22' },
    verified: { label: 'Verified', labelHi: 'सत्यापित', color: '#27ae60' },
    rejected: { label: 'Rejected', labelHi: 'अस्वीकृत', color: '#c0392b' },
    superseded: { label: 'Superseded', labelHi: 'अधिक्रमित', color: '#7f8c8d' }
  };

  function create(file, uploadedBy, requestedBy = null) {
    let url = null;
    try {
      if (file instanceof File || file instanceof Blob) {
        url = URL.createObjectURL(file);
      } else {
        // For mock/prototype files, create a data URL or use placeholder
        url = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nD2OywoCMQxF9/mKu3YRb5OZtgpD/QB/QKGCCyEkkO78fZ3pC4ZdhpB7b665h6rqOF4hBO89p4TknHPOOeecUkqptdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWmuttdZaa6211lprrbXWWsMfXjMSDmVuZHN0cmVhbQplbmRvYmoKCjMgMCBvYmoKMTQ0CmVuZG9iagoKNSAwIG9iago8PC9MZW5ndGggNiAwIFIvRmlsdGVyL0ZsYXRlRGVjb2RlPj4Kc3RyZWFtCnicK+RSCOEyVDBQMFAwACILBV0FA0NTBR1jBSMjA0MTBSMQy5RLwQAAXggFNAplbmRzdHJlYW0KZW5kb2JqCgo2IDAgb2JqCjU2CmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvUGFyZW50IDQgMCBSL1Jlc291cmNlczw8L0ZvbnQ8PC9GMSA3IDAgUj4+Pj4vTWVkaWFCb3hbMCAwIDU5NS4yOCA4NDEuODldL0NvbnRlbnRzIDIgMCBSPj4KZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvUGFnZXMvS2lkc1sxIDAgUl0vQ291bnQgMT4+CmVuZG9iagoKNyAwIG9iago8PC9UeXBlL0ZvbnQvU3VidHlwZS9UeXBlMS9CYXNlRm9udC9IZWx2ZXRpY2E+PgplbmRvYmoKCjggMCBvYmoKPDwvQ3JlYXRvcihSYXcpL1Byb2R1Y2VyKFJhdykvQ3JlYXRpb25EYXRlKEQ6MjAyNjA4MjYxNDAwMDArMDUnMzAnKT4+CmVuZG9iagoKeHJlZgowIDkKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMDIgMDAwMDAgbiAKMDAwMDAwMDM1OSAwMDAwMCBuIAowMDAwMDAwNDIyIDAwMDAwIG4gCjAwMDAwMDA0OTkgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDkvUm9vdCA4IDAgUj4+CnN0YXJ0eHJlZAo1NDcKJSVFT0YK';
      }
    } catch (e) {
      url = null;
    }
    return {
      id: `DOC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      type: file.type || 'application/pdf',
      size: Math.ceil((file.size || 0) / 1024),
      url: url,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      status: requestedBy ? 'received' : 'submitted',
      version: 1,
      requestedBy,
      verifiedBy: null,
      verificationStatus: 'pending'
    };
  }

  function getVersionHistory(docId, documents) {
    return documents.filter(d => d.name === documents.find(x => x.id === docId)?.name)
      .sort((a, b) => b.version - a.version);
  }

  function replace(oldDoc, file, caseData) {
    const newDoc = create(file, 'citizen', oldDoc.requestedBy);
    newDoc.version = oldDoc.version + 1;
    newDoc.name = oldDoc.name;

    const idx = caseData.documents.findIndex(d => d.id === oldDoc.id);
    if (idx >= 0) {
      caseData.documents[idx].status = 'superseded';
    }
    caseData.documents.push(newDoc);
    return newDoc;
  }

  function verify(docId, officerId, status, caseData) {
    const doc = caseData.documents.find(d => d.id === docId);
    if (!doc) return null;

    doc.verifiedBy = officerId;
    doc.verificationStatus = status;
    doc.status = status === 'accepted' ? 'verified' : 'rejected';
    return doc;
  }

  function getStateInfo(status, lang = 'en') {
    const s = documentStates[status] || documentStates.submitted;
    return { status, label: lang === 'hi' ? s.labelHi : s.label, color: s.color };
  }

  function getPendingDocuments(caseData) {
    return caseData.documents.filter(d => d.status === 'submitted' || d.status === 'received' || d.verificationStatus === 'pending');
  }

  function getVerifiedDocuments(caseData) {
    return caseData.documents.filter(d => d.status === 'verified');
  }

  function getRejectedDocuments(caseData) {
    return caseData.documents.filter(d => d.status === 'rejected');
  }

  return { create, getVersionHistory, replace, verify, getStateInfo, getPendingDocuments, getVerifiedDocuments, getRejectedDocuments, documentStates };
})();
