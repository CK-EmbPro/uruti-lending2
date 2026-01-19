'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { loanProductsApi } from '@/lib/api/loan-products';
import { companiesApi } from '@/lib/api/companies';
import { 
  ArrowLeft, 
  Package, 
  DollarSign,
  Calendar,
  TrendingUp,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function LoanProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['loan-product', productId],
    queryFn: () => loanProductsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: company } = useQuery({
    queryKey: ['company', product?.companyId],
    queryFn: () => companiesApi.getById(product!.companyId),
    enabled: !!product?.companyId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The loan product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0 w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
              <Package className="w-10 h-10 text-primary" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.productName}</h1>
              {product.productTagline && (
                <p className="text-lg text-gray-600 mb-3">{product.productTagline}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {company && (
                  <Link
                    href={`/companies/${company.id}`}
                    className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    <span>Offered by {company.name}</span>
                  </Link>
                )}
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Listed since {format(new Date(product.createdAt), 'MMM yyyy')}</span>
                </div>
                {!product.disabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                )}
                {product.disabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Metrics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Interest Rate */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-gray-600">Interest Rate</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{product.rateOfInterest}%</p>
                <p className="text-xs text-gray-600 mt-1">per annum</p>
              </div>
              {product.penaltyInterestRate > 0 && (
                <div className="px-6 py-3 bg-amber-50">
                  <p className="text-xs text-gray-600">Penalty Rate</p>
                  <p className="text-lg font-bold text-amber-900">{product.penaltyInterestRate}%</p>
                </div>
              )}
            </div>

            {/* Loan Amount Range */}
            {(product.minimumLoanAmount || product.maximumLoanAmount) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-sm font-medium text-gray-600">Loan Amount</h3>
                  </div>
                  <div className="space-y-2">
                    {product.minimumLoanAmount && (
                      <div>
                        <p className="text-xs text-gray-600">Minimum</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${product.minimumLoanAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {product.maximumLoanAmount && (
                      <div>
                        <p className="text-xs text-gray-600">Maximum</p>
                        <p className="text-xl font-bold text-gray-900">
                          ${product.maximumLoanAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loan Term */}
            {(product.minimumTerm || product.maximumTerm) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-medium text-gray-600">Loan Term</h3>
                  </div>
                  <div className="space-y-2">
                    {product.minimumTerm && (
                      <div>
                        <p className="text-xs text-gray-600">Minimum</p>
                        <p className="text-xl font-bold text-gray-900">{product.minimumTerm} months</p>
                      </div>
                    )}
                    {product.maximumTerm && (
                      <div>
                        <p className="text-xs text-gray-600">Maximum</p>
                        <p className="text-xl font-bold text-gray-900">{product.maximumTerm} months</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Product Type */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Product Type</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Term Loan</span>
                  {product.isTermLoan ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {product.requiresCollateral !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Requires Collateral</span>
                    {product.requiresCollateral ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
                {product.allowsPrepayment !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Allows Prepayment</span>
                    {product.allowsPrepayment ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {(product.shortDescription || product.productDescription) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <div className="px-6 py-4">
                  {product.shortDescription && (
                    <p className="text-gray-700 mb-4 text-lg">{product.shortDescription}</p>
                  )}
                  {product.productDescription && (
                    <p className="text-gray-600 whitespace-pre-line">{product.productDescription}</p>
                  )}
                </div>
              </div>
            )}

            {/* Key Features */}
            {product.keyFeatures && product.keyFeatures.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Key Features</h2>
                </div>
                <div className="px-6 py-4">
                  <ul className="space-y-3">
                    {product.keyFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Eligibility Criteria */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Eligibility Criteria</h2>
                </div>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.minimumAge && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Minimum Age</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.minimumAge} years</dd>
                  </div>
                )}
                {product.maximumAge && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Maximum Age</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.maximumAge} years</dd>
                  </div>
                )}
                {product.minimumAnnualIncome && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Minimum Annual Income</dt>
                    <dd className="text-sm font-semibold text-gray-900">${product.minimumAnnualIncome.toLocaleString()}</dd>
                  </div>
                )}
                {product.minimumCreditScore && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Minimum Credit Score</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.minimumCreditScore}</dd>
                  </div>
                )}
                {product.maximumDebtToIncomeRatio && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Max Debt-to-Income Ratio</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.maximumDebtToIncomeRatio}%</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-gray-900">Processing Information</h2>
                </div>
              </div>
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Product Code</dt>
                  <dd className="text-sm font-mono text-gray-900">{product.productCode}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Grace Period</dt>
                  <dd className="text-sm font-semibold text-gray-900">{product.gracePeriodInDays} days</dd>
                </div>
                {product.averageProcessingTime && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Avg. Processing Time</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.averageProcessingTime} days</dd>
                  </div>
                )}
                {product.averageDisbursementTime && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Avg. Disbursement Time</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.averageDisbursementTime} days</dd>
                  </div>
                )}
                {product.repaymentScheduleType && (
                  <div>
                    <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Repayment Schedule</dt>
                    <dd className="text-sm font-semibold text-gray-900">{product.repaymentScheduleType}</dd>
                  </div>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            {product.termsAndConditions && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-gray-900">Terms and Conditions</h2>
                  </div>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-600 whitespace-pre-line">{product.termsAndConditions}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
