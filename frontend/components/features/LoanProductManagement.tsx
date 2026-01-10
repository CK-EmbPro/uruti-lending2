'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import {
  useLoanProducts,
  useCreateLoanProduct,
  useUpdateLoanProduct,
  useDeleteLoanProduct,
} from '@/lib/hooks/useLoanProduct';
import { useAccounts } from '@/lib/hooks/useAccounting';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Settings,
  Eye,
  X,
  CheckCircle,
  Users,
  TrendingUp,
  Clock,
  Tag,
  Image as ImageIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import type { LoanProduct, CreateLoanProductDto, UpdateLoanProductDto } from '@/lib/api/loan-products';
import toast from 'react-hot-toast';

export function LoanProductManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [companyId] = useState('default-company-id'); // TODO: Get from context
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [rateOfInterest, setRateOfInterest] = useState('');
  const [penaltyInterestRate, setPenaltyInterestRate] = useState('');
  const [maximumLoanAmount, setMaximumLoanAmount] = useState('');
  const [isTermLoan, setIsTermLoan] = useState(false);
  const [repaymentScheduleType, setRepaymentScheduleType] = useState('');
  const [cyclicDayOfTheMonth, setCyclicDayOfTheMonth] = useState('');
  const [minDaysBwDisbursementFirstRepayment, setMinDaysBwDisbursementFirstRepayment] = useState('30');
  const [daysPastDueThresholdForNpa, setDaysPastDueThresholdForNpa] = useState('90');
  const [gracePeriodInDays, setGracePeriodInDays] = useState('0');
  const [bpiRecoveryMethod, setBpiRecoveryMethod] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [disabled, setDisabled] = useState(false);

  // Eligibility Criteria
  const [minimumLoanAmount, setMinimumLoanAmount] = useState('');
  const [minimumTerm, setMinimumTerm] = useState('');
  const [maximumTerm, setMaximumTerm] = useState('');
  const [minimumAge, setMinimumAge] = useState('');
  const [maximumAge, setMaximumAge] = useState('');
  const [minimumMonthlyIncome, setMinimumMonthlyIncome] = useState('');
  const [minimumAnnualIncome, setMinimumAnnualIncome] = useState('');
  const [minimumCreditScore, setMinimumCreditScore] = useState('');
  const [maximumDebtToIncomeRatio, setMaximumDebtToIncomeRatio] = useState('');
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [eligibleCountries, setEligibleCountries] = useState<string[]>([]);
  const [eligibleRegions, setEligibleRegions] = useState<string[]>([]);
  const [requiresCollateral, setRequiresCollateral] = useState(false);
  const [collateralRequirements, setCollateralRequirements] = useState('');

  // Marketing & Audience-Facing Content
  const [productTagline, setProductTagline] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [productHighlights, setProductHighlights] = useState<string[]>([]);
  const [keyFeatures, setKeyFeatures] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [howItWorks, setHowItWorks] = useState('');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [promotionalBannerUrl, setPromotionalBannerUrl] = useState('');
  const [productIconUrl, setProductIconUrl] = useState('');

  // Product Options
  const [allowsPrepayment, setAllowsPrepayment] = useState(true);
  const [allowsPartialPrepayment, setAllowsPartialPrepayment] = useState(false);
  const [allowsRefinancing, setAllowsRefinancing] = useState(false);
  const [allowsTopUp, setAllowsTopUp] = useState(false);
  const [prepaymentCharges, setPrepaymentCharges] = useState('');

  // Processing
  const [averageProcessingTime, setAverageProcessingTime] = useState('');
  const [averageDisbursementTime, setAverageDisbursementTime] = useState('');
  const [processingTimeDescription, setProcessingTimeDescription] = useState('');

  // Classification
  const [loanCategory, setLoanCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [useCases, setUseCases] = useState<string[]>([]);
  const [competitiveAdvantages, setCompetitiveAdvantages] = useState<string[]>([]);
  const [comparisonNotes, setComparisonNotes] = useState('');
  const [applicationRequirements, setApplicationRequirements] = useState('');
  const [minimumEmploymentDuration, setMinimumEmploymentDuration] = useState('');
  const [requiresCoApplicant, setRequiresCoApplicant] = useState(false);
  const [requiresGuarantor, setRequiresGuarantor] = useState(false);

  // Accounting accounts
  const [disbursementAccount, setDisbursementAccount] = useState('BANK-DISBURSEMENT');
  const [paymentAccount, setPaymentAccount] = useState('BANK-PAYMENT');
  const [loanAccount, setLoanAccount] = useState('LOAN-ACCOUNT');
  const [interestIncomeAccount, setInterestIncomeAccount] = useState('INTEREST-INCOME');
  const [penaltyIncomeAccount, setPenaltyIncomeAccount] = useState('PENALTY-INCOME');
  const [interestAccruedAccount, setInterestAccruedAccount] = useState('INTEREST-ACCRUED');
  const [interestReceivableAccount, setInterestReceivableAccount] = useState('INTEREST-RECEIVABLE');
  const [penaltyAccruedAccount, setPenaltyAccruedAccount] = useState('PENALTY-ACCRUED');
  const [penaltyReceivableAccount, setPenaltyReceivableAccount] = useState('PENALTY-RECEIVABLE');
  const [securityDepositAccount, setSecurityDepositAccount] = useState('SECURITY-DEPOSIT');
  const [customerRefundAccount, setCustomerRefundAccount] = useState('CUSTOMER-REFUND');
  const [writeOffAccount, setWriteOffAccount] = useState('WRITE-OFF-EXPENSE');
  const [writeOffRecoveryAccount, setWriteOffRecoveryAccount] = useState('WRITE-OFF-RECOVERY');
  const [interestWaiverAccount, setInterestWaiverAccount] = useState('INTEREST-WAIVER');
  const [penaltyWaiverAccount, setPenaltyWaiverAccount] = useState('PENALTY-WAIVER');

  const { data: products, isLoading, refetch } = useLoanProducts(companyId);
  const { data: accounts } = useAccounts({ companyId, isActive: true });
  const createProduct = useCreateLoanProduct();
  const updateProduct = useUpdateLoanProduct();
  const deleteProduct = useDeleteLoanProduct();

  const accountOptions = accounts?.map((acc) => ({
    value: acc.accountCode,
    label: `${acc.accountCode} - ${acc.accountName}`,
  })) || [];

  const resetForm = () => {
    setProductCode('');
    setProductName('');
    setRateOfInterest('');
    setPenaltyInterestRate('');
    setMaximumLoanAmount('');
    setIsTermLoan(false);
    setRepaymentScheduleType('');
    setCyclicDayOfTheMonth('');
    setMinDaysBwDisbursementFirstRepayment('30');
    setDaysPastDueThresholdForNpa('90');
    setGracePeriodInDays('0');
    setBpiRecoveryMethod('');
    setProductDescription('');
    setTermsAndConditions('');
    setDisabled(false);
    // Reset accounts to defaults
    setDisbursementAccount('BANK-DISBURSEMENT');
    setPaymentAccount('BANK-PAYMENT');
    setLoanAccount('LOAN-ACCOUNT');
    setInterestIncomeAccount('INTEREST-INCOME');
    setPenaltyIncomeAccount('PENALTY-INCOME');
    setInterestAccruedAccount('INTEREST-ACCRUED');
    setInterestReceivableAccount('INTEREST-RECEIVABLE');
    setPenaltyAccruedAccount('PENALTY-ACCRUED');
    setPenaltyReceivableAccount('PENALTY-RECEIVABLE');
    setSecurityDepositAccount('SECURITY-DEPOSIT');
    setCustomerRefundAccount('CUSTOMER-REFUND');
    setWriteOffAccount('WRITE-OFF-EXPENSE');
    setWriteOffRecoveryAccount('WRITE-OFF-RECOVERY');
    setInterestWaiverAccount('INTEREST-WAIVER');
    setPenaltyWaiverAccount('PENALTY-WAIVER');
    // Reset eligibility
    setMinimumLoanAmount('');
    setMinimumTerm('');
    setMaximumTerm('');
    setMinimumAge('');
    setMaximumAge('');
    setMinimumMonthlyIncome('');
    setMinimumAnnualIncome('');
    setMinimumCreditScore('');
    setMaximumDebtToIncomeRatio('');
    setEmploymentTypes([]);
    setRequiredDocuments([]);
    setEligibleCountries([]);
    setEligibleRegions([]);
    setRequiresCollateral(false);
    setCollateralRequirements('');
    // Reset marketing
    setProductTagline('');
    setShortDescription('');
    setProductHighlights([]);
    setKeyFeatures([]);
    setBenefits([]);
    setTargetAudience('');
    setHowItWorks('');
    setFaqs([]);
    setProductImages([]);
    setPromotionalBannerUrl('');
    setProductIconUrl('');
    // Reset product options
    setAllowsPrepayment(true);
    setAllowsPartialPrepayment(false);
    setAllowsRefinancing(false);
    setAllowsTopUp(false);
    setPrepaymentCharges('');
    // Reset processing
    setAverageProcessingTime('');
    setAverageDisbursementTime('');
    setProcessingTimeDescription('');
    // Reset classification
    setLoanCategory('');
    setProductType('');
    setUseCases([]);
    setCompetitiveAdvantages([]);
    setComparisonNotes('');
    setApplicationRequirements('');
    setMinimumEmploymentDuration('');
    setRequiresCoApplicant(false);
    setRequiresGuarantor(false);
  };

  const handleCreate = () => {
    const dto: CreateLoanProductDto = {
      productCode,
      productName,
      companyId,
      rateOfInterest: parseFloat(rateOfInterest),
      penaltyInterestRate: penaltyInterestRate ? parseFloat(penaltyInterestRate) : 0,
      maximumLoanAmount: maximumLoanAmount ? parseFloat(maximumLoanAmount) : undefined,
      isTermLoan,
      repaymentScheduleType: repaymentScheduleType || undefined,
      cyclicDayOfTheMonth: cyclicDayOfTheMonth ? parseInt(cyclicDayOfTheMonth) : undefined,
      minDaysBwDisbursementFirstRepayment: parseInt(minDaysBwDisbursementFirstRepayment) || 30,
      daysPastDueThresholdForNpa: daysPastDueThresholdForNpa ? parseInt(daysPastDueThresholdForNpa) : undefined,
      gracePeriodInDays: parseInt(gracePeriodInDays) || 0,
      bpiRecoveryMethod: bpiRecoveryMethod || undefined,
      productDescription: productDescription || undefined,
      termsAndConditions: termsAndConditions || undefined,
      disbursementAccount,
      paymentAccount,
      loanAccount,
      interestIncomeAccount,
      penaltyIncomeAccount,
      interestAccruedAccount,
      interestReceivableAccount,
      penaltyAccruedAccount,
      penaltyReceivableAccount,
      securityDepositAccount,
      customerRefundAccount,
      writeOffAccount,
      writeOffRecoveryAccount,
      interestWaiverAccount,
      penaltyWaiverAccount,
      // Eligibility
      minimumLoanAmount: minimumLoanAmount ? parseFloat(minimumLoanAmount) : undefined,
      minimumTerm: minimumTerm ? parseInt(minimumTerm) : undefined,
      maximumTerm: maximumTerm ? parseInt(maximumTerm) : undefined,
      minimumAge: minimumAge ? parseInt(minimumAge) : undefined,
      maximumAge: maximumAge ? parseInt(maximumAge) : undefined,
      minimumMonthlyIncome: minimumMonthlyIncome ? parseFloat(minimumMonthlyIncome) : undefined,
      minimumAnnualIncome: minimumAnnualIncome ? parseFloat(minimumAnnualIncome) : undefined,
      minimumCreditScore: minimumCreditScore ? parseInt(minimumCreditScore) : undefined,
      maximumDebtToIncomeRatio: maximumDebtToIncomeRatio ? parseFloat(maximumDebtToIncomeRatio) : undefined,
      employmentTypes: employmentTypes.length > 0 ? employmentTypes : undefined,
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : undefined,
      eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : undefined,
      eligibleRegions: eligibleRegions.length > 0 ? eligibleRegions : undefined,
      requiresCollateral,
      collateralRequirements: collateralRequirements || undefined,
      // Marketing
      productTagline: productTagline || undefined,
      shortDescription: shortDescription || undefined,
      productHighlights: productHighlights.length > 0 ? productHighlights : undefined,
      keyFeatures: keyFeatures.length > 0 ? keyFeatures : undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      targetAudience: targetAudience || undefined,
      howItWorks: howItWorks || undefined,
      faqs: faqs.length > 0 ? faqs : undefined,
      productImages: productImages.length > 0 ? productImages : undefined,
      promotionalBannerUrl: promotionalBannerUrl || undefined,
      productIconUrl: productIconUrl || undefined,
      // Product Options
      allowsPrepayment,
      allowsPartialPrepayment,
      allowsRefinancing,
      allowsTopUp,
      prepaymentCharges: prepaymentCharges ? parseFloat(prepaymentCharges) : undefined,
      // Processing
      averageProcessingTime: averageProcessingTime ? parseInt(averageProcessingTime) : undefined,
      averageDisbursementTime: averageDisbursementTime ? parseInt(averageDisbursementTime) : undefined,
      processingTimeDescription: processingTimeDescription || undefined,
      // Classification
      loanCategory: loanCategory || undefined,
      productType: productType || undefined,
      useCases: useCases.length > 0 ? useCases : undefined,
      competitiveAdvantages: competitiveAdvantages.length > 0 ? competitiveAdvantages : undefined,
      comparisonNotes: comparisonNotes || undefined,
      applicationRequirements: applicationRequirements || undefined,
      minimumEmploymentDuration: minimumEmploymentDuration ? parseInt(minimumEmploymentDuration) : undefined,
      requiresCoApplicant,
      requiresGuarantor,
    };

    createProduct.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    });
  };

  const handleEdit = (product: LoanProduct) => {
    setSelectedProduct(product);
    setProductCode(product.productCode);
    setProductName(product.productName);
    setRateOfInterest(product.rateOfInterest.toString());
    setPenaltyInterestRate(product.penaltyInterestRate?.toString() || '');
    setMaximumLoanAmount(product.maximumLoanAmount?.toString() || '');
    setIsTermLoan(product.isTermLoan);
    setRepaymentScheduleType(product.repaymentScheduleType || '');
    setCyclicDayOfTheMonth(product.cyclicDayOfTheMonth?.toString() || '');
    setMinDaysBwDisbursementFirstRepayment(product.minDaysBwDisbursementFirstRepayment?.toString() || '30');
    setDaysPastDueThresholdForNpa(product.daysPastDueThresholdForNpa?.toString() || '');
    setGracePeriodInDays(product.gracePeriodInDays?.toString() || '0');
    setBpiRecoveryMethod(product.bpiRecoveryMethod || '');
    setProductDescription(product.productDescription || '');
    setTermsAndConditions(product.termsAndConditions || '');
    setDisabled(product.disabled);
    setDisbursementAccount(product.disbursementAccount);
    setPaymentAccount(product.paymentAccount);
    setLoanAccount(product.loanAccount);
    setInterestIncomeAccount(product.interestIncomeAccount);
    setPenaltyIncomeAccount(product.penaltyIncomeAccount);
    setInterestAccruedAccount(product.interestAccruedAccount);
    setInterestReceivableAccount(product.interestReceivableAccount);
    setPenaltyAccruedAccount(product.penaltyAccruedAccount);
    setPenaltyReceivableAccount(product.penaltyReceivableAccount);
    setSecurityDepositAccount(product.securityDepositAccount);
    setCustomerRefundAccount(product.customerRefundAccount);
    setWriteOffAccount(product.writeOffAccount);
    setWriteOffRecoveryAccount(product.writeOffRecoveryAccount);
    setInterestWaiverAccount(product.interestWaiverAccount);
    setPenaltyWaiverAccount(product.penaltyWaiverAccount);
    // Set eligibility
    setMinimumLoanAmount(product.minimumLoanAmount?.toString() || '');
    setMinimumTerm(product.minimumTerm?.toString() || '');
    setMaximumTerm(product.maximumTerm?.toString() || '');
    setMinimumAge(product.minimumAge?.toString() || '');
    setMaximumAge(product.maximumAge?.toString() || '');
    setMinimumMonthlyIncome(product.minimumMonthlyIncome?.toString() || '');
    setMinimumAnnualIncome(product.minimumAnnualIncome?.toString() || '');
    setMinimumCreditScore(product.minimumCreditScore?.toString() || '');
    setMaximumDebtToIncomeRatio(product.maximumDebtToIncomeRatio?.toString() || '');
    setEmploymentTypes(product.employmentTypes || []);
    setRequiredDocuments(product.requiredDocuments || []);
    setEligibleCountries(product.eligibleCountries || []);
    setEligibleRegions(product.eligibleRegions || []);
    setRequiresCollateral(product.requiresCollateral || false);
    setCollateralRequirements(product.collateralRequirements || '');
    // Set marketing
    setProductTagline(product.productTagline || '');
    setShortDescription(product.shortDescription || '');
    setProductHighlights(product.productHighlights || []);
    setKeyFeatures(product.keyFeatures || []);
    setBenefits(product.benefits || []);
    setTargetAudience(product.targetAudience || '');
    setHowItWorks(product.howItWorks || '');
    setFaqs(product.faqs || []);
    setProductImages(product.productImages || []);
    setPromotionalBannerUrl(product.promotionalBannerUrl || '');
    setProductIconUrl(product.productIconUrl || '');
    // Set product options
    setAllowsPrepayment(product.allowsPrepayment ?? true);
    setAllowsPartialPrepayment(product.allowsPartialPrepayment || false);
    setAllowsRefinancing(product.allowsRefinancing || false);
    setAllowsTopUp(product.allowsTopUp || false);
    setPrepaymentCharges(product.prepaymentCharges?.toString() || '');
    // Set processing
    setAverageProcessingTime(product.averageProcessingTime?.toString() || '');
    setAverageDisbursementTime(product.averageDisbursementTime?.toString() || '');
    setProcessingTimeDescription(product.processingTimeDescription || '');
    // Set classification
    setLoanCategory(product.loanCategory || '');
    setProductType(product.productType || '');
    setUseCases(product.useCases || []);
    setCompetitiveAdvantages(product.competitiveAdvantages || []);
    setComparisonNotes(product.comparisonNotes || '');
    setApplicationRequirements(product.applicationRequirements || '');
    setMinimumEmploymentDuration(product.minimumEmploymentDuration?.toString() || '');
    setRequiresCoApplicant(product.requiresCoApplicant || false);
    setRequiresGuarantor(product.requiresGuarantor || false);
    setShowEditModal(true);
  };

  const handleUpdate = () => {
    if (!selectedProduct) return;

    const dto: UpdateLoanProductDto = {
      productName,
      rateOfInterest: parseFloat(rateOfInterest),
      penaltyInterestRate: penaltyInterestRate ? parseFloat(penaltyInterestRate) : undefined,
      maximumLoanAmount: maximumLoanAmount ? parseFloat(maximumLoanAmount) : undefined,
      isTermLoan,
      repaymentScheduleType: repaymentScheduleType || undefined,
      cyclicDayOfTheMonth: cyclicDayOfTheMonth ? parseInt(cyclicDayOfTheMonth) : undefined,
      minDaysBwDisbursementFirstRepayment: parseInt(minDaysBwDisbursementFirstRepayment) || 30,
      daysPastDueThresholdForNpa: daysPastDueThresholdForNpa ? parseInt(daysPastDueThresholdForNpa) : undefined,
      gracePeriodInDays: parseInt(gracePeriodInDays) || 0,
      bpiRecoveryMethod: bpiRecoveryMethod || undefined,
      productDescription: productDescription || undefined,
      termsAndConditions: termsAndConditions || undefined,
      disabled,
      disbursementAccount,
      paymentAccount,
      loanAccount,
      interestIncomeAccount,
      penaltyIncomeAccount,
      interestAccruedAccount,
      interestReceivableAccount,
      penaltyAccruedAccount,
      penaltyReceivableAccount,
      securityDepositAccount,
      customerRefundAccount,
      writeOffAccount,
      writeOffRecoveryAccount,
      interestWaiverAccount,
      penaltyWaiverAccount,
      // Eligibility
      minimumLoanAmount: minimumLoanAmount ? parseFloat(minimumLoanAmount) : undefined,
      minimumTerm: minimumTerm ? parseInt(minimumTerm) : undefined,
      maximumTerm: maximumTerm ? parseInt(maximumTerm) : undefined,
      minimumAge: minimumAge ? parseInt(minimumAge) : undefined,
      maximumAge: maximumAge ? parseInt(maximumAge) : undefined,
      minimumMonthlyIncome: minimumMonthlyIncome ? parseFloat(minimumMonthlyIncome) : undefined,
      minimumAnnualIncome: minimumAnnualIncome ? parseFloat(minimumAnnualIncome) : undefined,
      minimumCreditScore: minimumCreditScore ? parseInt(minimumCreditScore) : undefined,
      maximumDebtToIncomeRatio: maximumDebtToIncomeRatio ? parseFloat(maximumDebtToIncomeRatio) : undefined,
      employmentTypes: employmentTypes.length > 0 ? employmentTypes : undefined,
      requiredDocuments: requiredDocuments.length > 0 ? requiredDocuments : undefined,
      eligibleCountries: eligibleCountries.length > 0 ? eligibleCountries : undefined,
      eligibleRegions: eligibleRegions.length > 0 ? eligibleRegions : undefined,
      requiresCollateral,
      collateralRequirements: collateralRequirements || undefined,
      // Marketing
      productTagline: productTagline || undefined,
      shortDescription: shortDescription || undefined,
      productHighlights: productHighlights.length > 0 ? productHighlights : undefined,
      keyFeatures: keyFeatures.length > 0 ? keyFeatures : undefined,
      benefits: benefits.length > 0 ? benefits : undefined,
      targetAudience: targetAudience || undefined,
      howItWorks: howItWorks || undefined,
      faqs: faqs.length > 0 ? faqs : undefined,
      productImages: productImages.length > 0 ? productImages : undefined,
      promotionalBannerUrl: promotionalBannerUrl || undefined,
      productIconUrl: productIconUrl || undefined,
      // Product Options
      allowsPrepayment,
      allowsPartialPrepayment,
      allowsRefinancing,
      allowsTopUp,
      prepaymentCharges: prepaymentCharges ? parseFloat(prepaymentCharges) : undefined,
      // Processing
      averageProcessingTime: averageProcessingTime ? parseInt(averageProcessingTime) : undefined,
      averageDisbursementTime: averageDisbursementTime ? parseInt(averageDisbursementTime) : undefined,
      processingTimeDescription: processingTimeDescription || undefined,
      // Classification
      loanCategory: loanCategory || undefined,
      productType: productType || undefined,
      useCases: useCases.length > 0 ? useCases : undefined,
      competitiveAdvantages: competitiveAdvantages.length > 0 ? competitiveAdvantages : undefined,
      comparisonNotes: comparisonNotes || undefined,
      applicationRequirements: applicationRequirements || undefined,
      minimumEmploymentDuration: minimumEmploymentDuration ? parseInt(minimumEmploymentDuration) : undefined,
      requiresCoApplicant,
      requiresGuarantor,
    };

    updateProduct.mutate(
      { id: selectedProduct.id, data: dto },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setSelectedProduct(null);
          resetForm();
          refetch();
        },
      },
    );
  };

  const handleDelete = () => {
    if (!selectedProduct) return;

    deleteProduct.mutate(selectedProduct.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setSelectedProduct(null);
        refetch();
      },
    });
  };

  const handleView = (product: LoanProduct) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const filteredProducts = products?.filter(
    (product) =>
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()),
  ) || [];

  const activeCount = products?.filter((p) => !p.disabled).length || 0;
  const disabledCount = products?.filter((p) => p.disabled).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Loan Products</h2>
          <p className="text-sm text-gray-600 mt-1">Manage loan product configurations, terms, and accounting accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{products?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disabled Products</p>
                <p className="text-2xl font-bold text-red-600">{disabledCount}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No loan products found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first loan product'}
            </p>
            {!searchTerm && (
              <Button onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Product
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{product.productName}</h3>
                      <Badge variant={product.disabled ? 'destructive' : 'default'}>
                        {product.disabled ? 'Disabled' : 'Active'}
                      </Badge>
                      {product.isTermLoan && (
                        <Badge variant="outline">Term Loan</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Code: {product.productCode}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Interest Rate</p>
                        <p className="font-semibold text-gray-900">{product.rateOfInterest}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Penalty Rate</p>
                        <p className="font-semibold text-gray-900">{product.penaltyInterestRate || 0}%</p>
                      </div>
                      {product.maximumLoanAmount && (
                        <div>
                          <p className="text-gray-500">Max Amount</p>
                          <p className="font-semibold text-gray-900">
                            ${product.maximumLoanAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Grace Period</p>
                        <p className="font-semibold text-gray-900">{product.gracePeriodInDays} days</p>
                      </div>
                    </div>
                    {product.productDescription && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{product.productDescription}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleView(product)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Loan Product"
        size="xl"
      >
        <LoanProductForm
          productCode={productCode}
          setProductCode={setProductCode}
          productName={productName}
          setProductName={setProductName}
          rateOfInterest={rateOfInterest}
          setRateOfInterest={setRateOfInterest}
          penaltyInterestRate={penaltyInterestRate}
          setPenaltyInterestRate={setPenaltyInterestRate}
          maximumLoanAmount={maximumLoanAmount}
          setMaximumLoanAmount={setMaximumLoanAmount}
          isTermLoan={isTermLoan}
          setIsTermLoan={setIsTermLoan}
          repaymentScheduleType={repaymentScheduleType}
          setRepaymentScheduleType={setRepaymentScheduleType}
          cyclicDayOfTheMonth={cyclicDayOfTheMonth}
          setCyclicDayOfTheMonth={setCyclicDayOfTheMonth}
          minDaysBwDisbursementFirstRepayment={minDaysBwDisbursementFirstRepayment}
          setMinDaysBwDisbursementFirstRepayment={setMinDaysBwDisbursementFirstRepayment}
          daysPastDueThresholdForNpa={daysPastDueThresholdForNpa}
          setDaysPastDueThresholdForNpa={setDaysPastDueThresholdForNpa}
          gracePeriodInDays={gracePeriodInDays}
          setGracePeriodInDays={setGracePeriodInDays}
          bpiRecoveryMethod={bpiRecoveryMethod}
          setBpiRecoveryMethod={setBpiRecoveryMethod}
          productDescription={productDescription}
          setProductDescription={setProductDescription}
          termsAndConditions={termsAndConditions}
          setTermsAndConditions={setTermsAndConditions}
          accountOptions={accountOptions}
          disbursementAccount={disbursementAccount}
          setDisbursementAccount={setDisbursementAccount}
          paymentAccount={paymentAccount}
          setPaymentAccount={setPaymentAccount}
          loanAccount={loanAccount}
          setLoanAccount={setLoanAccount}
          interestIncomeAccount={interestIncomeAccount}
          setInterestIncomeAccount={setInterestIncomeAccount}
          penaltyIncomeAccount={penaltyIncomeAccount}
          setPenaltyIncomeAccount={setPenaltyIncomeAccount}
          interestAccruedAccount={interestAccruedAccount}
          setInterestAccruedAccount={setInterestAccruedAccount}
          interestReceivableAccount={interestReceivableAccount}
          setInterestReceivableAccount={setInterestReceivableAccount}
          penaltyAccruedAccount={penaltyAccruedAccount}
          setPenaltyAccruedAccount={setPenaltyAccruedAccount}
          penaltyReceivableAccount={penaltyReceivableAccount}
          setPenaltyReceivableAccount={setPenaltyReceivableAccount}
          securityDepositAccount={securityDepositAccount}
          setSecurityDepositAccount={setSecurityDepositAccount}
          customerRefundAccount={customerRefundAccount}
          setCustomerRefundAccount={setCustomerRefundAccount}
          writeOffAccount={writeOffAccount}
          setWriteOffAccount={setWriteOffAccount}
          writeOffRecoveryAccount={writeOffRecoveryAccount}
          setWriteOffRecoveryAccount={setWriteOffRecoveryAccount}
          interestWaiverAccount={interestWaiverAccount}
          setInterestWaiverAccount={setInterestWaiverAccount}
          penaltyWaiverAccount={penaltyWaiverAccount}
          setPenaltyWaiverAccount={setPenaltyWaiverAccount}
          // Eligibility props
          minimumLoanAmount={minimumLoanAmount}
          setMinimumLoanAmount={setMinimumLoanAmount}
          minimumTerm={minimumTerm}
          setMinimumTerm={setMinimumTerm}
          maximumTerm={maximumTerm}
          setMaximumTerm={setMaximumTerm}
          minimumAge={minimumAge}
          setMinimumAge={setMinimumAge}
          maximumAge={maximumAge}
          setMaximumAge={setMaximumAge}
          minimumMonthlyIncome={minimumMonthlyIncome}
          setMinimumMonthlyIncome={setMinimumMonthlyIncome}
          minimumAnnualIncome={minimumAnnualIncome}
          setMinimumAnnualIncome={setMinimumAnnualIncome}
          minimumCreditScore={minimumCreditScore}
          setMinimumCreditScore={setMinimumCreditScore}
          maximumDebtToIncomeRatio={maximumDebtToIncomeRatio}
          setMaximumDebtToIncomeRatio={setMaximumDebtToIncomeRatio}
          employmentTypes={employmentTypes}
          setEmploymentTypes={setEmploymentTypes}
          requiredDocuments={requiredDocuments}
          setRequiredDocuments={setRequiredDocuments}
          eligibleCountries={eligibleCountries}
          setEligibleCountries={setEligibleCountries}
          eligibleRegions={eligibleRegions}
          setEligibleRegions={setEligibleRegions}
          requiresCollateral={requiresCollateral}
          setRequiresCollateral={setRequiresCollateral}
          collateralRequirements={collateralRequirements}
          setCollateralRequirements={setCollateralRequirements}
          minimumEmploymentDuration={minimumEmploymentDuration}
          setMinimumEmploymentDuration={setMinimumEmploymentDuration}
          requiresCoApplicant={requiresCoApplicant}
          setRequiresCoApplicant={setRequiresCoApplicant}
          requiresGuarantor={requiresGuarantor}
          setRequiresGuarantor={setRequiresGuarantor}
          // Marketing props
          productTagline={productTagline}
          setProductTagline={setProductTagline}
          shortDescription={shortDescription}
          setShortDescription={setShortDescription}
          productHighlights={productHighlights}
          setProductHighlights={setProductHighlights}
          keyFeatures={keyFeatures}
          setKeyFeatures={setKeyFeatures}
          benefits={benefits}
          setBenefits={setBenefits}
          targetAudience={targetAudience}
          setTargetAudience={setTargetAudience}
          howItWorks={howItWorks}
          setHowItWorks={setHowItWorks}
          faqs={faqs}
          setFaqs={setFaqs}
          productImages={productImages}
          setProductImages={setProductImages}
          promotionalBannerUrl={promotionalBannerUrl}
          setPromotionalBannerUrl={setPromotionalBannerUrl}
          productIconUrl={productIconUrl}
          setProductIconUrl={setProductIconUrl}
          // Product Options props
          allowsPrepayment={allowsPrepayment}
          setAllowsPrepayment={setAllowsPrepayment}
          allowsPartialPrepayment={allowsPartialPrepayment}
          setAllowsPartialPrepayment={setAllowsPartialPrepayment}
          allowsRefinancing={allowsRefinancing}
          setAllowsRefinancing={setAllowsRefinancing}
          allowsTopUp={allowsTopUp}
          setAllowsTopUp={setAllowsTopUp}
          prepaymentCharges={prepaymentCharges}
          setPrepaymentCharges={setPrepaymentCharges}
          // Processing props
          averageProcessingTime={averageProcessingTime}
          setAverageProcessingTime={setAverageProcessingTime}
          averageDisbursementTime={averageDisbursementTime}
          setAverageDisbursementTime={setAverageDisbursementTime}
          processingTimeDescription={processingTimeDescription}
          setProcessingTimeDescription={setProcessingTimeDescription}
          // Classification props
          loanCategory={loanCategory}
          setLoanCategory={setLoanCategory}
          productType={productType}
          setProductType={setProductType}
          useCases={useCases}
          setUseCases={setUseCases}
          competitiveAdvantages={competitiveAdvantages}
          setCompetitiveAdvantages={setCompetitiveAdvantages}
          comparisonNotes={comparisonNotes}
          setComparisonNotes={setComparisonNotes}
          applicationRequirements={applicationRequirements}
          setApplicationRequirements={setApplicationRequirements}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          isLoading={createProduct.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
          resetForm();
        }}
        title="Edit Loan Product"
        size="xl"
      >
        <LoanProductForm
          productCode={productCode}
          setProductCode={setProductCode}
          productName={productName}
          setProductName={setProductName}
          rateOfInterest={rateOfInterest}
          setRateOfInterest={setRateOfInterest}
          penaltyInterestRate={penaltyInterestRate}
          setPenaltyInterestRate={setPenaltyInterestRate}
          maximumLoanAmount={maximumLoanAmount}
          setMaximumLoanAmount={setMaximumLoanAmount}
          isTermLoan={isTermLoan}
          setIsTermLoan={setIsTermLoan}
          repaymentScheduleType={repaymentScheduleType}
          setRepaymentScheduleType={setRepaymentScheduleType}
          cyclicDayOfTheMonth={cyclicDayOfTheMonth}
          setCyclicDayOfTheMonth={setCyclicDayOfTheMonth}
          minDaysBwDisbursementFirstRepayment={minDaysBwDisbursementFirstRepayment}
          setMinDaysBwDisbursementFirstRepayment={setMinDaysBwDisbursementFirstRepayment}
          daysPastDueThresholdForNpa={daysPastDueThresholdForNpa}
          setDaysPastDueThresholdForNpa={setDaysPastDueThresholdForNpa}
          gracePeriodInDays={gracePeriodInDays}
          setGracePeriodInDays={setGracePeriodInDays}
          bpiRecoveryMethod={bpiRecoveryMethod}
          setBpiRecoveryMethod={setBpiRecoveryMethod}
          productDescription={productDescription}
          setProductDescription={setProductDescription}
          termsAndConditions={termsAndConditions}
          setTermsAndConditions={setTermsAndConditions}
          accountOptions={accountOptions}
          disbursementAccount={disbursementAccount}
          setDisbursementAccount={setDisbursementAccount}
          paymentAccount={paymentAccount}
          setPaymentAccount={setPaymentAccount}
          loanAccount={loanAccount}
          setLoanAccount={setLoanAccount}
          interestIncomeAccount={interestIncomeAccount}
          setInterestIncomeAccount={setInterestIncomeAccount}
          penaltyIncomeAccount={penaltyIncomeAccount}
          setPenaltyIncomeAccount={setPenaltyIncomeAccount}
          interestAccruedAccount={interestAccruedAccount}
          setInterestAccruedAccount={setInterestAccruedAccount}
          interestReceivableAccount={interestReceivableAccount}
          setInterestReceivableAccount={setInterestReceivableAccount}
          penaltyAccruedAccount={penaltyAccruedAccount}
          setPenaltyAccruedAccount={setPenaltyAccruedAccount}
          penaltyReceivableAccount={penaltyReceivableAccount}
          setPenaltyReceivableAccount={setPenaltyReceivableAccount}
          securityDepositAccount={securityDepositAccount}
          setSecurityDepositAccount={setSecurityDepositAccount}
          customerRefundAccount={customerRefundAccount}
          setCustomerRefundAccount={setCustomerRefundAccount}
          writeOffAccount={writeOffAccount}
          setWriteOffAccount={setWriteOffAccount}
          writeOffRecoveryAccount={writeOffRecoveryAccount}
          setWriteOffRecoveryAccount={setWriteOffRecoveryAccount}
          interestWaiverAccount={interestWaiverAccount}
          setInterestWaiverAccount={setInterestWaiverAccount}
          penaltyWaiverAccount={penaltyWaiverAccount}
          setPenaltyWaiverAccount={setPenaltyWaiverAccount}
          disabled={disabled}
          setDisabled={setDisabled}
          // Eligibility props
          minimumLoanAmount={minimumLoanAmount}
          setMinimumLoanAmount={setMinimumLoanAmount}
          minimumTerm={minimumTerm}
          setMinimumTerm={setMinimumTerm}
          maximumTerm={maximumTerm}
          setMaximumTerm={setMaximumTerm}
          minimumAge={minimumAge}
          setMinimumAge={setMinimumAge}
          maximumAge={maximumAge}
          setMaximumAge={setMaximumAge}
          minimumMonthlyIncome={minimumMonthlyIncome}
          setMinimumMonthlyIncome={setMinimumMonthlyIncome}
          minimumAnnualIncome={minimumAnnualIncome}
          setMinimumAnnualIncome={setMinimumAnnualIncome}
          minimumCreditScore={minimumCreditScore}
          setMinimumCreditScore={setMinimumCreditScore}
          maximumDebtToIncomeRatio={maximumDebtToIncomeRatio}
          setMaximumDebtToIncomeRatio={setMaximumDebtToIncomeRatio}
          employmentTypes={employmentTypes}
          setEmploymentTypes={setEmploymentTypes}
          requiredDocuments={requiredDocuments}
          setRequiredDocuments={setRequiredDocuments}
          eligibleCountries={eligibleCountries}
          setEligibleCountries={setEligibleCountries}
          eligibleRegions={eligibleRegions}
          setEligibleRegions={setEligibleRegions}
          requiresCollateral={requiresCollateral}
          setRequiresCollateral={setRequiresCollateral}
          collateralRequirements={collateralRequirements}
          setCollateralRequirements={setCollateralRequirements}
          minimumEmploymentDuration={minimumEmploymentDuration}
          setMinimumEmploymentDuration={setMinimumEmploymentDuration}
          requiresCoApplicant={requiresCoApplicant}
          setRequiresCoApplicant={setRequiresCoApplicant}
          requiresGuarantor={requiresGuarantor}
          setRequiresGuarantor={setRequiresGuarantor}
          // Marketing props
          productTagline={productTagline}
          setProductTagline={setProductTagline}
          shortDescription={shortDescription}
          setShortDescription={setShortDescription}
          productHighlights={productHighlights}
          setProductHighlights={setProductHighlights}
          keyFeatures={keyFeatures}
          setKeyFeatures={setKeyFeatures}
          benefits={benefits}
          setBenefits={setBenefits}
          targetAudience={targetAudience}
          setTargetAudience={setTargetAudience}
          howItWorks={howItWorks}
          setHowItWorks={setHowItWorks}
          faqs={faqs}
          setFaqs={setFaqs}
          productImages={productImages}
          setProductImages={setProductImages}
          promotionalBannerUrl={promotionalBannerUrl}
          setPromotionalBannerUrl={setPromotionalBannerUrl}
          productIconUrl={productIconUrl}
          setProductIconUrl={setProductIconUrl}
          // Product Options props
          allowsPrepayment={allowsPrepayment}
          setAllowsPrepayment={setAllowsPrepayment}
          allowsPartialPrepayment={allowsPartialPrepayment}
          setAllowsPartialPrepayment={setAllowsPartialPrepayment}
          allowsRefinancing={allowsRefinancing}
          setAllowsRefinancing={setAllowsRefinancing}
          allowsTopUp={allowsTopUp}
          setAllowsTopUp={setAllowsTopUp}
          prepaymentCharges={prepaymentCharges}
          setPrepaymentCharges={setPrepaymentCharges}
          // Processing props
          averageProcessingTime={averageProcessingTime}
          setAverageProcessingTime={setAverageProcessingTime}
          averageDisbursementTime={averageDisbursementTime}
          setAverageDisbursementTime={setAverageDisbursementTime}
          processingTimeDescription={processingTimeDescription}
          setProcessingTimeDescription={setProcessingTimeDescription}
          // Classification props
          loanCategory={loanCategory}
          setLoanCategory={setLoanCategory}
          productType={productType}
          setProductType={setProductType}
          useCases={useCases}
          setUseCases={setUseCases}
          competitiveAdvantages={competitiveAdvantages}
          setCompetitiveAdvantages={setCompetitiveAdvantages}
          comparisonNotes={comparisonNotes}
          setComparisonNotes={setComparisonNotes}
          applicationRequirements={applicationRequirements}
          setApplicationRequirements={setApplicationRequirements}
          onSubmit={handleUpdate}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
            resetForm();
          }}
          isLoading={updateProduct.isPending}
          isEdit={true}
        />
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProduct(null);
        }}
        title={`Loan Product: ${selectedProduct?.productName || ''}`}
        size="xl"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Product Code</p>
                <p className="font-semibold">{selectedProduct.productCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={selectedProduct.disabled ? 'destructive' : 'default'}>
                  {selectedProduct.disabled ? 'Disabled' : 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Interest Rate</p>
                <p className="font-semibold">{selectedProduct.rateOfInterest}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Penalty Rate</p>
                <p className="font-semibold">{selectedProduct.penaltyInterestRate || 0}%</p>
              </div>
              {selectedProduct.maximumLoanAmount && (
                <div>
                  <p className="text-sm text-gray-500">Maximum Loan Amount</p>
                  <p className="font-semibold">${selectedProduct.maximumLoanAmount.toLocaleString()}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Term Loan</p>
                <p className="font-semibold">{selectedProduct.isTermLoan ? 'Yes' : 'No'}</p>
              </div>
            </div>
            {selectedProduct.productDescription && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900">{selectedProduct.productDescription}</p>
              </div>
            )}
            {selectedProduct.shortDescription && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Short Description</p>
                <p className="text-gray-900">{selectedProduct.shortDescription}</p>
              </div>
            )}
            {selectedProduct.productTagline && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Tagline</p>
                <p className="text-gray-900 font-medium italic">"{selectedProduct.productTagline}"</p>
              </div>
            )}
            {(selectedProduct.productHighlights?.length || 0) > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Product Highlights</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.productHighlights?.map((highlight, idx) => (
                    <Badge key={idx} variant="default">{highlight}</Badge>
                  ))}
                </div>
              </div>
            )}
            {(selectedProduct.keyFeatures?.length || 0) > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Key Features</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {selectedProduct.keyFeatures?.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            {(selectedProduct.termsAndConditions || selectedProduct.productDescription) && (
              <div className="border-t pt-4">
                {selectedProduct.productDescription && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Description</p>
                    <p className="text-gray-900">{selectedProduct.productDescription}</p>
                  </div>
                )}
                {selectedProduct.termsAndConditions && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Terms and Conditions</p>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">{selectedProduct.termsAndConditions}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
            {(selectedProduct.minimumAge || selectedProduct.minimumCreditScore || selectedProduct.minimumMonthlyIncome) && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Eligibility Criteria</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedProduct.minimumAge && (
                    <div>
                      <p className="text-gray-500">Minimum Age</p>
                      <p className="font-medium">{selectedProduct.minimumAge} years</p>
                    </div>
                  )}
                  {selectedProduct.maximumAge && (
                    <div>
                      <p className="text-gray-500">Maximum Age</p>
                      <p className="font-medium">{selectedProduct.maximumAge} years</p>
                    </div>
                  )}
                  {selectedProduct.minimumCreditScore && (
                    <div>
                      <p className="text-gray-500">Minimum Credit Score</p>
                      <p className="font-medium">{selectedProduct.minimumCreditScore}</p>
                    </div>
                  )}
                  {selectedProduct.minimumMonthlyIncome && (
                    <div>
                      <p className="text-gray-500">Minimum Monthly Income</p>
                      <p className="font-medium">${selectedProduct.minimumMonthlyIncome.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedProduct.minimumLoanAmount && (
                    <div>
                      <p className="text-gray-500">Minimum Loan Amount</p>
                      <p className="font-medium">${selectedProduct.minimumLoanAmount.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedProduct.minimumTerm && (
                    <div>
                      <p className="text-gray-500">Minimum Term</p>
                      <p className="font-medium">{selectedProduct.minimumTerm} months</p>
                    </div>
                  )}
                  {selectedProduct.maximumTerm && (
                    <div>
                      <p className="text-gray-500">Maximum Term</p>
                      <p className="font-medium">{selectedProduct.maximumTerm} months</p>
                    </div>
                  )}
                </div>
                {(selectedProduct.employmentTypes?.length || 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-1">Employment Types</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.employmentTypes?.map((type, idx) => (
                        <Badge key={idx} variant="outline">{type}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(selectedProduct.loanCategory || selectedProduct.productType) && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Classification</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {selectedProduct.loanCategory && (
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium">{selectedProduct.loanCategory}</p>
                    </div>
                  )}
                  {selectedProduct.productType && (
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium">{selectedProduct.productType}</p>
                    </div>
                  )}
                </div>
                {(selectedProduct.useCases?.length || 0) > 0 && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-1">Use Cases</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.useCases?.map((useCase, idx) => (
                        <Badge key={idx} variant="outline">{useCase}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {(selectedProduct.allowsPrepayment || selectedProduct.allowsRefinancing || selectedProduct.averageProcessingTime) && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Product Options & Processing</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Allows Prepayment</p>
                    <p className="font-medium">{selectedProduct.allowsPrepayment ? 'Yes' : 'No'}</p>
                  </div>
                  {selectedProduct.averageProcessingTime && (
                    <div>
                      <p className="text-gray-500">Processing Time</p>
                      <p className="font-medium">{selectedProduct.averageProcessingTime} days</p>
                    </div>
                  )}
                  {selectedProduct.processingTimeDescription && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Processing Description</p>
                      <p className="font-medium">{selectedProduct.processingTimeDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Accounting Accounts</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Disbursement</p>
                  <p className="font-medium">{selectedProduct.disbursementAccount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Payment</p>
                  <p className="font-medium">{selectedProduct.paymentAccount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Loan Account</p>
                  <p className="font-medium">{selectedProduct.loanAccount}</p>
                </div>
                <div>
                  <p className="text-gray-500">Interest Income</p>
                  <p className="font-medium">{selectedProduct.interestIncomeAccount}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewModal(false);
                  if (selectedProduct) handleEdit(selectedProduct);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        title="Delete Loan Product"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete <strong>{selectedProduct?.productName}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface LoanProductFormProps {
  productCode: string;
  setProductCode: (value: string) => void;
  productName: string;
  setProductName: (value: string) => void;
  rateOfInterest: string;
  setRateOfInterest: (value: string) => void;
  penaltyInterestRate: string;
  setPenaltyInterestRate: (value: string) => void;
  maximumLoanAmount: string;
  setMaximumLoanAmount: (value: string) => void;
  isTermLoan: boolean;
  setIsTermLoan: (value: boolean) => void;
  repaymentScheduleType: string;
  setRepaymentScheduleType: (value: string) => void;
  cyclicDayOfTheMonth: string;
  setCyclicDayOfTheMonth: (value: string) => void;
  minDaysBwDisbursementFirstRepayment: string;
  setMinDaysBwDisbursementFirstRepayment: (value: string) => void;
  daysPastDueThresholdForNpa: string;
  setDaysPastDueThresholdForNpa: (value: string) => void;
  gracePeriodInDays: string;
  setGracePeriodInDays: (value: string) => void;
  bpiRecoveryMethod: string;
  setBpiRecoveryMethod: (value: string) => void;
  productDescription: string;
  setProductDescription: (value: string) => void;
  termsAndConditions: string;
  setTermsAndConditions: (value: string) => void;
  accountOptions: { value: string; label: string }[];
  disbursementAccount: string;
  setDisbursementAccount: (value: string) => void;
  paymentAccount: string;
  setPaymentAccount: (value: string) => void;
  loanAccount: string;
  setLoanAccount: (value: string) => void;
  interestIncomeAccount: string;
  setInterestIncomeAccount: (value: string) => void;
  penaltyIncomeAccount: string;
  setPenaltyIncomeAccount: (value: string) => void;
  interestAccruedAccount: string;
  setInterestAccruedAccount: (value: string) => void;
  interestReceivableAccount: string;
  setInterestReceivableAccount: (value: string) => void;
  penaltyAccruedAccount: string;
  setPenaltyAccruedAccount: (value: string) => void;
  penaltyReceivableAccount: string;
  setPenaltyReceivableAccount: (value: string) => void;
  securityDepositAccount: string;
  setSecurityDepositAccount: (value: string) => void;
  customerRefundAccount: string;
  setCustomerRefundAccount: (value: string) => void;
  writeOffAccount: string;
  setWriteOffAccount: (value: string) => void;
  writeOffRecoveryAccount: string;
  setWriteOffRecoveryAccount: (value: string) => void;
  interestWaiverAccount: string;
  setInterestWaiverAccount: (value: string) => void;
  penaltyWaiverAccount: string;
  setPenaltyWaiverAccount: (value: string) => void;
  disabled?: boolean;
  setDisabled?: (value: boolean) => void;
  // Eligibility
  minimumLoanAmount: string;
  setMinimumLoanAmount: (value: string) => void;
  minimumTerm: string;
  setMinimumTerm: (value: string) => void;
  maximumTerm: string;
  setMaximumTerm: (value: string) => void;
  minimumAge: string;
  setMinimumAge: (value: string) => void;
  maximumAge: string;
  setMaximumAge: (value: string) => void;
  minimumMonthlyIncome: string;
  setMinimumMonthlyIncome: (value: string) => void;
  minimumAnnualIncome: string;
  setMinimumAnnualIncome: (value: string) => void;
  minimumCreditScore: string;
  setMinimumCreditScore: (value: string) => void;
  maximumDebtToIncomeRatio: string;
  setMaximumDebtToIncomeRatio: (value: string) => void;
  employmentTypes: string[];
  setEmploymentTypes: (values: string[]) => void;
  requiredDocuments: string[];
  setRequiredDocuments: (values: string[]) => void;
  eligibleCountries: string[];
  setEligibleCountries: (values: string[]) => void;
  eligibleRegions: string[];
  setEligibleRegions: (values: string[]) => void;
  requiresCollateral: boolean;
  setRequiresCollateral: (value: boolean) => void;
  collateralRequirements: string;
  setCollateralRequirements: (value: string) => void;
  minimumEmploymentDuration: string;
  setMinimumEmploymentDuration: (value: string) => void;
  requiresCoApplicant: boolean;
  setRequiresCoApplicant: (value: boolean) => void;
  requiresGuarantor: boolean;
  setRequiresGuarantor: (value: boolean) => void;
  // Marketing
  productTagline: string;
  setProductTagline: (value: string) => void;
  shortDescription: string;
  setShortDescription: (value: string) => void;
  productHighlights: string[];
  setProductHighlights: (values: string[]) => void;
  keyFeatures: string[];
  setKeyFeatures: (values: string[]) => void;
  benefits: string[];
  setBenefits: (values: string[]) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  howItWorks: string;
  setHowItWorks: (value: string) => void;
  faqs: Array<{ question: string; answer: string }>;
  setFaqs: (faqs: Array<{ question: string; answer: string }>) => void;
  productImages: string[];
  setProductImages: (values: string[]) => void;
  promotionalBannerUrl: string;
  setPromotionalBannerUrl: (value: string) => void;
  productIconUrl: string;
  setProductIconUrl: (value: string) => void;
  // Product Options
  allowsPrepayment: boolean;
  setAllowsPrepayment: (value: boolean) => void;
  allowsPartialPrepayment: boolean;
  setAllowsPartialPrepayment: (value: boolean) => void;
  allowsRefinancing: boolean;
  setAllowsRefinancing: (value: boolean) => void;
  allowsTopUp: boolean;
  setAllowsTopUp: (value: boolean) => void;
  prepaymentCharges: string;
  setPrepaymentCharges: (value: string) => void;
  // Processing
  averageProcessingTime: string;
  setAverageProcessingTime: (value: string) => void;
  averageDisbursementTime: string;
  setAverageDisbursementTime: (value: string) => void;
  processingTimeDescription: string;
  setProcessingTimeDescription: (value: string) => void;
  // Classification
  loanCategory: string;
  setLoanCategory: (value: string) => void;
  productType: string;
  setProductType: (value: string) => void;
  useCases: string[];
  setUseCases: (values: string[]) => void;
  competitiveAdvantages: string[];
  setCompetitiveAdvantages: (values: string[]) => void;
  comparisonNotes: string;
  setComparisonNotes: (value: string) => void;
  applicationRequirements: string;
  setApplicationRequirements: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function LoanProductForm({
  productCode,
  setProductCode,
  productName,
  setProductName,
  rateOfInterest,
  setRateOfInterest,
  penaltyInterestRate,
  setPenaltyInterestRate,
  maximumLoanAmount,
  setMaximumLoanAmount,
  isTermLoan,
  setIsTermLoan,
  repaymentScheduleType,
  setRepaymentScheduleType,
  cyclicDayOfTheMonth,
  setCyclicDayOfTheMonth,
  minDaysBwDisbursementFirstRepayment,
  setMinDaysBwDisbursementFirstRepayment,
  daysPastDueThresholdForNpa,
  setDaysPastDueThresholdForNpa,
  gracePeriodInDays,
  setGracePeriodInDays,
  bpiRecoveryMethod,
  setBpiRecoveryMethod,
  productDescription,
  setProductDescription,
  termsAndConditions,
  setTermsAndConditions,
  accountOptions,
  disbursementAccount,
  setDisbursementAccount,
  paymentAccount,
  setPaymentAccount,
  loanAccount,
  setLoanAccount,
  interestIncomeAccount,
  setInterestIncomeAccount,
  penaltyIncomeAccount,
  setPenaltyIncomeAccount,
  interestAccruedAccount,
  setInterestAccruedAccount,
  interestReceivableAccount,
  setInterestReceivableAccount,
  penaltyAccruedAccount,
  setPenaltyAccruedAccount,
  penaltyReceivableAccount,
  setPenaltyReceivableAccount,
  securityDepositAccount,
  setSecurityDepositAccount,
  customerRefundAccount,
  setCustomerRefundAccount,
  writeOffAccount,
  setWriteOffAccount,
  writeOffRecoveryAccount,
  setWriteOffRecoveryAccount,
  interestWaiverAccount,
  setInterestWaiverAccount,
  penaltyWaiverAccount,
  setPenaltyWaiverAccount,
  disabled,
  setDisabled,
  // Eligibility
  minimumLoanAmount,
  setMinimumLoanAmount,
  minimumTerm,
  setMinimumTerm,
  maximumTerm,
  setMaximumTerm,
  minimumAge,
  setMinimumAge,
  maximumAge,
  setMaximumAge,
  minimumMonthlyIncome,
  setMinimumMonthlyIncome,
  minimumAnnualIncome,
  setMinimumAnnualIncome,
  minimumCreditScore,
  setMinimumCreditScore,
  maximumDebtToIncomeRatio,
  setMaximumDebtToIncomeRatio,
  employmentTypes,
  setEmploymentTypes,
  requiredDocuments,
  setRequiredDocuments,
  eligibleCountries,
  setEligibleCountries,
  eligibleRegions,
  setEligibleRegions,
  requiresCollateral,
  setRequiresCollateral,
  collateralRequirements,
  setCollateralRequirements,
  minimumEmploymentDuration,
  setMinimumEmploymentDuration,
  requiresCoApplicant,
  setRequiresCoApplicant,
  requiresGuarantor,
  setRequiresGuarantor,
  // Marketing
  productTagline,
  setProductTagline,
  shortDescription,
  setShortDescription,
  productHighlights,
  setProductHighlights,
  keyFeatures,
  setKeyFeatures,
  benefits,
  setBenefits,
  targetAudience,
  setTargetAudience,
  howItWorks,
  setHowItWorks,
  faqs,
  setFaqs,
  productImages,
  setProductImages,
  promotionalBannerUrl,
  setPromotionalBannerUrl,
  productIconUrl,
  setProductIconUrl,
  // Product Options
  allowsPrepayment,
  setAllowsPrepayment,
  allowsPartialPrepayment,
  setAllowsPartialPrepayment,
  allowsRefinancing,
  setAllowsRefinancing,
  allowsTopUp,
  setAllowsTopUp,
  prepaymentCharges,
  setPrepaymentCharges,
  // Processing
  averageProcessingTime,
  setAverageProcessingTime,
  averageDisbursementTime,
  setAverageDisbursementTime,
  processingTimeDescription,
  setProcessingTimeDescription,
  // Classification
  loanCategory,
  setLoanCategory,
  productType,
  setProductType,
  useCases,
  setUseCases,
  competitiveAdvantages,
  setCompetitiveAdvantages,
  comparisonNotes,
  setComparisonNotes,
  applicationRequirements,
  setApplicationRequirements,
  onSubmit,
  onCancel,
  isLoading,
  isEdit = false,
}: LoanProductFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'eligibility' | 'marketing' | 'options' | 'processing' | 'classification' | 'repayment' | 'accounts' | 'terms'>('basic');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Basic Info', icon: FileText },
            { id: 'eligibility', label: 'Eligibility', icon: Users },
            { id: 'marketing', label: 'Marketing', icon: TrendingUp },
            { id: 'options', label: 'Product Options', icon: Settings },
            { id: 'processing', label: 'Processing', icon: Clock },
            { id: 'classification', label: 'Classification', icon: Tag },
            { id: 'repayment', label: 'Repayment', icon: Settings },
            { id: 'accounts', label: 'Accounts', icon: DollarSign },
            { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-2">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-4">
            {!isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  placeholder="PL-001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Unique identifier for the product</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Personal Loan"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={rateOfInterest}
                  onChange={(e) => setRateOfInterest(e.target.value)}
                  placeholder="12.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={penaltyInterestRate}
                  onChange={(e) => setPenaltyInterestRate(e.target.value)}
                  placeholder="2.0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Loan Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={maximumLoanAmount}
                onChange={(e) => setMaximumLoanAmount(e.target.value)}
                placeholder="1000000"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isTermLoan"
                checked={isTermLoan}
                onChange={(e) => setIsTermLoan(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="isTermLoan" className="text-sm font-medium text-gray-700">
                Is Term Loan
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Description
              </label>
              <Textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="A flexible personal loan product for individuals..."
                rows={3}
              />
            </div>
            {isEdit && setDisabled && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="disabled"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="disabled" className="text-sm font-medium text-gray-700">
                  Disable Product
                </label>
              </div>
            )}
          </div>
        )}

        {/* Eligibility Tab */}
        {activeTab === 'eligibility' && (
          <EligibilityTab
            minimumLoanAmount={minimumLoanAmount}
            setMinimumLoanAmount={setMinimumLoanAmount}
            minimumTerm={minimumTerm}
            setMinimumTerm={setMinimumTerm}
            maximumTerm={maximumTerm}
            setMaximumTerm={setMaximumTerm}
            minimumAge={minimumAge}
            setMinimumAge={setMinimumAge}
            maximumAge={maximumAge}
            setMaximumAge={setMaximumAge}
            minimumMonthlyIncome={minimumMonthlyIncome}
            setMinimumMonthlyIncome={setMinimumMonthlyIncome}
            minimumAnnualIncome={minimumAnnualIncome}
            setMinimumAnnualIncome={setMinimumAnnualIncome}
            minimumCreditScore={minimumCreditScore}
            setMinimumCreditScore={setMinimumCreditScore}
            maximumDebtToIncomeRatio={maximumDebtToIncomeRatio}
            setMaximumDebtToIncomeRatio={setMaximumDebtToIncomeRatio}
            employmentTypes={employmentTypes}
            setEmploymentTypes={setEmploymentTypes}
            requiredDocuments={requiredDocuments}
            setRequiredDocuments={setRequiredDocuments}
            eligibleCountries={eligibleCountries}
            setEligibleCountries={setEligibleCountries}
            eligibleRegions={eligibleRegions}
            setEligibleRegions={setEligibleRegions}
            requiresCollateral={requiresCollateral}
            setRequiresCollateral={setRequiresCollateral}
            collateralRequirements={collateralRequirements}
            setCollateralRequirements={setCollateralRequirements}
            minimumEmploymentDuration={minimumEmploymentDuration}
            setMinimumEmploymentDuration={setMinimumEmploymentDuration}
            requiresCoApplicant={requiresCoApplicant}
            setRequiresCoApplicant={setRequiresCoApplicant}
            requiresGuarantor={requiresGuarantor}
            setRequiresGuarantor={setRequiresGuarantor}
          />
        )}

        {/* Marketing Tab */}
        {activeTab === 'marketing' && (
          <MarketingTab
            productTagline={productTagline}
            setProductTagline={setProductTagline}
            shortDescription={shortDescription}
            setShortDescription={setShortDescription}
            productHighlights={productHighlights}
            setProductHighlights={setProductHighlights}
            keyFeatures={keyFeatures}
            setKeyFeatures={setKeyFeatures}
            benefits={benefits}
            setBenefits={setBenefits}
            targetAudience={targetAudience}
            setTargetAudience={setTargetAudience}
            howItWorks={howItWorks}
            setHowItWorks={setHowItWorks}
            faqs={faqs}
            setFaqs={setFaqs}
            productImages={productImages}
            setProductImages={setProductImages}
            promotionalBannerUrl={promotionalBannerUrl}
            setPromotionalBannerUrl={setPromotionalBannerUrl}
            productIconUrl={productIconUrl}
            setProductIconUrl={setProductIconUrl}
          />
        )}

        {/* Product Options Tab */}
        {activeTab === 'options' && (
          <ProductOptionsTab
            allowsPrepayment={allowsPrepayment}
            setAllowsPrepayment={setAllowsPrepayment}
            allowsPartialPrepayment={allowsPartialPrepayment}
            setAllowsPartialPrepayment={setAllowsPartialPrepayment}
            allowsRefinancing={allowsRefinancing}
            setAllowsRefinancing={setAllowsRefinancing}
            allowsTopUp={allowsTopUp}
            setAllowsTopUp={setAllowsTopUp}
            prepaymentCharges={prepaymentCharges}
            setPrepaymentCharges={setPrepaymentCharges}
          />
        )}

        {/* Processing Tab */}
        {activeTab === 'processing' && (
          <ProcessingTab
            averageProcessingTime={averageProcessingTime}
            setAverageProcessingTime={setAverageProcessingTime}
            averageDisbursementTime={averageDisbursementTime}
            setAverageDisbursementTime={setAverageDisbursementTime}
            processingTimeDescription={processingTimeDescription}
            setProcessingTimeDescription={setProcessingTimeDescription}
          />
        )}

        {/* Classification Tab */}
        {activeTab === 'classification' && (
          <ClassificationTab
            loanCategory={loanCategory}
            setLoanCategory={setLoanCategory}
            productType={productType}
            setProductType={setProductType}
            useCases={useCases}
            setUseCases={setUseCases}
            competitiveAdvantages={competitiveAdvantages}
            setCompetitiveAdvantages={setCompetitiveAdvantages}
            comparisonNotes={comparisonNotes}
            setComparisonNotes={setComparisonNotes}
            applicationRequirements={applicationRequirements}
            setApplicationRequirements={setApplicationRequirements}
          />
        )}

        {/* Repayment Tab */}
        {activeTab === 'repayment' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repayment Schedule Type
              </label>
              <Select
                value={repaymentScheduleType}
                onChange={(e) => setRepaymentScheduleType(e.target.value)}
              >
                <option value="">Select schedule type</option>
                <option value="MONTHLY_AS_PER_START_DATE">Monthly as per repayment start date</option>
                <option value="MONTHLY_AS_PER_CYCLE_DATE">Monthly as per cycle date</option>
                <option value="PRO_RATED_CALENDAR_MONTHS">Pro-rated calendar months</option>
                <option value="LINE_OF_CREDIT">Line of credit</option>
              </Select>
            </div>
            {repaymentScheduleType === 'MONTHLY_AS_PER_CYCLE_DATE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cyclic Day of the Month (1-31)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={cyclicDayOfTheMonth}
                  onChange={(e) => setCyclicDayOfTheMonth(e.target.value)}
                  placeholder="15"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Days Between Disbursement and First Repayment
              </label>
              <Input
                type="number"
                value={minDaysBwDisbursementFirstRepayment}
                onChange={(e) => setMinDaysBwDisbursementFirstRepayment(e.target.value)}
                placeholder="30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days Past Due Threshold for NPA
              </label>
              <Input
                type="number"
                value={daysPastDueThresholdForNpa}
                onChange={(e) => setDaysPastDueThresholdForNpa(e.target.value)}
                placeholder="90"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grace Period (Days)
              </label>
              <Input
                type="number"
                value={gracePeriodInDays}
                onChange={(e) => setGracePeriodInDays(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                BPI Recovery Method
              </label>
              <Select
                value={bpiRecoveryMethod}
                onChange={(e) => setBpiRecoveryMethod(e.target.value)}
              >
                <option value="">Select method</option>
                <option value="Amortized Over Tenure">Amortized Over Tenure</option>
                <option value="Add to First EMI">Add to First EMI</option>
                <option value="Upfront Deduction">Upfront Deduction</option>
              </Select>
            </div>
          </div>
        )}

        {/* Accounts Tab */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Configure accounting accounts for this loan product. Use account codes from the Chart of Accounts.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disbursement Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={disbursementAccount}
                  onChange={(e) => setDisbursementAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loan Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={loanAccount}
                  onChange={(e) => setLoanAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Income Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={interestIncomeAccount}
                  onChange={(e) => setInterestIncomeAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Income Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={penaltyIncomeAccount}
                  onChange={(e) => setPenaltyIncomeAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Accrued Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={interestAccruedAccount}
                  onChange={(e) => setInterestAccruedAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Receivable Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={interestReceivableAccount}
                  onChange={(e) => setInterestReceivableAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Accrued Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={penaltyAccruedAccount}
                  onChange={(e) => setPenaltyAccruedAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Receivable Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={penaltyReceivableAccount}
                  onChange={(e) => setPenaltyReceivableAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Security Deposit Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={securityDepositAccount}
                  onChange={(e) => setSecurityDepositAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Refund Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={customerRefundAccount}
                  onChange={(e) => setCustomerRefundAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Write-Off Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={writeOffAccount}
                  onChange={(e) => setWriteOffAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Write-Off Recovery Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={writeOffRecoveryAccount}
                  onChange={(e) => setWriteOffRecoveryAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Waiver Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={interestWaiverAccount}
                  onChange={(e) => setInterestWaiverAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Penalty Waiver Account <span className="text-red-500">*</span>
                </label>
                <Select
                  value={penaltyWaiverAccount}
                  onChange={(e) => setPenaltyWaiverAccount(e.target.value)}
                  required
                >
                  {accountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions Tab */}
        {activeTab === 'terms' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <Textarea
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="1. Borrower must be 18+ years old&#10;2. Minimum income requirement: $2,000/month&#10;3. Interest rate: 12.5% per annum&#10;4. Late payment penalty: 2% per annum&#10;5. Loan classified as NPA after 90 days past due"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter terms and conditions. Use plain text or numbered list format.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </div>
  );
}

// Helper component for array input
function ArrayInput({
  label,
  values,
  setValues,
  placeholder,
}: {
  label: string;
  values: string[];
  setValues: (values: string[]) => void;
  placeholder: string;
}) {
  const [newValue, setNewValue] = useState('');

  const addValue = () => {
    if (newValue.trim()) {
      setValues([...values, newValue.trim()]);
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <Input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={addValue}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <span className="flex-1 text-sm">{value}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeValue(index)}
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Input Component
function FAQInput({
  faqs,
  setFaqs,
}: {
  faqs: Array<{ question: string; answer: string }>;
  setFaqs: (faqs: Array<{ question: string; answer: string }>) => void;
}) {
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const addFAQ = () => {
    if (newQuestion.trim() && newAnswer.trim()) {
      setFaqs([...faqs, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
      setNewQuestion('');
      setNewAnswer('');
    }
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">FAQs</label>
      <div className="space-y-3 mb-3">
        <Input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Question"
        />
        <Textarea
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          placeholder="Answer"
          rows={2}
        />
        <Button type="button" variant="outline" onClick={addFAQ}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {faqs.map((faq, index) => (
          <div key={index} className="p-3 bg-gray-50 rounded border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 mb-1">Q: {faq.question}</p>
                <p className="text-sm text-gray-700">A: {faq.answer}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFAQ(index)}
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Eligibility Tab Component
function EligibilityTab({
  minimumLoanAmount,
  setMinimumLoanAmount,
  minimumTerm,
  setMinimumTerm,
  maximumTerm,
  setMaximumTerm,
  minimumAge,
  setMinimumAge,
  maximumAge,
  setMaximumAge,
  minimumMonthlyIncome,
  setMinimumMonthlyIncome,
  minimumAnnualIncome,
  setMinimumAnnualIncome,
  minimumCreditScore,
  setMinimumCreditScore,
  maximumDebtToIncomeRatio,
  setMaximumDebtToIncomeRatio,
  employmentTypes,
  setEmploymentTypes,
  requiredDocuments,
  setRequiredDocuments,
  eligibleCountries,
  setEligibleCountries,
  eligibleRegions,
  setEligibleRegions,
  requiresCollateral,
  setRequiresCollateral,
  collateralRequirements,
  setCollateralRequirements,
  minimumEmploymentDuration,
  setMinimumEmploymentDuration,
  requiresCoApplicant,
  setRequiresCoApplicant,
  requiresGuarantor,
  setRequiresGuarantor,
}: {
  minimumLoanAmount: string;
  setMinimumLoanAmount: (value: string) => void;
  minimumTerm: string;
  setMinimumTerm: (value: string) => void;
  maximumTerm: string;
  setMaximumTerm: (value: string) => void;
  minimumAge: string;
  setMinimumAge: (value: string) => void;
  maximumAge: string;
  setMaximumAge: (value: string) => void;
  minimumMonthlyIncome: string;
  setMinimumMonthlyIncome: (value: string) => void;
  minimumAnnualIncome: string;
  setMinimumAnnualIncome: (value: string) => void;
  minimumCreditScore: string;
  setMinimumCreditScore: (value: string) => void;
  maximumDebtToIncomeRatio: string;
  setMaximumDebtToIncomeRatio: (value: string) => void;
  employmentTypes: string[];
  setEmploymentTypes: (values: string[]) => void;
  requiredDocuments: string[];
  setRequiredDocuments: (values: string[]) => void;
  eligibleCountries: string[];
  setEligibleCountries: (values: string[]) => void;
  eligibleRegions: string[];
  setEligibleRegions: (values: string[]) => void;
  requiresCollateral: boolean;
  setRequiresCollateral: (value: boolean) => void;
  collateralRequirements: string;
  setCollateralRequirements: (value: string) => void;
  minimumEmploymentDuration: string;
  setMinimumEmploymentDuration: (value: string) => void;
  requiresCoApplicant: boolean;
  setRequiresCoApplicant: (value: boolean) => void;
  requiresGuarantor: boolean;
  setRequiresGuarantor: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Define eligibility criteria for borrowers applying for this loan product.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Loan Amount</label>
          <Input
            type="number"
            step="0.01"
            value={minimumLoanAmount}
            onChange={(e) => setMinimumLoanAmount(e.target.value)}
            placeholder="5000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Term (months)</label>
          <Input
            type="number"
            value={minimumTerm}
            onChange={(e) => setMinimumTerm(e.target.value)}
            placeholder="12"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Term (months)</label>
          <Input
            type="number"
            value={maximumTerm}
            onChange={(e) => setMaximumTerm(e.target.value)}
            placeholder="60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
          <Input
            type="number"
            value={minimumAge}
            onChange={(e) => setMinimumAge(e.target.value)}
            placeholder="18"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Age</label>
          <Input
            type="number"
            value={maximumAge}
            onChange={(e) => setMaximumAge(e.target.value)}
            placeholder="65"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Monthly Income</label>
          <Input
            type="number"
            step="0.01"
            value={minimumMonthlyIncome}
            onChange={(e) => setMinimumMonthlyIncome(e.target.value)}
            placeholder="3000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Annual Income</label>
          <Input
            type="number"
            step="0.01"
            value={minimumAnnualIncome}
            onChange={(e) => setMinimumAnnualIncome(e.target.value)}
            placeholder="36000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Credit Score</label>
          <Input
            type="number"
            value={minimumCreditScore}
            onChange={(e) => setMinimumCreditScore(e.target.value)}
            placeholder="650"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Debt-to-Income Ratio (%)</label>
          <Input
            type="number"
            step="0.01"
            value={maximumDebtToIncomeRatio}
            onChange={(e) => setMaximumDebtToIncomeRatio(e.target.value)}
            placeholder="40"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Employment Duration (months)</label>
          <Input
            type="number"
            value={minimumEmploymentDuration}
            onChange={(e) => setMinimumEmploymentDuration(e.target.value)}
            placeholder="6"
          />
        </div>
      </div>
      <ArrayInput
        label="Employment Types"
        values={employmentTypes}
        setValues={setEmploymentTypes}
        placeholder="e.g., Salaried, Self-Employed"
      />
      <ArrayInput
        label="Required Documents"
        values={requiredDocuments}
        setValues={setRequiredDocuments}
        placeholder="e.g., ID Proof, Address Proof"
      />
      <ArrayInput
        label="Eligible Countries (ISO codes)"
        values={eligibleCountries}
        setValues={setEligibleCountries}
        placeholder="e.g., US, CA"
      />
      <ArrayInput
        label="Eligible Regions/States"
        values={eligibleRegions}
        setValues={setEligibleRegions}
        placeholder="e.g., CA, NY, TX"
      />
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresCollateral"
          checked={requiresCollateral}
          onChange={(e) => setRequiresCollateral(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="requiresCollateral" className="text-sm font-medium text-gray-700">
          Requires Collateral
        </label>
      </div>
      {requiresCollateral && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Collateral Requirements</label>
          <Textarea
            value={collateralRequirements}
            onChange={(e) => setCollateralRequirements(e.target.value)}
            placeholder="Describe collateral requirements..."
            rows={3}
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresCoApplicant"
          checked={requiresCoApplicant}
          onChange={(e) => setRequiresCoApplicant(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="requiresCoApplicant" className="text-sm font-medium text-gray-700">
          Requires Co-Applicant
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requiresGuarantor"
          checked={requiresGuarantor}
          onChange={(e) => setRequiresGuarantor(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="requiresGuarantor" className="text-sm font-medium text-gray-700">
          Requires Guarantor
        </label>
      </div>
    </div>
  );
}

// Marketing Tab Component
function MarketingTab({
  productTagline,
  setProductTagline,
  shortDescription,
  setShortDescription,
  productHighlights,
  setProductHighlights,
  keyFeatures,
  setKeyFeatures,
  benefits,
  setBenefits,
  targetAudience,
  setTargetAudience,
  howItWorks,
  setHowItWorks,
  faqs,
  setFaqs,
  productImages,
  setProductImages,
  promotionalBannerUrl,
  setPromotionalBannerUrl,
  productIconUrl,
  setProductIconUrl,
}: {
  productTagline: string;
  setProductTagline: (value: string) => void;
  shortDescription: string;
  setShortDescription: (value: string) => void;
  productHighlights: string[];
  setProductHighlights: (values: string[]) => void;
  keyFeatures: string[];
  setKeyFeatures: (values: string[]) => void;
  benefits: string[];
  setBenefits: (values: string[]) => void;
  targetAudience: string;
  setTargetAudience: (value: string) => void;
  howItWorks: string;
  setHowItWorks: (value: string) => void;
  faqs: Array<{ question: string; answer: string }>;
  setFaqs: (faqs: Array<{ question: string; answer: string }>) => void;
  productImages: string[];
  setProductImages: (values: string[]) => void;
  promotionalBannerUrl: string;
  setPromotionalBannerUrl: (value: string) => void;
  productIconUrl: string;
  setProductIconUrl: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Add marketing content and audience-facing information for this loan product.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Tagline</label>
        <Input
          value={productTagline}
          onChange={(e) => setProductTagline(e.target.value)}
          placeholder="Your financial freedom starts here"
        />
        <p className="text-xs text-gray-500 mt-1">Short marketing tagline for the product</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
        <Textarea
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
          placeholder="Flexible personal loans with competitive rates"
          rows={2}
        />
        <p className="text-xs text-gray-500 mt-1">1-2 sentence description for product listings</p>
      </div>
      <ArrayInput
        label="Product Highlights"
        values={productHighlights}
        setValues={setProductHighlights}
        placeholder="e.g., Quick Approval, Low Interest Rates"
      />
      <ArrayInput
        label="Key Features"
        values={keyFeatures}
        setValues={setKeyFeatures}
        placeholder="e.g., No Prepayment Charges, Online Application"
      />
      <ArrayInput
        label="Benefits"
        values={benefits}
        setValues={setBenefits}
        placeholder="e.g., Flexible repayment, Quick disbursement"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
        <Textarea
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="Describe the target customers for this product..."
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">How It Works</label>
        <Textarea
          value={howItWorks}
          onChange={(e) => setHowItWorks(e.target.value)}
          placeholder="Step 1: Apply online...&#10;Step 2: Get approved...&#10;Step 3: Receive funds..."
          rows={5}
        />
      </div>
      <FAQInput faqs={faqs} setFaqs={setFaqs} />
      <ArrayInput
        label="Product Image URLs"
        values={productImages}
        setValues={setProductImages}
        placeholder="https://example.com/image.jpg"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Banner URL</label>
        <Input
          value={promotionalBannerUrl}
          onChange={(e) => setPromotionalBannerUrl(e.target.value)}
          placeholder="https://example.com/banner.jpg"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Product Icon URL</label>
        <Input
          value={productIconUrl}
          onChange={(e) => setProductIconUrl(e.target.value)}
          placeholder="https://example.com/icon.png"
        />
      </div>
    </div>
  );
}

// Product Options Tab Component
function ProductOptionsTab({
  allowsPrepayment,
  setAllowsPrepayment,
  allowsPartialPrepayment,
  setAllowsPartialPrepayment,
  allowsRefinancing,
  setAllowsRefinancing,
  allowsTopUp,
  setAllowsTopUp,
  prepaymentCharges,
  setPrepaymentCharges,
}: {
  allowsPrepayment: boolean;
  setAllowsPrepayment: (value: boolean) => void;
  allowsPartialPrepayment: boolean;
  setAllowsPartialPrepayment: (value: boolean) => void;
  allowsRefinancing: boolean;
  setAllowsRefinancing: (value: boolean) => void;
  allowsTopUp: boolean;
  setAllowsTopUp: (value: boolean) => void;
  prepaymentCharges: string;
  setPrepaymentCharges: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Configure product options and flexibility features.
      </p>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowsPrepayment"
            checked={allowsPrepayment}
            onChange={(e) => setAllowsPrepayment(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allowsPrepayment" className="text-sm font-medium text-gray-700">
            Allows Prepayment
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowsPartialPrepayment"
            checked={allowsPartialPrepayment}
            onChange={(e) => setAllowsPartialPrepayment(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allowsPartialPrepayment" className="text-sm font-medium text-gray-700">
            Allows Partial Prepayment
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowsRefinancing"
            checked={allowsRefinancing}
            onChange={(e) => setAllowsRefinancing(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allowsRefinancing" className="text-sm font-medium text-gray-700">
            Allows Refinancing
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allowsTopUp"
            checked={allowsTopUp}
            onChange={(e) => setAllowsTopUp(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allowsTopUp" className="text-sm font-medium text-gray-700">
            Allows Top-Up
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prepayment Charges (%)
          </label>
          <Input
            type="number"
            step="0.01"
            value={prepaymentCharges}
            onChange={(e) => setPrepaymentCharges(e.target.value)}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 mt-1">Percentage or fixed amount charged for prepayment</p>
        </div>
      </div>
    </div>
  );
}

// Processing Tab Component
function ProcessingTab({
  averageProcessingTime,
  setAverageProcessingTime,
  averageDisbursementTime,
  setAverageDisbursementTime,
  processingTimeDescription,
  setProcessingTimeDescription,
}: {
  averageProcessingTime: string;
  setAverageProcessingTime: (value: string) => void;
  averageDisbursementTime: string;
  setAverageDisbursementTime: (value: string) => void;
  processingTimeDescription: string;
  setProcessingTimeDescription: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Configure processing and disbursement timeframes.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Average Processing Time (days)
          </label>
          <Input
            type="number"
            value={averageProcessingTime}
            onChange={(e) => setAverageProcessingTime(e.target.value)}
            placeholder="3"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Average Disbursement Time (days)
          </label>
          <Input
            type="number"
            value={averageDisbursementTime}
            onChange={(e) => setAverageDisbursementTime(e.target.value)}
            placeholder="5"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Processing Time Description
        </label>
        <Textarea
          value={processingTimeDescription}
          onChange={(e) => setProcessingTimeDescription(e.target.value)}
          placeholder="Approval within 24 hours, funds disbursed within 48 hours"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">Human-readable description of processing times</p>
      </div>
    </div>
  );
}

// Classification Tab Component
function ClassificationTab({
  loanCategory,
  setLoanCategory,
  productType,
  setProductType,
  useCases,
  setUseCases,
  competitiveAdvantages,
  setCompetitiveAdvantages,
  comparisonNotes,
  setComparisonNotes,
  applicationRequirements,
  setApplicationRequirements,
}: {
  loanCategory: string;
  setLoanCategory: (value: string) => void;
  productType: string;
  setProductType: (value: string) => void;
  useCases: string[];
  setUseCases: (values: string[]) => void;
  competitiveAdvantages: string[];
  setCompetitiveAdvantages: (values: string[]) => void;
  comparisonNotes: string;
  setComparisonNotes: (value: string) => void;
  applicationRequirements: string;
  setApplicationRequirements: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        Classify and categorize the loan product for better organization and comparison.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loan Category</label>
          <Select
            value={loanCategory}
            onChange={(e) => setLoanCategory(e.target.value)}
          >
            <option value="">Select category</option>
            <option value="Personal">Personal</option>
            <option value="Business">Business</option>
            <option value="Home">Home</option>
            <option value="Auto">Auto</option>
            <option value="Education">Education</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
          <Select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <option value="">Select type</option>
            <option value="Secured">Secured</option>
            <option value="Unsecured">Unsecured</option>
            <option value="Line of Credit">Line of Credit</option>
            <option value="Revolving">Revolving</option>
            <option value="Term">Term</option>
          </Select>
        </div>
      </div>
      <ArrayInput
        label="Use Cases"
        values={useCases}
        setValues={setUseCases}
        placeholder="e.g., Debt Consolidation, Home Improvement"
      />
      <ArrayInput
        label="Competitive Advantages"
        values={competitiveAdvantages}
        setValues={setCompetitiveAdvantages}
        placeholder="e.g., Lower interest rates, Faster approval"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comparison Notes</label>
        <Textarea
          value={comparisonNotes}
          onChange={(e) => setComparisonNotes(e.target.value)}
          placeholder="Notes for comparing this product with others..."
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Application Requirements</label>
        <Textarea
          value={applicationRequirements}
          onChange={(e) => setApplicationRequirements(e.target.value)}
          placeholder="Detailed application requirements and process..."
          rows={4}
        />
      </div>
    </div>
  );
}

