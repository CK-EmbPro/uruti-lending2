import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RoleType } from '../../../common/enums/role-type.enum';

@Injectable()
export class PermissionSeedService {
  private readonly logger = new Logger(PermissionSeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * Seed default permissions for the system
   */
  async seedDefaultPermissions(): Promise<void> {
    this.logger.log('Starting permission seed...');

    try {
      // Check if permissions already exist
      const existingPermissions = await this.permissionRepository.count();
      if (existingPermissions > 0) {
        this.logger.log(
          `Found ${existingPermissions} existing permissions. Skipping seed.`,
        );
        return;
      }

      // Define default permissions
      const permissions = [
        // Loan Management
        { resource: 'loan', action: 'create', description: 'Create new loans' },
        { resource: 'loan', action: 'read', description: 'View loans' },
        { resource: 'loan', action: 'update', description: 'Update loan information' },
        { resource: 'loan', action: 'delete', description: 'Delete loans' },
        { resource: 'loan', action: 'approve', description: 'Approve loans' },
        { resource: 'loan', action: 'disburse', description: 'Disburse loans' },
        { resource: 'loan', action: 'close', description: 'Close loans' },
        { resource: 'loan', action: 'write-off', description: 'Write off loans' },

        // Loan Application
        { resource: 'loan-application', action: 'create', description: 'Create loan applications' },
        { resource: 'loan-application', action: 'read', description: 'View loan applications' },
        { resource: 'loan-application', action: 'update', description: 'Update loan applications' },
        { resource: 'loan-application', action: 'delete', description: 'Delete loan applications' },
        { resource: 'loan-application', action: 'submit', description: 'Submit loan applications' },
        { resource: 'loan-application', action: 'approve', description: 'Approve loan applications' },
        { resource: 'loan-application', action: 'reject', description: 'Reject loan applications' },

        // Customer Management
        { resource: 'customer', action: 'create', description: 'Create customers' },
        { resource: 'customer', action: 'read', description: 'View customers' },
        { resource: 'customer', action: 'update', description: 'Update customer information' },
        { resource: 'customer', action: 'delete', description: 'Delete customers' },

        // Collections
        { resource: 'collection', action: 'create', description: 'Create collection activities' },
        { resource: 'collection', action: 'read', description: 'View collection records' },
        { resource: 'collection', action: 'update', description: 'Update collection activities' },
        { resource: 'collection', action: 'manage', description: 'Manage collection workflows' },

        // Payments
        { resource: 'payment', action: 'create', description: 'Record payments' },
        { resource: 'payment', action: 'read', description: 'View payment records' },
        { resource: 'payment', action: 'update', description: 'Update payment records' },
        { resource: 'payment', action: 'reverse', description: 'Reverse payments' },

        // Disbursements
        { resource: 'disbursement', action: 'create', description: 'Create disbursements' },
        { resource: 'disbursement', action: 'read', description: 'View disbursements' },
        { resource: 'disbursement', action: 'approve', description: 'Approve disbursements' },
        { resource: 'disbursement', action: 'execute', description: 'Execute disbursements' },

        // Reports
        { resource: 'report', action: 'read', description: 'View reports' },
        { resource: 'report', action: 'generate', description: 'Generate reports' },
        { resource: 'report', action: 'export', description: 'Export reports' },

        // Administration
        { resource: 'user', action: 'create', description: 'Create user accounts' },
        { resource: 'user', action: 'read', description: 'View user accounts' },
        { resource: 'user', action: 'update', description: 'Update user accounts' },
        { resource: 'user', action: 'delete', description: 'Delete user accounts' },
        { resource: 'user', action: 'activate', description: 'Activate user accounts' },
        { resource: 'role', action: 'create', description: 'Create roles' },
        { resource: 'role', action: 'read', description: 'View roles' },
        { resource: 'role', action: 'update', description: 'Update roles' },
        { resource: 'role', action: 'delete', description: 'Delete roles' },
        { resource: 'permission', action: 'read', description: 'View permissions' },
        { resource: 'product', action: 'create', description: 'Create loan products' },
        { resource: 'product', action: 'read', description: 'View loan products' },
        { resource: 'product', action: 'update', description: 'Update loan products' },
        { resource: 'product', action: 'activate', description: 'Activate loan products' },

        // Risk Management
        { resource: 'risk', action: 'read', description: 'View risk data' },
        { resource: 'risk', action: 'manage', description: 'Manage risk settings' },
        { resource: 'risk', action: 'approve', description: 'Approve risk actions' },

        // Compliance
        { resource: 'compliance', action: 'read', description: 'View compliance data' },
        { resource: 'compliance', action: 'manage', description: 'Manage compliance' },
        { resource: 'compliance', action: 'review', description: 'Review compliance reports' },

        // Business Rules
        { resource: 'business-rule', action: 'create', description: 'Create business rules' },
        { resource: 'business-rule', action: 'read', description: 'View business rules' },
        { resource: 'business-rule', action: 'update', description: 'Update business rules' },
        { resource: 'business-rule', action: 'test', description: 'Test business rules' },
        { resource: 'business-rule', action: 'promote', description: 'Promote business rules' },

        // Fee Management
        { resource: 'fee', action: 'create', description: 'Create fee schedules' },
        { resource: 'fee', action: 'read', description: 'View fee schedules' },
        { resource: 'fee', action: 'update', description: 'Update fee schedules' },
        { resource: 'fee', action: 'apply', description: 'Apply fee schedules' },
      ];

      // Create permissions
      const createdPermissions: Permission[] = [];
      for (const permData of permissions) {
        const permission = this.permissionRepository.create(permData);
        const saved = await this.permissionRepository.save(permission);
        createdPermissions.push(saved);
        this.logger.log(`Created permission: ${permData.resource}:${permData.action}`);
      }

      this.logger.log(`Created ${createdPermissions.length} permissions`);

      // Seed default roles with permissions
      await this.seedDefaultRoles(createdPermissions);

      this.logger.log('Default permissions and roles seeded successfully');
    } catch (error) {
      this.logger.error('Error seeding permissions:', error);
      throw error;
    }
  }

  /**
   * Seed default roles with permissions
   */
  private async seedDefaultRoles(permissions: Permission[]): Promise<void> {
    this.logger.log('Starting role seed...');

    try {
      // Check if roles already exist
      const existingRoles = await this.roleRepository.count();
      if (existingRoles > 0) {
        this.logger.log(`Found ${existingRoles} existing roles. Skipping role seed.`);
        return;
      }

      // Helper function to get permissions by resource and actions
      const getPerms = (resource: string, actions: string[]) => {
        return permissions.filter(
          (p) => p.resource === resource && actions.includes(p.action),
        );
      };

      // Define default roles with their permissions
      const roles = [
        {
          name: 'System Administrator',
          roleType: RoleType.ADMIN,
          description: 'Full system access with all permissions',
          permissions: permissions, // Admin gets all permissions
        },
        {
          name: 'Loan Officer',
          roleType: RoleType.LOAN_OFFICER,
          description: 'Can create and manage loan applications',
          permissions: [
            ...getPerms('loan-application', ['create', 'read', 'update', 'submit']),
            ...getPerms('loan', ['read', 'update']),
            ...getPerms('customer', ['create', 'read', 'update']),
            ...getPerms('report', ['read']),
          ],
        },
        {
          name: 'Loan Manager',
          roleType: RoleType.FINANCE_MANAGER,
          description: 'Can approve loans and manage loan portfolio',
          permissions: [
            ...getPerms('loan', ['create', 'read', 'update', 'approve', 'disburse', 'close']),
            ...getPerms('loan-application', ['read', 'approve', 'reject']),
            ...getPerms('disbursement', ['create', 'read', 'approve', 'execute']),
            ...getPerms('payment', ['read']),
            ...getPerms('report', ['read', 'generate']),
          ],
        },
        {
          name: 'Collections Agent',
          roleType: RoleType.COLLECTIONS_AGENT,
          description: 'Can manage collection activities',
          permissions: [
            ...getPerms('collection', ['create', 'read', 'update', 'manage']),
            ...getPerms('loan', ['read']),
            ...getPerms('customer', ['read']),
            ...getPerms('payment', ['create', 'read']),
          ],
        },
        {
          name: 'Customer Service',
          roleType: RoleType.CUSTOMER_SERVICE,
          description: 'Can handle customer service requests',
          permissions: [
            ...getPerms('customer', ['read', 'update']),
            ...getPerms('loan', ['read']),
            ...getPerms('payment', ['read']),
          ],
        },
        {
          name: 'Compliance Officer',
          roleType: RoleType.COMPLIANCE_OFFICER,
          description: 'Can manage compliance and review reports',
          permissions: [
            ...getPerms('compliance', ['read', 'manage', 'review']),
            ...getPerms('report', ['read', 'generate', 'export']),
            ...getPerms('loan', ['read']),
          ],
        },
        {
          name: 'Risk Manager',
          roleType: RoleType.RISK_MANAGER,
          description: 'Can manage risk and view risk reports',
          permissions: [
            ...getPerms('risk', ['read', 'manage', 'approve']),
            ...getPerms('report', ['read', 'generate']),
            ...getPerms('loan', ['read']),
          ],
        },
        {
          name: 'Product Manager',
          roleType: RoleType.PRODUCT_MANAGER,
          description: 'Can manage loan products',
          permissions: [
            ...getPerms('product', ['create', 'read', 'update', 'activate']),
            ...getPerms('business-rule', ['create', 'read', 'update', 'test', 'promote']),
            ...getPerms('report', ['read']),
          ],
        },
        {
          name: 'Business Analyst',
          roleType: RoleType.BUSINESS_ANALYST,
          description: 'Can manage business rules',
          permissions: [
            ...getPerms('business-rule', ['create', 'read', 'update', 'test']),
            ...getPerms('report', ['read', 'generate']),
          ],
        },
        {
          name: 'Finance Manager',
          roleType: RoleType.FINANCE_MANAGER,
          description: 'Can manage fees and financial operations',
          permissions: [
            ...getPerms('fee', ['create', 'read', 'update', 'apply']),
            ...getPerms('payment', ['read', 'update']),
            ...getPerms('report', ['read', 'generate', 'export']),
          ],
        },
        {
          name: 'Auditor',
          roleType: RoleType.AUDITOR,
          description: 'Read-only access for auditing',
          permissions: [
            ...getPerms('loan', ['read']),
            ...getPerms('loan-application', ['read']),
            ...getPerms('customer', ['read']),
            ...getPerms('payment', ['read']),
            ...getPerms('report', ['read', 'export']),
            ...getPerms('compliance', ['read']),
          ],
        },
        {
          name: 'Regular User',
          roleType: RoleType.USER,
          description: 'Basic user with limited access',
          permissions: [
            ...getPerms('loan', ['read']),
            ...getPerms('loan-application', ['create', 'read']),
            ...getPerms('customer', ['read']),
            ...getPerms('payment', ['read']),
          ],
        },
      ];

      // Create roles
      for (const roleData of roles) {
        try {
          // Ensure permissions are unique and valid (filter out any undefined/null)
          const validPermissions = roleData.permissions.filter(
            (p) => p && p.id,
          );
          const uniquePermissions = Array.from(
            new Map(validPermissions.map((p) => [p.id, p])).values(),
          );

          if (uniquePermissions.length === 0) {
            this.logger.warn(
              `No valid permissions found for role: ${roleData.name}`,
            );
          }

          this.logger.log(
            `Creating role: ${roleData.name} with ${uniquePermissions.length} unique permissions`,
          );

          // Create role without permissions first
          const role = this.roleRepository.create({
            name: roleData.name,
            roleType: roleData.roleType,
            description: roleData.description,
            isActive: true,
          });

          // Save role first to get an ID
          const savedRole = await this.roleRepository.save(role);

          // Then assign permissions using the relationship (only if we have permissions)
          if (uniquePermissions.length > 0) {
            savedRole.permissions = uniquePermissions;
            await this.roleRepository.save(savedRole);
          }

          this.logger.log(
            `Created role: ${roleData.name} (${savedRole.id}) with ${uniquePermissions.length} permissions`,
          );
        } catch (error: any) {
          this.logger.error(`Error creating role ${roleData.name}:`, error);
          this.logger.error(`Error message: ${error.message}`);
          this.logger.error(`Error stack: ${error.stack}`);
          throw error;
        }
      }

      this.logger.log(`Created ${roles.length} roles`);
    } catch (error) {
      this.logger.error('Error seeding roles:', error);
      throw error;
    }
  }
}

