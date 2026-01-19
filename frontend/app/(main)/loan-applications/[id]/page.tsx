'use client';

import { useLoanApplication } from '@/lib/hooks/useLoanApplication';
import { useCompany } from '@/lib/hooks/useCompany';
import { useLoanProduct } from '@/lib/hooks/useLoanProduct';
import { useParams, useRouter } from 'next/navigation';
import { KYCSection } from '@/components/features/KYCSection';
import { CreditAssessmentSection } from '@/components/features/CreditAssessmentSection';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { useApproveLoanApplication, useCreateLoanFromApplication } from '@/lib/hooks/useLoanApplication';
import { WorkflowActions } from '@/components/features/WorkflowActions';
import Link from 'next/link';
import { 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  User, 
  Building2, 
  FileText, 
  Calendar,
  Percent,
  CreditCard,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  Shield,
  ArrowLeft,
  Download,
  Edit,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

export default function LoanApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;
  const { data: application, isLoading } = useLoanApplication(applicationId);
  const { data: company, isLoading: isLoadingCompany } = useCompany(application?.companyId || '');
  const { data: loanProduct, isLoading: isLoadingLoanProduct } = useLoanProduct(application?.loanProductId || '');
  const approveApplication = useApproveLoanApplication();
  const createLoan = useCreateLoanFromApplication();


  if (isLoading) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
        <div className="mx-auto max-w-6xl">
          <Alert variant="error" title="Application Not Found">
            The loan application you&apos;re looking for doesn&apos;t exist or has been removed.
          </Alert>
        </div>
      </div>
    );
  }

  const canApprove = application.status === 'Submitted' || application.status === 'Draft' || application.status === 'SUBMITTED' || application.status === 'DRAFT';
  const canCreateLoan = application.status === 'Approved' || application.status === 'APPROVED';


  const getStatusColor = (status: string) => {
    if (status === 'Approved' || status === 'APPROVED') {
      return 'bg-secondary/20 text-secondary';
    }
    if (status === 'Rejected' || status === 'REJECTED' || status === 'Cancelled' || status === 'CANCELLED') {
      return 'bg-red-100 text-red-800';
    }
    if (status === 'Submitted' || status === 'SUBMITTED') {
      return 'bg-primary/20 text-primary';
    }
    if (status === 'Under Review' || status === 'UNDER_REVIEW') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const statusColor = getStatusColor(application.status || '');
  const loanProductName = loanProduct?.productName || 'Loan Product';
  
  // Calculate key metrics
  const loanAmount = application.loanAmount || application.requestedAmount || 0;
  const approvedAmount = application.approvedAmount || 0;
  const hasApprovedAmount = approvedAmount > 0;

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              Home
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <Link href="/loan-applications" className="text-primary/80 text-base font-medium leading-normal hover:underline">
              Loan Applications
            </Link>
            <span className="text-primary/80 text-base font-medium leading-normal">/</span>
            <span className="text-gray-900 text-base font-medium leading-normal">
              {application.applicationNumber || application.id?.slice(0, 8)?.toUpperCase() || 'N/A'}
            </span>
          </div>

          {/* Title and Status */}
          <div className="flex flex-wrap items-start justify-between gap-4 pt-4">
            <div className="flex min-w-72 flex-col gap-2">
              <p className="text-gray-900 text-4xl font-black leading-tight tracking-tight">
                Loan Application Details
              </p>
              <p className="text-gray-600 text-base font-normal leading-normal">
                {loanProductName} - {application.applicationNumber || application.id?.slice(0, 8)?.toUpperCase() || 'N/A'}
              </p>
            </div>
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${statusColor}`}>
              <div className="h-2.5 w-2.5 rounded-full bg-current"></div>
              <span className="text-base font-bold leading-normal">{application.status || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 width */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* Application Summary Card */}
            <div className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-white p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-gray-600 text-xs font-medium uppercase tracking-wide">Application Summary</p>
                  </div>
                  {hasApprovedAmount && (
                    <Badge variant="success" size="sm">
                      Approved
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-3 mt-2">
                  <p className="text-gray-900 text-3xl font-bold leading-none tracking-tighter">
                    ${(loanAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {hasApprovedAmount && (
                    <p className="text-secondary text-sm font-semibold">
                      → ${(approvedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
              <div className="border-t border-gray-200 grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50 divide-x divide-gray-200">
                <div className="flex flex-col gap-0.5 p-3">
                  <div className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-primary" />
                    <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wide">Rate</p>
                  </div>
                  <p className="text-gray-900 text-sm font-bold leading-tight">
                    {loanProduct?.rateOfInterest || 'N/A'}%
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wide">Type</p>
                  </div>
                  <p className="text-gray-900 text-sm font-bold leading-tight">
                    {application.applicantType || 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wide">Date</p>
                  </div>
                  <p className="text-gray-900 text-sm font-bold leading-tight">
                    {application.applicationDate ? format(new Date(application.applicationDate), 'MM/dd/yy') : 'N/A'}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-primary" />
                    <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wide">Secured</p>
                  </div>
                  <p className="text-gray-900 text-sm font-bold leading-tight">
                    {application.isSecuredLoan ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>

            {/* Applicant & Loan Details Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-primary/5 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 mt-1">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Applicant & Loan Information</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete details about the applicant and loan terms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Applicant Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Applicant Information</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Applicant Type</dt>
                        <dd className="text-sm font-semibold text-gray-900">{application.applicantType || 'N/A'}</dd>
                      </div>
                      {application.applicantId && (
                        <div>
                          <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Applicant ID</dt>
                          <dd className="text-sm font-semibold text-gray-900">{application.applicantId}</dd>
                        </div>
                      )}
                      {application.applicantPhoneNumber && (
                        <div>
                          <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Phone Number</dt>
                          <dd className="text-sm font-semibold text-gray-900">{application.applicantPhoneNumber}</dd>
                        </div>
                      )}
                      {application.email && (
                        <div>
                          <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Email Address</dt>
                          <dd className="text-sm font-semibold text-gray-900">{application.email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  {/* Loan Info */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Loan Details</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Company</dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {isLoadingCompany ? 'Loading...' : company?.name || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Loan Product</dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {isLoadingLoanProduct ? 'Loading...' : loanProduct?.productName || 'N/A'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Is Term Loan</dt>
                        <dd className="text-sm font-semibold text-gray-900">
                          {loanProduct?.isTermLoan ? (
                            <Badge variant="success" size="sm">Yes</Badge>
                          ) : (
                            <Badge variant="default" size="sm">No</Badge>
                          )}
                        </dd>
                      </div>
                      {application.repaymentPeriods && (
                        <div>
                          <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Repayment Periods</dt>
                          <dd className="text-sm font-semibold text-gray-900">
                            {application.repaymentPeriods} {application.repaymentPeriods === 1 ? 'Period' : 'Periods'}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* KYC Section */}
            <KYCSection
              applicationId={application.id}
              applicationStatus={application.status || ''}
              onKYCComplete={() => {
                window.location.reload();
              }}
            />

            {/* Credit Assessment Section */}
            <CreditAssessmentSection
              applicationId={application.id}
              applicationStatus={application.status || ''}
            />

            {/* Remarks/Notes Section */}
            {((application as any).remarks || application.rejectionDate) && (
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className={`p-6 border-b border-gray-200 ${
                  application.status === 'Rejected' || application.status === 'REJECTED' 
                    ? 'bg-gradient-to-r from-red-50 to-white' 
                    : 'bg-gradient-to-r from-primary/5 to-white'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      application.status === 'Rejected' || application.status === 'REJECTED'
                        ? 'bg-red-100'
                        : 'bg-primary/10'
                    }`}>
                      <AlertCircle className={`w-5 h-5 ${
                        application.status === 'Rejected' || application.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-primary'
                      }`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {application.status === 'Rejected' || application.status === 'REJECTED' ? 'Rejection Details' : 'Application Remarks'}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  {application.rejectionDate && (
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Rejection Date</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {format(new Date(application.rejectionDate), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                  {(application as any).remarks && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Remarks</p>
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                        {(application as any).remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            {/* Quick Actions Card */}
            <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-white shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  {canApprove && (
                    <Button 
                      onClick={() => approveApplication.mutate(applicationId)}
                      className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                      disabled={approveApplication.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {approveApplication.isPending ? 'Approving...' : 'Approve Application'}
                    </Button>
                  )}

                  {canCreateLoan && (
                    <Button 
                      onClick={() => createLoan.mutate(applicationId)}
                      className="w-full flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-md hover:shadow-lg transition-all"
                      disabled={createLoan.isPending}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {createLoan.isPending ? 'Creating Loan...' : 'Create Loan'}
                    </Button>
                  )}

                  <WorkflowActions
                    documentType="Loan Application"
                    documentId={applicationId}
                    currentState={application.status}
                    onActionComplete={() => window.location.reload()}
                  />
                  <Button variant="outline" className="w-full flex items-center gap-2 border-gray-300">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Application Details Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Application Details</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Key information about this application.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Application Number</h4>
                      <p className="text-sm font-semibold text-gray-900">
                        {application.applicationNumber || application.id?.slice(0, 8)?.toUpperCase() || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Posting Date</h4>
                      <p className="text-sm font-semibold text-gray-900">
                        {application.applicationDate ? format(new Date(application.applicationDate), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                {application.approvalDate && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Approval Date</h4>
                        <p className="text-sm font-semibold text-gray-900">
                          {format(new Date(application.approvalDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Created</h4>
                      <p className="text-sm font-semibold text-gray-900">
                        {application.createdAt ? format(new Date(application.createdAt), 'MMM d, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Information Card */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-primary/5 to-white border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Related Information</h3>
                </div>
              </div>
              <div className="flex flex-col">
                {company && (
                  <Link
                    href={`/companies/${company.id}`}
                    className="border-t border-gray-200 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">View Company</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {company.name}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 mt-1" />
                    </div>
                  </Link>
                )}
                {loanProduct && (
                  <Link
                    href={`/loan-products/${loanProduct.id}`}
                    className="border-t border-gray-200 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">View Loan Product</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {loanProduct.name}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 mt-1" />
                    </div>
                  </Link>
                )}
                {(application as any).loanId && (
                  <Link
                    href={`/loans/${(application as any).loanId}`}
                    className="border-t border-gray-200 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">View Created Loan</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          View the loan created from this application
                        </p>
                      </div>
                      <ChevronRight className="text-gray-400 mt-1" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
