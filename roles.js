// SevaPath — Role-Based Access Control
// Defines roles and permissions

const Roles = (() => {
  const roles = {
    citizen: {
      name: 'Citizen',
      nameHi: 'नागरिक',
      permissions: [
        'view_own_cases',
        'upload_documents',
        'respond_to_requests',
        'view_timeline',
        'view_decisions',
        'receive_notifications'
      ]
    },
    revenue_officer: {
      name: 'Revenue Officer',
      nameHi: 'राजस्व अधिकारी',
      department: 'revenue',
      permissions: [
        'view_assigned_cases',
        'verify_documents',
        'request_documents',
        'return_cases',
        'recommend',
        'forward',
        'approve',
        'reject',
        'schedule_inspection'
      ]
    },
    land_records_officer: {
      name: 'Land Records Officer',
      nameHi: 'भूमि अभिलेख अधिकारी',
      department: 'land_records',
      permissions: [
        'view_assigned_cases',
        'review_previous_work',
        'update_land_record',
        'request_clarification',
        'recommend',
        'approve',
        'reject',
        'forward'
      ]
    },
    municipal_officer: {
      name: 'Municipal Officer',
      nameHi: 'नगर निगम अधिकारी',
      department: 'municipal',
      permissions: [
        'view_assigned_cases',
        'review_property_info',
        'request_documents',
        'approve',
        'reject',
        'complete_inspection'
      ]
    },
    senior_officer: {
      name: 'Senior Officer',
      nameHi: 'वरिष्ठ अधिकारी',
      permissions: [
        'view_department_cases',
        'view_escalations',
        'reassign',
        'review_sla',
        'resolve_escalation',
        'add_instruction',
        'approve'
      ]
    },
    admin: {
      name: 'Administrator',
      nameHi: 'प्रशासक',
      permissions: [
        'configure_workflows',
        'configure_departments',
        'configure_sla',
        'configure_dependencies',
        'view_all_cases',
        'manage_roles'
      ]
    }
  };

  function hasPermission(role, permission) {
    return roles[role]?.permissions.includes(permission) || false;
  }

  function getRole(role) {
    return roles[role] || null;
  }

  function getAllRoles() {
    return { ...roles };
  }

  function getDepartment(role) {
    return roles[role]?.department || null;
  }

  return { hasPermission, getRole, getAllRoles, getDepartment };
})();
