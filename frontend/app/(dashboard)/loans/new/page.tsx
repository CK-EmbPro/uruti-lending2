'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLoan } from '@/lib/hooks/useLoan';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useLoanProducts } from '@/lib/hooks/useLoanProduct';
import { useCompanies } from '@/lib/hooks/useCompany';
import { useLoanApplications } from '@/lib/hooks/useLoanApplication';
import {
  Building2,
  FileText,
  User,
  DollarSign,
  Calendar,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';
import toast from 'react-hot-toast';

const loanSchema = z.object({
  loanApplicationId: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  applicantType: z.enum(['Customer', 'Employee']),
  applicantId: z.string().min(1, 'Applicant is required'),
  loanProductId: z.string().min(1, 'Loan product is required'),
  loanAmount: z.number().positive('Loan amount must be positive'),
  rateOfInterest: z.number().min(0).max(100, 'Interest rate cannot exceed 100%'),
  isTermLoan: z.boolean(),
  isSecuredLoan: z.boolean(),
  postingDate: z.string().min(1, 'Posting date is required'),
});

type LoanFormData = z.infer<typeof loanSchema>;

export default function NewLoanPage() {
  const createLoan = useCreateLoan();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: loanProducts, isLoading: productsLoading } = useLoanProducts();
  const { data: applications, isLoading: applicationsLoading } = useLoanApplications();

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    mode: 'onChange',
    defaultValues: {
      applicantType: 'Customer',
      isTermLoan: false,
      isSecuredLoan: false,
      rateOfInterest: 0,
      postingDate: new Date().toISOString().split('T')[0],
    },
  });

  const selectedProduct = loanProducts?.find(
    (p) => p.id === form.watch('loanProductId')
  );
  const selectedApplication = applications?.find(
    (app) => app.id === form.watch('loanApplicationId')
  );
  const selectedCompany = companies?.find((c) => c.id === form.watch('companyId'));

  // Auto-fill from selected application
  useEffect(() => {
    if (selectedApplication) {
      form.setValue('companyId', selectedApplication.companyId);
      form.setValue('loanProductId', selectedApplication.loanProductId);
      form.setValue('loanAmount', selectedApplication.loanAmount || 0);
      form.setValue('rateOfInterest', selectedApplication.rateOfInterest || 0);
      form.setValue('isTermLoan', selectedApplication.isTermLoan);
      form.setValue('isSecuredLoan', selectedApplication.isSecuredLoan);
      toast.success('Loan details auto-filled from application', { icon: '✨' });
    }
  }, [selectedApplication, form]);

  // Auto-fill product details
  useEffect(() => {
    if (selectedProduct && !selectedApplication) {
      form.setValue('rateOfInterest', selectedProduct.rateOfInterest);
      form.setValue('isTermLoan', selectedProduct.isTermLoan);
      form.setValue('isSecuredLoan', selectedProduct.isSecuredLoan);
    }
  }, [selectedProduct, selectedApplication, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await createLoan.mutateAsync(data);
      toast.success('Loan created successfully!', { icon: '✅' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create loan');
    }
  });

  const approvedApplications = applications?.filter(
    (app) => app.status === 'Approved'
  ) || [];

  const isLoading = companiesLoading || productsLoading || applicationsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Loans', href: '/loans' }, { label: 'New Loan' }]} />
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <Card>
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <Breadcrumb items={[{ label: 'Loans', href: '/loans' }, { label: 'New Loan' }]} />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
            Create New Loan
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Create a new loan from an approved application or manually. All fields marked with * are required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Loan Application Selection */}
          {approvedApplications.length > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Link to Approved Application</h2>
                    <p className="text-sm text-gray-600">
                      Select an approved loan application to auto-fill loan details
                    </p>
                  </div>
                </div>
                <Select
                  label="Loan Application (Optional)"
                  options={[
                    { value: '', label: 'Create manually (no application)' },
                    ...approvedApplications.map((app) => ({
                      value: app.id,
                      label: `Application ${app.id.slice(0, 8)} - $${(app.loanAmount || 0).toLocaleString()} - ${app.status}`,
                    })),
                  ]}
                  {...form.register('loanApplicationId')}
                  helperText="Selecting an application will auto-fill loan details below"
                />
                {selectedApplication && (
                  <div className="p-4 bg-white border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2 text-sm">
                        <p className="font-semibold text-gray-900">Application Details:</p>
                        <div className="grid grid-cols-2 gap-2 text-gray-600">
                          <div>
                            <span className="font-medium">Amount:</span> ${(selectedApplication.loanAmount || 0).toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span>{' '}
                            {loanProducts?.find((p) => p.id === selectedApplication.loanProductId)?.name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Interest Rate:</span> {selectedApplication.rateOfInterest}%
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>{' '}
                            {selectedApplication.isTermLoan && (
                              <Badge variant="info" size="sm" className="ml-1">
                                Term Loan
                              </Badge>
                            )}
                            {selectedApplication.isSecuredLoan && (
                              <Badge variant="info" size="sm" className="ml-1">
                                Secured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Loan Information */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Loan Information</h2>
                  <p className="text-sm text-gray-600">Basic loan details and configuration</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Select
                    label="Company"
                    options={companies?.map((c) => ({ value: c.id, label: c.name })) || []}
                    {...form.register('companyId')}
                    required
                    error={form.formState.errors.companyId?.message}
                    helperText="Select the company for this loan"
                  />
                  {selectedCompany && (
                    <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Company:</span> {selectedCompany.name}
                      </p>
                    </div>
                  )}
                </div>

                <Select
                  label="Applicant Type"
                  options={[
                    { value: 'Customer', label: 'Customer' },
                    { value: 'Employee', label: 'Employee' },
                  ]}
                  {...form.register('applicantType')}
                  error={form.formState.errors.applicantType?.message}
                  helperText="Select whether the applicant is a customer or employee"
                />

                <Input
                  label="Applicant ID"
                  {...form.register('applicantId')}
                  required
                  error={form.formState.errors.applicantId?.message}
                  helperText="Enter the unique identifier for the applicant"
                />

                <div className="md:col-span-2">
                  <Select
                    label="Loan Product"
                    options={
                      loanProducts?.map((p) => ({
                        value: p.id,
                        label: `${p.productName || p.name || 'Unnamed Product'} ${p.isTermLoan ? '(Term Loan)' : ''} ${p.requiresCollateral || p.productType === 'Secured' || p.isSecuredLoan ? '(Secured)' : ''}`,
                      })) || []
                    }
                    {...form.register('loanProductId')}
                    required
                    error={form.formState.errors.loanProductId?.message}
                    helperText="Select the loan product that defines the loan terms"
                  />
                  {selectedProduct && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="font-semibold text-blue-900">Product Details:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-blue-700 font-medium">Interest Rate</p>
                              <p className="text-blue-900 font-semibold">{selectedProduct.rateOfInterest}%</p>
                            </div>
                            <div>
                              <p className="text-blue-700 font-medium">Penalty Rate</p>
                              <p className="text-blue-900 font-semibold">{selectedProduct.penaltyInterestRate}%</p>
                            </div>
                            <div>
                              <p className="text-blue-700 font-medium">Type</p>
                              <div className="flex gap-1 mt-1">
                                {selectedProduct.isTermLoan && (
                                  <Badge variant="info" size="sm">
                                    Term
                                  </Badge>
                                )}
                                {selectedProduct.isSecuredLoan && (
                                  <Badge variant="info" size="sm">
                                    Secured
                                  </Badge>
                                )}
                                {!selectedProduct.isTermLoan && !selectedProduct.isSecuredLoan && (
                                  <span className="text-blue-900 text-xs">Standard</span>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-blue-700 font-medium">Schedule</p>
                              <p className="text-blue-900 font-semibold text-xs">
                                {selectedProduct.repaymentScheduleType || 'Standard'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Input
                  label="Loan Amount"
                  type="number"
                  step="0.01"
                  {...form.register('loanAmount', { valueAsNumber: true })}
                  required
                  error={form.formState.errors.loanAmount?.message}
                  helperText="Enter the total loan amount in the base currency"
                />

                <Input
                  label="Rate of Interest (%)"
                  type="number"
                  step="0.01"
                  {...form.register('rateOfInterest', { valueAsNumber: true })}
                  required
                  error={form.formState.errors.rateOfInterest?.message}
                  helperText={
                    selectedProduct
                      ? `Default from product: ${selectedProduct.rateOfInterest}%`
                      : 'Annual interest rate percentage'
                  }
                />

                <Input
                  label="Posting Date"
                  type="date"
                  {...form.register('postingDate')}
                  required
                  error={form.formState.errors.postingDate?.message}
                  helperText="The date when the loan is posted in the system"
                />
              </div>
            </div>
          </Card>

          {/* Loan Type Configuration */}
          <Card>
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Loan Type Configuration</h2>
                  <p className="text-sm text-gray-600">Configure loan type and security options</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="isTermLoan"
                    {...form.register('isTermLoan')}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="isTermLoan" className="block font-medium text-gray-900 cursor-pointer">
                      Term Loan
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      A term loan has a fixed repayment schedule over a specific period. This is typically used for
                      structured repayment plans.
                    </p>
                    {form.watch('isTermLoan') && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Term loan features will be enabled</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    id="isSecuredLoan"
                    {...form.register('isSecuredLoan')}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="isSecuredLoan" className="block font-medium text-gray-900 cursor-pointer">
                      Secured Loan
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      A secured loan requires collateral or security. The loan amount is typically limited by the value
                      of the security provided.
                    </p>
                    {form.watch('isSecuredLoan') && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Security management features will be enabled</span>
                      </div>
                    )}
                  </div>
                </div>

                {(form.watch('isTermLoan') || form.watch('isSecuredLoan')) && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Loan Type Summary:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          {form.watch('isTermLoan') && (
                            <li>Term loan with structured repayment schedule</li>
                          )}
                          {form.watch('isSecuredLoan') && (
                            <li>Secured loan requiring collateral management</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
            <Link href="/loans">
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={createLoan.isPending}
              disabled={createLoan.isPending}
              className="w-full sm:w-auto min-w-[160px] shadow-lg hover:shadow-xl transition-shadow"
            >
              {createLoan.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Loan
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
