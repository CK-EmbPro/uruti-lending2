import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SavedSearchService } from '../modules/search/services/saved-search.service';
import { AuthService } from '../modules/auth/auth.service';
import { Logger } from '@nestjs/common';
import { SearchEntityType } from '../common/enums/search-entity-type.enum';

/**
 * Seed Saved Searches
 * 
 * This script creates useful saved searches for quick access.
 * These searches help users quickly find common loan scenarios.
 */

interface SavedSearchConfig {
  name: string;
  description: string;
  entityType: SearchEntityType | null;
  query?: string;
  filters?: Record<string, any>;
  sortBy?: Record<string, 'ASC' | 'DESC'>;
  limit?: number;
  isDefault?: boolean;
}

const defaultSavedSearches: SavedSearchConfig[] = [
  // Loan Searches
  {
    name: 'Active Loans',
    description: 'All currently active loans',
    entityType: SearchEntityType.LOAN,
    filters: {
      status: 'Active',
    },
    sortBy: {
      createdAt: 'DESC',
    },
    limit: 50,
    isDefault: true,
  },
  {
    name: 'Overdue Loans',
    description: 'Loans that are past due',
    entityType: SearchEntityType.LOAN,
    filters: {
      status: 'Overdue',
    },
    sortBy: {
      daysPastDue: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'High Value Loans',
    description: 'Loans over $50,000',
    entityType: SearchEntityType.LOAN,
    filters: {
      minAmount: 50000,
    },
    sortBy: {
      loanAmount: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'Loans This Month',
    description: 'Loans created this month',
    entityType: SearchEntityType.LOAN,
    filters: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    },
    sortBy: {
      createdAt: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'Disbursed Loans',
    description: 'All disbursed loans',
    entityType: SearchEntityType.LOAN,
    filters: {
      status: 'Disbursed',
    },
    sortBy: {
      disbursementDate: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'Closed Loans',
    description: 'All closed/completed loans',
    entityType: SearchEntityType.LOAN,
    filters: {
      status: 'Closed',
    },
    sortBy: {
      closureDate: 'DESC',
    },
    limit: 50,
  },

  // Loan Application Searches
  {
    name: 'Pending Applications',
    description: 'Applications pending review',
    entityType: SearchEntityType.LOAN_APPLICATION,
    filters: {
      status: 'Pending',
    },
    sortBy: {
      createdAt: 'DESC',
    },
    limit: 50,
    isDefault: true,
  },
  {
    name: 'Approved Applications',
    description: 'Recently approved applications',
    entityType: SearchEntityType.LOAN_APPLICATION,
    filters: {
      status: 'Approved',
    },
    sortBy: {
      updatedAt: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'Rejected Applications',
    description: 'Applications that were rejected',
    entityType: SearchEntityType.LOAN_APPLICATION,
    filters: {
      status: 'Rejected',
    },
    sortBy: {
      updatedAt: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'Under Review Applications',
    description: 'Applications currently under review',
    entityType: SearchEntityType.LOAN_APPLICATION,
    filters: {
      status: 'Under Review',
    },
    sortBy: {
      createdAt: 'DESC',
    },
    limit: 50,
  },
  {
    name: 'High Amount Applications',
    description: 'Applications requesting $25,000 or more',
    entityType: SearchEntityType.LOAN_APPLICATION,
    filters: {
      minAmount: 25000,
    },
    sortBy: {
      requestedAmount: 'DESC',
    },
    limit: 50,
  },

  // Loan Product Searches
  {
    name: 'All Products',
    description: 'All available loan products',
    entityType: SearchEntityType.LOAN_PRODUCT,
    sortBy: {
      productName: 'ASC',
    },
    limit: 100,
    isDefault: true,
  },
  {
    name: 'Personal Loans',
    description: 'Personal loan products',
    entityType: SearchEntityType.LOAN_PRODUCT,
    filters: {
      loanCategory: 'Personal Loan',
    },
    sortBy: {
      productName: 'ASC',
    },
    limit: 50,
  },
  {
    name: 'Business Loans',
    description: 'Business loan products',
    entityType: SearchEntityType.LOAN_PRODUCT,
    filters: {
      loanCategory: 'Business Loan',
    },
    sortBy: {
      productName: 'ASC',
    },
    limit: 50,
  },
  {
    name: 'Micro Loans',
    description: 'Micro lending products',
    entityType: SearchEntityType.LOAN_PRODUCT,
    filters: {
      loanCategory: 'Micro Loan',
    },
    sortBy: {
      productName: 'ASC',
    },
    limit: 50,
  },

  // Repayment Searches
  {
    name: 'Recent Repayments',
    description: 'Repayments from the last 30 days',
    entityType: SearchEntityType.LOAN_REPAYMENT,
    filters: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    sortBy: {
      postingDate: 'DESC',
    },
    limit: 100,
  },
  {
    name: 'Large Repayments',
    description: 'Repayments over $5,000',
    entityType: SearchEntityType.LOAN_REPAYMENT,
    filters: {
      minAmount: 5000,
    },
    sortBy: {
      amountPaid: 'DESC',
    },
    limit: 50,
  },

  // Disbursement Searches
  {
    name: 'Recent Disbursements',
    description: 'Disbursements from the last 30 days',
    entityType: SearchEntityType.LOAN_DISBURSEMENT,
    filters: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    sortBy: {
      disbursementDate: 'DESC',
    },
    limit: 100,
  },
  {
    name: 'Large Disbursements',
    description: 'Disbursements over $10,000',
    entityType: SearchEntityType.LOAN_DISBURSEMENT,
    filters: {
      minAmount: 10000,
    },
    sortBy: {
      disbursedAmount: 'DESC',
    },
    limit: 50,
  },

  // Global Searches
  {
    name: 'All Recent Activity',
    description: 'Recent activity across all entities',
    entityType: SearchEntityType.ALL,
    sortBy: {
      createdAt: 'DESC',
    },
    limit: 50,
  },
];

async function seedSavedSearches() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const savedSearchService = app.get(SavedSearchService);
  const authService = app.get(AuthService);
  const logger = new Logger('SeedSavedSearches');

  try {
    logger.log('🌱 Starting saved searches seed...');

    // Get user ID from command line args or use first admin user
    let userId = process.argv[2];

    if (!userId) {
      // Try to find first admin user
      try {
        const users = await authService.findAll();
        const adminUser = users.find((u) => u.roles?.includes('Admin') || u.roles?.includes('System Administrator'));
        
        if (adminUser) {
          userId = adminUser.id;
          logger.log(`Using admin user: ${adminUser.email} (${userId})`);
        } else if (users.length > 0) {
          userId = users[0].id;
          logger.log(`Using first user: ${users[0].email} (${userId})`);
        } else {
          logger.error('❌ No users found. Please create a user first or provide a user ID.');
          process.exit(1);
        }
      } catch (error) {
        logger.error('❌ Error finding users:', error);
        process.exit(1);
      }
    } else {
      logger.log(`Using provided user ID: ${userId}`);
    }

    let createdCount = 0;
    let skippedCount = 0;

    for (const searchConfig of defaultSavedSearches) {
      try {
        // Check if search already exists
        const existingSearches = await savedSearchService.findAll(userId, searchConfig.entityType || undefined);
        const exists = existingSearches.some(
          (s) => s.name === searchConfig.name && s.entityType === searchConfig.entityType,
        );

        if (exists) {
          logger.log(`⏭️  Skipping "${searchConfig.name}" - already exists`);
          skippedCount++;
          continue;
        }

        await savedSearchService.create(
          {
            name: searchConfig.name,
            description: searchConfig.description,
            entityType: searchConfig.entityType || undefined,
            query: searchConfig.query,
            filters: searchConfig.filters,
            sortBy: searchConfig.sortBy,
            limit: searchConfig.limit || 20,
            isDefault: searchConfig.isDefault || false,
          },
          userId,
        );

        logger.log(`✅ Created saved search: "${searchConfig.name}"`);
        createdCount++;
      } catch (error) {
        logger.error(`❌ Error creating saved search "${searchConfig.name}":`, error.message);
      }
    }

    logger.log(`\n📊 Summary:`);
    logger.log(`   ✅ Created: ${createdCount} saved searches`);
    logger.log(`   ⏭️  Skipped: ${skippedCount} saved searches (already exist)`);
    logger.log(`\n✅ Saved searches seed completed successfully!`);

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error seeding saved searches:', error);
    process.exit(1);
  }
}

seedSavedSearches();

