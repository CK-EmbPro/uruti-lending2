'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '@/lib/api/companies';
import { loanProductsApi } from '@/lib/api/loan-products';
import { 
  ArrowLeft, 
  Building2, 
  Globe, 
  Calendar,
  Package,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const { data: company, isLoading, error } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companiesApi.getById(companyId),
    enabled: !!companyId,
  });

  const { data: loanProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['loan-products', companyId],
    queryFn: () => loanProductsApi.getAll(companyId),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Not Found</h2>
          <p className="text-gray-600 mb-6">The company you're looking for doesn't exist or has been removed.</p>
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
              <Building2 className="w-10 h-10 text-primary" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span>Code: {company.code}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>{company.country}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Active since {format(new Date(company.createdAt), 'MMM yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Company ID</dt>
                  <dd className="text-sm font-mono text-gray-900">{company.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Company Code</dt>
                  <dd className="text-sm font-semibold text-gray-900">{company.code}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Country</dt>
                  <dd className="text-sm font-semibold text-gray-900">{company.country}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Created</dt>
                  <dd className="text-sm text-gray-900">{format(new Date(company.createdAt), 'PPP')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Last Updated</dt>
                  <dd className="text-sm text-gray-900">{format(new Date(company.updatedAt), 'PPP')}</dd>
                </div>
              </div>
            </div>
          </div>

          {/* Loan Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Loan Products</h2>
                <p className="text-sm text-gray-600 mt-1">Available products offered by this company</p>
              </div>
              
              {productsLoading ? (
                <div className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Loading products...</p>
                </div>
              ) : !loanProducts || loanProducts.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No loan products available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {loanProducts.map((product) => (
                    <Link
                      key={product.id}
                      href={`/loan-products/${product.id}`}
                      className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 mb-1">
                            {product.productName}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{product.productCode}</p>
                          {product.shortDescription && (
                            <p className="text-sm text-gray-700 mb-3">{product.shortDescription}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Interest Rate:</span>{' '}
                              <span className="font-semibold text-gray-900">{product.rateOfInterest}%</span>
                            </div>
                            {product.minimumLoanAmount && product.maximumLoanAmount && (
                              <div>
                                <span className="text-gray-600">Amount Range:</span>{' '}
                                <span className="font-semibold text-gray-900">
                                  ${product.minimumLoanAmount.toLocaleString()} - ${product.maximumLoanAmount.toLocaleString()}
                                </span>
                              </div>
                            )}
                            {product.minimumTerm && product.maximumTerm && (
                              <div>
                                <span className="text-gray-600">Term:</span>{' '}
                                <span className="font-semibold text-gray-900">
                                  {product.minimumTerm}-{product.maximumTerm} months
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
