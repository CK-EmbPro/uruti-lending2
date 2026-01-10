'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  useActivePayoffQuote,
  usePayoffQuotesForLoan,
  useGeneratePayoffQuote,
  useProcessPayoff,
} from '@/lib/hooks/useAccountManagement';
import { useLatestCalculation, useRebateFormula } from '@/lib/hooks/useEarlySettlement';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface PayoffQuoteSectionProps {
  loanId: string;
}

export function PayoffQuoteSection({ loanId }: PayoffQuoteSectionProps) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPayoffModal, setShowPayoffModal] = useState(false);
  const [payoffDate, setPayoffDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentAmount, setPaymentAmount] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('Wire Transfer');

  const { data: activeQuote, isLoading: isLoadingActive } = useActivePayoffQuote(loanId);
  const { data: allQuotes, isLoading: isLoadingAll } = usePayoffQuotesForLoan(loanId);
  const { data: latestCalculation } = useLatestCalculation(loanId);
  const { data: rebateFormula } = useRebateFormula();
  const generateQuote = useGeneratePayoffQuote();
  const processPayoff = useProcessPayoff();

  const handleGenerateQuote = async () => {
    try {
      await generateQuote.mutateAsync({
        loanId,
        payoffDate,
      });
      setShowGenerateModal(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleProcessPayoff = async () => {
    if (!activeQuote || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await processPayoff.mutateAsync({
        quoteId: activeQuote.id,
        paymentAmount: parseFloat(paymentAmount),
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        modeOfPayment,
      });
      setShowPayoffModal(false);
      setPaymentAmount('');
    } catch (error) {
      // Error handled by hook
    }
  };

  const isQuoteExpired = activeQuote && new Date(activeQuote.validUntil) < new Date();
  const isQuoteValid = activeQuote && activeQuote.status === 'Active' && !isQuoteExpired;

  if (isLoadingActive || isLoadingAll) {
    return (
      <Card title="Payoff Quote">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card title="Payoff Quote">
      <div className="space-y-4">
        {/* Active Quote */}
        {activeQuote && isQuoteValid ? (
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-primary" />
                <div className="font-semibold text-gray-900">Active Payoff Quote</div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Principal Balance</span>
                <span className="text-sm font-medium">
                  ${activeQuote.principalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Accrued Interest</span>
                <span className="text-sm font-medium">
                  ${activeQuote.accruedInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {latestCalculation && latestCalculation.interestRebate > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Interest Rebate</span>
                  <span className="text-sm font-medium text-green-600">
                    -${latestCalculation.interestRebate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {activeQuote.prepaymentPenalty > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Prepayment Penalty</span>
                  <span className="text-sm font-medium text-red-600">
                    ${activeQuote.prepaymentPenalty.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {activeQuote.otherFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Other Fees</span>
                  <span className="text-sm font-medium">
                    ${activeQuote.otherFees.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {latestCalculation && latestCalculation.savingsAmount > 0 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Total Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${latestCalculation.savingsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-green-700 mt-1">
                    Save this amount by paying off early!
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="font-semibold text-gray-900">Total Payoff Amount</span>
                <span className="text-2xl font-bold text-primary">
                  ${activeQuote.totalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {latestCalculation && latestCalculation.originalPayoffAmount > activeQuote.totalPayoffAmount && (
                <div className="text-xs text-gray-500 mt-1 text-right">
                  Original: ${latestCalculation.originalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}(Saved: ${(latestCalculation.originalPayoffAmount - activeQuote.totalPayoffAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 mb-4">
              <div>Quote Date: {format(new Date(activeQuote.quoteDate), 'MMM dd, yyyy')}</div>
              <div>Valid Until: {format(new Date(activeQuote.validUntil), 'MMM dd, yyyy')}</div>
              {activeQuote.perDiemInterest > 0 && (
                <div>Per-Diem Interest: ${activeQuote.perDiemInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day</div>
              )}
            </div>

            <Button onClick={() => setShowPayoffModal(true)} className="w-full">
              <ArrowRight className="w-4 h-4 mr-2" />
              Process Payoff
            </Button>
          </div>
        ) : activeQuote && isQuoteExpired ? (
          <Alert variant="warning" title="Quote Expired">
            This payoff quote has expired. Please generate a new quote.
          </Alert>
        ) : (
          <Alert variant="info" title="No Active Quote">
            Generate a payoff quote to see the exact amount needed to pay off your loan.
          </Alert>
        )}

        {/* Generate Quote Button */}
        {!isQuoteValid && (
          <Button
            variant="outline"
            onClick={() => setShowGenerateModal(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Generate Payoff Quote
          </Button>
        )}

        {/* Quote History */}
        {allQuotes && allQuotes.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900">Quote History</div>
            {allQuotes.slice(0, 3).map((quote) => (
              <div
                key={quote.id}
                className="p-2 rounded border border-gray-200 bg-white text-xs"
              >
                <div className="flex justify-between">
                  <span>{format(new Date(quote.quoteDate), 'MMM dd, yyyy')}</span>
                  <span className="font-medium">
                    ${quote.totalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-gray-500 mt-1">
                  Valid until: {format(new Date(quote.validUntil), 'MMM dd, yyyy')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate Quote Modal */}
        <Modal
          isOpen={showGenerateModal}
          onClose={() => {
            setShowGenerateModal(false);
            setPayoffDate(format(new Date(), 'yyyy-MM-dd'));
          }}
          title="Generate Payoff Quote"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateModal(false);
                  setPayoffDate(format(new Date(), 'yyyy-MM-dd'));
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleGenerateQuote} disabled={generateQuote.isPending}>
                {generateQuote.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Quote
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Alert variant="info">
              A payoff quote will show the exact amount needed to pay off your loan, including principal, accrued interest, and any applicable fees.
            </Alert>

            <Input
              label="Payoff Date"
              type="date"
              value={payoffDate}
              onChange={(e) => setPayoffDate(e.target.value)}
              required
            />

            <div className="text-sm text-gray-600">
              The quote will be valid for 30 days from the generation date.
            </div>
          </div>
        </Modal>

        {/* Process Payoff Modal */}
        <Modal
          isOpen={showPayoffModal}
          onClose={() => {
            setShowPayoffModal(false);
            setPaymentAmount('');
          }}
          title="Process Payoff"
          size="md"
          footer={
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPayoffModal(false);
                  setPaymentAmount('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProcessPayoff}
                disabled={
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  processPayoff.isPending
                }
              >
                {processPayoff.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Process Payoff
                  </>
                )}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {activeQuote && (
              <>
                <Alert variant="info">
                  Ensure the payment amount matches the quote amount exactly.
                </Alert>

                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">Quote Amount</div>
                  <div className="text-2xl font-bold">
                    ${activeQuote.totalPayoffAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <Input
                  label="Payment Amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={activeQuote.totalPayoffAmount.toString()}
                  required
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mode of Payment
                  </label>
                  <select
                    value={modeOfPayment}
                    onChange={(e) => setModeOfPayment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="ACH">ACH</option>
                    <option value="Check">Check</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </Card>
  );
}

