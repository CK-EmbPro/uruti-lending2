'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useCreateRole,
  useUpdateRole,
  useRoles,
  usePermissions,
  useSeedPermissions,
} from '@/lib/hooks/useAdministration';
import {
  Shield,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Key,
  Users,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { RoleType, type Role, type Permission, type CreateRoleDto, type UpdateRoleDto } from '@/lib/api/administration';

export function RolePermissionManagementDashboard() {
  const [activeView, setActiveView] = useState<'roles' | 'permissions'>('roles');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showViewRoleModal, setShowViewRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleType, setRoleType] = useState<RoleType>(RoleType.USER);
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const seedPermissions = useSeedPermissions();
  const { data: roles, isLoading: rolesLoading, refetch: refetchRoles } = useRoles();
  const { data: permissions, isLoading: permissionsLoading, refetch: refetchPermissions } = usePermissions();

  const handleCreateRole = () => {
    const dto: CreateRoleDto = {
      name: roleName,
      roleType,
      description: roleDescription || undefined,
      permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
      isActive,
    };

    createRole.mutate(dto, {
      onSuccess: () => {
        setShowCreateRoleModal(false);
        resetRoleForm();
        refetchRoles();
      },
    });
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;

    const dto: UpdateRoleDto = {
      name: roleName || undefined,
      description: roleDescription || undefined,
      permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
      isActive,
    };

    updateRole.mutate(
      { id: selectedRole.id, dto },
      {
        onSuccess: () => {
          setShowEditRoleModal(false);
          setSelectedRole(null);
          resetRoleForm();
          refetchRoles();
        },
      },
    );
  };

  const resetRoleForm = () => {
    setRoleName('');
    setRoleType(RoleType.USER);
    setRoleDescription('');
    setSelectedPermissionIds([]);
    setIsActive(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissionIds(role.permissions?.map((p) => p.id) || []);
    setIsActive(role.isActive);
    setShowEditRoleModal(true);
  };

  const openViewModal = (role: Role) => {
    setSelectedRole(role);
    setShowViewRoleModal(true);
  };

  // Ensure roles and permissions are arrays
  const rolesArray = Array.isArray(roles) ? roles : [];
  const permissionsArray = Array.isArray(permissions) ? permissions : [];
  
  const activeRolesCount = rolesArray.filter((r) => r.isActive).length;
  const totalPermissionsCount = permissionsArray.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Role & Permission Management</h2>
          <p className="text-sm text-gray-600 mt-1">Manage roles, permissions, and access control</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setActiveView('roles')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'roles'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Roles
            </button>
            <button
              onClick={() => setActiveView('permissions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'permissions'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Permissions
            </button>
          </div>
          {activeView === 'roles' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('This will create default permissions and roles. Continue?')) {
                    seedPermissions.mutate(undefined, {
                      onSuccess: () => {
                        refetchRoles();
                        refetchPermissions();
                      },
                    });
                  }
                }}
                disabled={seedPermissions.isPending}
              >
                <Shield className="h-4 w-4 mr-2" />
                {seedPermissions.isPending ? 'Seeding...' : 'Seed Permissions'}
              </Button>
              <Button onClick={() => setShowCreateRoleModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{rolesArray.length}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeRolesCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Permissions</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{totalPermissionsCount}</p>
              </div>
              <Key className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {activeView === 'roles' ? (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Roles</h3>

            {rolesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : rolesArray.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rolesArray.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-gray-500">{role.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">{role.roleType}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions?.slice(0, 3).map((perm) => (
                              <Badge key={perm.id} variant="outline" className="text-xs">
                                {perm.resource}:{perm.action}
                              </Badge>
                            ))}
                            {role.permissions && role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                            {(!role.permissions || role.permissions.length === 0) && (
                              <span className="text-sm text-gray-400">No permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {role.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewModal(role)}
                            >
                              <Lock className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(role)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No roles found</p>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h3>

            {permissionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Key className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-gray-900">
                            {permission.resource}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Action: <span className="font-medium">{permission.action}</span>
                        </div>
                        {permission.description && (
                          <p className="text-xs text-gray-500 mt-2">{permission.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No permissions found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Permissions are typically managed through the backend API
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Create Role Modal */}
      <Modal
        isOpen={showCreateRoleModal}
        onClose={() => {
          setShowCreateRoleModal(false);
          resetRoleForm();
        }}
        title="Create Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Senior Loan Officer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Type</label>
            <Select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value as RoleType)}
            >
              <option value={RoleType.ADMIN}>Admin</option>
              <option value={RoleType.PRODUCT_MANAGER}>Product Manager</option>
              <option value={RoleType.BUSINESS_ANALYST}>Business Analyst</option>
              <option value={RoleType.FINANCE_MANAGER}>Finance Manager</option>
              <option value={RoleType.LOAN_OFFICER}>Loan Officer</option>
              <option value={RoleType.COLLECTIONS_AGENT}>Collections Agent</option>
              <option value={RoleType.CUSTOMER_SERVICE}>Customer Service</option>
              <option value={RoleType.COMPLIANCE_OFFICER}>Compliance Officer</option>
              <option value={RoleType.RISK_MANAGER}>Risk Manager</option>
              <option value={RoleType.AUDITOR}>Auditor</option>
              <option value={RoleType.USER}>User</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Describe the role's responsibilities..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
              {permissions && permissions.length > 0 ? (
                permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`perm-${permission.id}`}
                      checked={selectedPermissionIds.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissionIds([...selectedPermissionIds, permission.id]);
                        } else {
                          setSelectedPermissionIds(
                            selectedPermissionIds.filter((id) => id !== permission.id),
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`perm-${permission.id}`}
                      className="text-sm text-gray-700 flex-1"
                    >
                      <span className="font-medium">{permission.resource}</span>:{' '}
                      <span>{permission.action}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No permissions available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCreate"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActiveCreate" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateRoleModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={!roleName || createRole.isPending}
            >
              {createRole.isPending ? 'Creating...' : 'Create Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={showEditRoleModal}
        onClose={() => {
          setShowEditRoleModal(false);
          setSelectedRole(null);
          resetRoleForm();
        }}
        title="Edit Role"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
            <Input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Senior Loan Officer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              placeholder="Describe the role's responsibilities..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-60 overflow-y-auto">
              {permissions && permissions.length > 0 ? (
                permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`perm-edit-${permission.id}`}
                      checked={selectedPermissionIds.includes(permission.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissionIds([...selectedPermissionIds, permission.id]);
                        } else {
                          setSelectedPermissionIds(
                            selectedPermissionIds.filter((id) => id !== permission.id),
                          );
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label
                      htmlFor={`perm-edit-${permission.id}`}
                      className="text-sm text-gray-700 flex-1"
                    >
                      <span className="font-medium">{permission.resource}</span>:{' '}
                      <span>{permission.action}</span>
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No permissions available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditRoleModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={updateRole.isPending}>
              {updateRole.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Role Modal */}
      <Modal
        isOpen={showViewRoleModal}
        onClose={() => {
          setShowViewRoleModal(false);
          setSelectedRole(null);
        }}
        title={`Role Details - ${selectedRole?.name || ''}`}
      >
        {selectedRole && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
              <p className="text-sm text-gray-900">{selectedRole.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role Type</label>
              <Badge variant="outline">{selectedRole.roleType}</Badge>
            </div>
            {selectedRole.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-sm text-gray-900">{selectedRole.description}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto">
                {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRole.permissions.map((permission) => (
                      <div
                        key={permission.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {permission.resource}
                          </span>
                          <span className="text-sm text-gray-600">:{permission.action}</span>
                        </div>
                        {permission.description && (
                          <span className="text-xs text-gray-500">{permission.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No permissions assigned</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {selectedRole.isActive ? (
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                <p className="text-gray-600">
                  {format(new Date(selectedRole.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Updated</label>
                <p className="text-gray-600">
                  {format(new Date(selectedRole.updatedAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

