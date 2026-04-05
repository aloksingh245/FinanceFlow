const ROLES = {
  VIEWER: 'viewer',
  ANALYST: 'analyst',
  ADMIN: 'admin'
};

const PERMISSIONS = {
  //                  read   write  analytics  manage_users  restore_records
  [ROLES.VIEWER]:  { read: false, write: false, analytics: true,  manage_users: false, restore_records: false },
  [ROLES.ANALYST]: { read: true,  write: false, analytics: true,  manage_users: false, restore_records: false },
  [ROLES.ADMIN]:   { read: true,  write: true,  analytics: true,  manage_users: true,  restore_records: true  }
};

const hasPermission = (userRole, requiredPermission) => {
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  return !!rolePermissions[requiredPermission];
};

module.exports = { ROLES, PERMISSIONS, hasPermission };