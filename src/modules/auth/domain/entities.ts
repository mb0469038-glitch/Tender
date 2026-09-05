export type Permission = {
  id: string;
  module: string;
  label: string;
  description: string;
};

export type RoleSummary = {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissionIds: string[];
};

export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  roleIds: string[];
};

export type SessionInfo = {
  userId: string;
  username: string;
  displayName: string;
  roleIds: string[];
  permissions: string[];
};
