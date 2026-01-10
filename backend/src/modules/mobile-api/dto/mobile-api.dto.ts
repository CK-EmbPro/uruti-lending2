import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsArray } from 'class-validator';

export enum MobilePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
  WEB = 'WEB',
}

export enum PushNotificationType {
  LOAN_APPROVED = 'LOAN_APPROVED',
  PAYMENT_DUE = 'PAYMENT_DUE',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  DOCUMENT_REQUIRED = 'DOCUMENT_REQUIRED',
  REMINDER = 'REMINDER',
  PROMOTIONAL = 'PROMOTIONAL',
}

export class RegisterDeviceDto {
  @ApiProperty({ description: 'Device token', example: 'fcm-token-or-apns-token' })
  @IsString()
  deviceToken: string;

  @ApiProperty({ description: 'Platform', enum: MobilePlatform })
  @IsEnum(MobilePlatform)
  platform: MobilePlatform;

  @ApiPropertyOptional({ description: 'Device ID', example: 'device-uuid' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'App version', example: '1.0.0' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class SendPushNotificationDto {
  @ApiProperty({ description: 'User ID', example: 'uuid' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: PushNotificationType })
  @IsEnum(PushNotificationType)
  type: PushNotificationType;

  @ApiProperty({ description: 'Title', example: 'Loan Approved' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Body', example: 'Your loan application has been approved' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Data payload', type: Object })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Image URL', example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class MobileDashboard {
  @ApiProperty({ description: 'Quick stats', type: Object })
  quickStats: {
    activeLoans: number;
    totalOutstanding: number;
    nextPaymentDue: number;
    nextPaymentDate?: string;
    pendingApplications: number;
  };

  @ApiProperty({ description: 'Recent activities', type: [Object] })
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    actionUrl?: string;
  }>;

  @ApiProperty({ description: 'Upcoming payments', type: [Object] })
  upcomingPayments: Array<{
    loanId: string;
    loanNumber: string;
    amount: number;
    dueDate: string;
    daysUntilDue: number;
  }>;

  @ApiProperty({ description: 'Notifications count', example: 5 })
  unreadNotifications: number;
}

export class MobileLoanDetails {
  @ApiProperty({ description: 'Loan information', type: Object })
  loan: {
    id: string;
    loanNumber: string;
    amount: number;
    outstandingBalance: number;
    interestRate: number;
    status: string;
    disbursedDate?: string;
    maturityDate?: string;
  };

  @ApiProperty({ description: 'Next payment', type: Object })
  nextPayment: {
    amount: number;
    dueDate: string;
    daysUntilDue: number;
  };

  @ApiProperty({ description: 'Payment history', type: [Object] })
  paymentHistory: Array<{
    date: string;
    amount: number;
    status: string;
  }>;

  @ApiProperty({ description: 'Documents', type: [Object] })
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadDate: string;
    downloadUrl: string;
  }>;
}

export class MobileApplicationStatus {
  @ApiProperty({ description: 'Application information', type: Object })
  application: {
    id: string;
    applicationNumber: string;
    status: string;
    appliedAmount: number;
    approvedAmount?: number;
    submittedDate: string;
  };

  @ApiProperty({ description: 'Current stage', example: 'UNDER_REVIEW' })
  currentStage: string;

  @ApiProperty({ description: 'Timeline', type: [Object] })
  timeline: Array<{
    stage: string;
    date: string;
    description: string;
  }>;

  @ApiProperty({ description: 'Required documents', type: [Object] })
  requiredDocuments: Array<{
    id: string;
    name: string;
    type: string;
    isUploaded: boolean;
    isRequired: boolean;
  }>;

  @ApiProperty({ description: 'Next steps', type: [String] })
  nextSteps: string[];
}

