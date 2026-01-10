'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  useCreateUserAccount,
  useUpdateUserAccount,
  useActivateUserAccount,
  useUserAccounts,
  useUserAccount,
  useUserActivityLogs,
  useRoles,
} from '@/lib/hooks/useAdministration';
import {
  Users,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Activity,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import type { UserStatus, CreateUserAccountDto, UpdateUserAccountDto } from '@/lib/api/administration';

export function UserAccountManagementDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [remarks, setRemarks] = useState('');

  const createUser = useCreateUserAccount();
  const updateUser = useUpdateUserAccount();
  const activateUser = useActivateUserAccount();
  const { data: users, isLoading, refetch } = useUserAccounts({
    status: selectedStatus || undefined,
  });
  const { data: selectedUser } = useUserAccount(selectedUserId || '');
  const { data: activityLogs } = useUserActivityLogs(selectedUserId || '', 50);
  const { data: roles } = useRoles();

  const handleCreate = () => {
    const dto: CreateUserAccountDto = {
      email,
      password,
      name,
      phoneNumber: phoneNumber || undefined,
      companyId,
      roleIds: roleIds.length > 0 ? roleIds : undefined,
      isMfaEnabled,
      remarks: remarks || undefined,
    };

    createUser.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    });
  };

  const handleUpdate = () => {
    if (!selectedUserId) return;

    const dto: UpdateUserAccountDto = {
      name: name || undefined,
      phoneNumber: phoneNumber || undefined,
      roleIds: roleIds.length > 0 ? roleIds : undefined,
      isMfaEnabled,
      remarks: remarks || undefined,
    };

    updateUser.mutate(
      { id: selectedUserId, dto },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedUserId(null);
          resetForm();
          refetch();
        },
      },
    );
  };

  const handleActivate = (id: string) => {
    activateUser.mutate(
      { id, dto: {} },
      {
        onSuccess: () => {
          refetch();
        },
      },
    );
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPhoneNumber('');
    setCompanyId('');
    setRoleIds([]);
    setIsMfaEnabled(false);
    setRemarks('');
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending Activation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Suspended':
        return 'bg-orange-100 text-orange-800';
      case 'Locked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Ensure users is always an array
  const usersArray = Array.isArray(users) ? users : [];
  
  const activeCount = usersArray.filter((u) => u.status === 'Active').length;
  const pendingCount = usersArray.filter((u) => u.status === 'Pending Activation').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Account Management</h2>
          <p className="text-sm text-gray-600 mt-1">Create, manage, and monitor user accounts with role-based access control</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as UserStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="Pending Activation">Pending Activation</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
            <option value="Locked">Locked</option>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{usersArray.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Accounts</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : usersArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MFA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usersArray.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(user.status)}>{user.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.slice(0, 2).map((role) => (
                            <Badge key={role.id} variant="outline">
                              {role.name}
                            </Badge>
                          ))}
                          {user.roles && user.roles.length > 2 && (
                            <Badge variant="outline">+{user.roles.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isMfaEnabled ? (
                          <Shield className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy') : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setShowActivityModal(true);
                            }}
                          >
                            <Activity className="h-4 w-4 mr-1" />
                            Activity
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setName(user.name);
                              setPhoneNumber(user.phoneNumber || '');
                              setRoleIds(user.roles?.map((r) => r.id) || []);
                              setIsMfaEnabled(user.isMfaEnabled);
                              setRemarks(user.remarks || '');
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {user.status === 'Pending Activation' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleActivate(user.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No user accounts found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create User Account"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Secure password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
            <Input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="company-123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {roles && roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`role-edit-${role.id}`}
                      checked={roleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoleIds([...roleIds, role.id]);
                        } else {
                          setRoleIds(roleIds.filter((id) => id !== role.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`role-edit-${role.id}`} className="text-sm text-gray-700">
                      {role.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No roles available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mfaEnabled"
              checked={isMfaEnabled}
              onChange={(e) => setIsMfaEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="mfaEnabled" className="text-sm text-gray-700">
              Enable Multi-Factor Authentication
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!email || !password || !name || !companyId || createUser.isPending}
            >
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUserId(null);
          resetForm();
        }}
        title="Edit User Account"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <Input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
              {roles && roles.length > 0 ? (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      id={`role-edit-${role.id}`}
                      checked={roleIds.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRoleIds([...roleIds, role.id]);
                        } else {
                          setRoleIds(roleIds.filter((id) => id !== role.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor={`role-edit-${role.id}`} className="text-sm text-gray-700">
                      {role.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No roles available</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mfaEnabledEdit"
              checked={isMfaEnabled}
              onChange={(e) => setIsMfaEnabled(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="mfaEnabledEdit" className="text-sm text-gray-700">
              Enable Multi-Factor Authentication
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activity Log Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => {
          setShowActivityModal(false);
          setSelectedUserId(null);
        }}
        title={`Activity Logs - ${selectedUser?.name || 'User'}`}
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activityLogs && activityLogs.length > 0 ? (
            activityLogs.map((log) => (
              <div key={log.id} className="border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.activityType}</p>
                    <p className="text-xs text-gray-500">{log.description}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(log.activityDate), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-8">No activity logs found</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

