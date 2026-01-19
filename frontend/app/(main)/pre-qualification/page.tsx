'use client';

import { useState } from 'react';
import { usePreQualificationCheck } from '@/lib/hooks/usePreQualification';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Alert } from '@/components/ui/Alert';
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Percent, 
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PreQualificationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    requestedAmount: '',
    annualIncome: '',
    employmentStatus: '',
    creditScore: '',
    isAnonymous: false,
  });

  const checkPreQual = usePreQualificationCheck();
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      requestedAmount: parseFloat(formData.requestedAmount),
      annualIncome: formData.annualIncome ? parseFloat(formData.annualIncome) : undefined,
      employmentStatus: formData.employmentStatus || undefined,
      creditScore: formData.creditScore ? parseInt(formData.creditScore) : undefined,
      email: formData.email || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      isAnonymous: formData.isAnonymous,
    };

    try {
      const response = await checkPreQual.mutateAsync(data);
      setResult(response);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleContinueToApplication = () => {
    if (result?.token) {
      // Store token in localStorage to use when creating application
      localStorage.setItem('pre-qual-token', result.token);
      router.push('/loan-applications/new');
    }
  };

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: 'Pre-Qualification' }]} />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight mb-2">
            Pre-Qualification Check
          </h1>
          <p className="text-base text-gray-600">
            Get an instant estimate of your loan eligibility without affecting your credit score
          </p>
        </div>

        {!result ? (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {/* Anonymous Option */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isAnonymous" className="text-sm text-gray-700 cursor-pointer">
                  Check anonymously (no email or phone required)
                </label>
              </div>

              {/* Contact Info (optional if anonymous) */}
              {!formData.isAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address (Optional)
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (Optional)
                    </label>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              )}

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Loan Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    value={formData.requestedAmount}
                    onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                    placeholder="50,000"
                    className="pl-10"
                    required
                    min="1000"
                  />
                </div>
              </div>

              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income (Optional)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      value={formData.annualIncome}
                      onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                      placeholder="75,000"
                      className="pl-10"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">More accurate results with income info</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Status (Optional)
                  </label>
                  <Select
                    value={formData.employmentStatus}
                    onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                    options={[
                      { value: '', label: 'Select status' },
                      { value: 'Employed Full-Time', label: 'Employed Full-Time' },
                      { value: 'Employed Part-Time', label: 'Employed Part-Time' },
                      { value: 'Self-Employed', label: 'Self-Employed' },
                      { value: 'Business Owner', label: 'Business Owner' },
                      { value: 'Retired', label: 'Retired' },
                      { value: 'Student', label: 'Student' },
                      { value: 'Unemployed', label: 'Unemployed' },
                    ]}
                  />
                </div>
              </div>

              {/* Credit Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Score (Optional)
                </label>
                <Input
                  type="number"
                  value={formData.creditScore}
                  onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                  placeholder="750"
                  min="300"
                  max="850"
                />
                <p className="text-xs text-gray-500 mt-1">This is a soft check and won't affect your credit</p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={checkPreQual.isPending || !formData.requestedAmount}
              >
                {checkPreQual.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking Eligibility...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Check My Eligibility
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-500">
                By checking eligibility, you agree to our terms and conditions. This is a soft credit check and will not affect your credit score.
              </p>
            </form>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Result Card */}
            <Card className={`border-2 ${result.isQualified ? 'border-green-500' : 'border-orange-500'}`}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  {result.isQualified ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <XCircle className="w-8 h-8 text-orange-600" />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {result.isQualified ? 'Pre-Qualified!' : 'Not Pre-Qualified'}
                    </h2>
                    <p className="text-sm text-gray-600">{result.reason}</p>
                  </div>
                </div>

                {result.isQualified && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        Estimated Amount
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${result.estimatedApprovedAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Percent className="w-4 h-4" />
                        Interest Rate
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.estimatedInterestRate}% APR
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        Loan Term
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {result.estimatedTerm} months
                      </p>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Qualification Score</span>
                    <span className="text-sm font-bold text-gray-900">{result.qualificationScore}/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.qualificationScore >= 80
                          ? 'bg-green-500'
                          : result.qualificationScore >= 60
                          ? 'bg-yellow-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${result.qualificationScore}%` }}
                    />
                  </div>
                </div>

                <Alert variant={result.isQualified ? 'success' : 'warning'} className="mb-4">
                  <p className="text-sm">{result.nextSteps}</p>
                </Alert>

                {result.isQualified && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleContinueToApplication}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    >
                      Continue to Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setResult(null);
                        setFormData({
                          email: '',
                          phoneNumber: '',
                          requestedAmount: '',
                          annualIncome: '',
                          employmentStatus: '',
                          creditScore: '',
                          isAnonymous: false,
                        });
                      }}
                    >
                      Check Again
                    </Button>
                  </div>
                )}

                {!result.isQualified && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                    }}
                    className="w-full"
                  >
                    Try Different Amount
                  </Button>
                )}
              </div>
            </Card>

            {/* Additional Info */}
            <Card>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">What's Next?</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>This offer is valid until {new Date(result.expiryDate).toLocaleDateString()}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>No credit impact - this was a soft check</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <DollarSign className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Final approval and terms subject to full application review</span>
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

