export enum NotificationType {
  // Loan Application
  APPLICATION_SUBMITTED = 'Application Submitted',
  APPLICATION_APPROVED = 'Application Approved',
  APPLICATION_REJECTED = 'Application Rejected',
  APPLICATION_UNDER_REVIEW = 'Application Under Review',
  
  // Loan Status
  LOAN_DISBURSED = 'Loan Disbursed',
  LOAN_ACTIVE = 'Loan Active',
  LOAN_CLOSED = 'Loan Closed',
  LOAN_OVERDUE = 'Loan Overdue',
  
  // Payments
  PAYMENT_DUE = 'Payment Due',
  PAYMENT_REMINDER = 'Payment Reminder',
  PAYMENT_RECEIVED = 'Payment Received',
  PAYMENT_FAILED = 'Payment Failed',
  PAYMENT_SCHEDULED = 'Payment Scheduled',
  
  // Collections
  DELINQUENCY_NOTICE = 'Delinquency Notice',
  COLLECTION_NOTICE = 'Collection Notice',
  FINAL_NOTICE = 'Final Notice',
  
  // Account Updates
  PROFILE_UPDATED = 'Profile Updated',
  PASSWORD_CHANGED = 'Password Changed',
  DOCUMENT_UPLOADED = 'Document Uploaded',
  APPLICATION_UPDATE = 'Application Update',
  
  // Marketing
  PROMOTIONAL = 'Promotional',
  NEW_PRODUCT = 'New Product',
  REFERRAL_BONUS = 'Referral Bonus',
  
  // System
  SYSTEM_ALERT = 'System Alert',
  SECURITY_ALERT = 'Security Alert',
  MAINTENANCE_NOTICE = 'Maintenance Notice',
}

