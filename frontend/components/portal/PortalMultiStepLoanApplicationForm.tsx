"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  Lock,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Save,
  Loader2,
  DollarSign,
  User,
  FileText,
  CreditCard,
  CheckCircle,
  BookOpen,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCustomerPortal } from "@/contexts/CustomerPortalContext";
import { 
  usePortalCompanies, 
  usePortalLoanProducts, 
  useSubmitPortalLoanApplication 
} from "@/lib/hooks/usePortalLoanApplication";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Tooltip } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils/cn";

// Form validation schema
const formSchema = z.object({
  // Step 1: Loan Details
  companyId: z.string().min(1, "Company is required"),
  loanProductId: z.string().min(1, "Loan product is required"),
  loanAmount: z
    .string()
    .min(1, "Loan amount is required")
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      },
      { message: "Loan amount must be a positive number" }
    ),
  loanPurpose: z.string().min(5, "Loan purpose must be at least 5 characters"),
  loanTerm: z.string().min(1, "Loan term is required"),

  // Step 2: Personal Info
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  address: z.string().min(10, "Address must be at least 10 characters"),

  // Step 3: Financial Info
  annualIncome: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: "Annual income must be a valid number" }
    ),
  employmentStatus: z.string().optional(),
  monthlyRentMortgage: z
    .string()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      { message: "Monthly rent/mortgage must be a valid number" }
    ),
  otherMonthlyExpenses: z
    .string()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      { message: "Other monthly expenses must be a valid number" }
    ),
  loanRepayments: z
    .string()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      { message: "Loan repayments must be a valid number" }
    ),
  creditCardDebts: z
    .string()
    .refine(
      (val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      { message: "Credit card debts must be a valid number" }
    ),
  expensesDetails: z.string().optional(),

  // Terms
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Terms and Conditions",
  }),
});

type FormData = z.infer<typeof formSchema>;

const STEPS = [
  {
    id: 1,
    name: "Loan Details",
    description: "Basic loan information",
    icon: FileText,
  },
  {
    id: 2,
    name: "Personal Info",
    description: "Your personal details",
    icon: User,
  },
  {
    id: 3,
    name: "Financial Info",
    description: "Financial information",
    icon: CreditCard,
  },
  {
    id: 4,
    name: "Review",
    description: "Review and submit",
    icon: CheckCircle2,
  },
];

const DRAFT_STORAGE_KEY = "loan-application-draft";

export function PortalMultiStepLoanApplicationForm() {
  const router = useRouter();
  const { isAuthenticated, user } = useCustomerPortal();
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [expandedHelpSections, setExpandedHelpSections] = useState<
    Record<string, boolean>
  >({});

  const submitApplication = useSubmitPortalLoanApplication();
  const { data: companies, isLoading: companiesLoading } = usePortalCompanies();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      loanAmount: "",
      loanPurpose: "",
      loanTerm: "",
      fullName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      address: "",
      annualIncome: "",
      employmentStatus: "",
      monthlyRentMortgage: "",
      otherMonthlyExpenses: "",
      loanRepayments: "",
      creditCardDebts: "",
      expensesDetails: "",
      agreedToTerms: false,
    },
  });

  // Watch companyId to fetch relevant products
  const companyId = form.watch("companyId");
  const { data: loanProducts, isLoading: productsLoading } = usePortalLoanProducts(companyId);

  // Watch loanAmount and loanProductId for validation
  const loanAmount = form.watch("loanAmount");
  const loanProductId = form.watch("loanProductId");

  // Find selected product
  const selectedProduct = loanProducts?.find((p) => p.id === loanProductId);

  // Check if loan amount exceeds maximum loan amount
  const checkLoanAmountExceedsMax = () => {
    if (!selectedProduct || !loanAmount) return false;

    const enteredAmount = parseFloat(loanAmount);
    const maxAmount = selectedProduct.maximumLoanAmount || 0;

    return !isNaN(enteredAmount) && enteredAmount > maxAmount;
  };

  const loanAmountExceedsMax = checkLoanAmountExceedsMax();

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        form.reset(draftData);
        toast.success("Draft loaded successfully", { icon: "📄" });
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, [form]);

  // Auto-save draft
  useEffect(() => {
    const subscription = form.watch((data) => {
      const timer = setTimeout(() => {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
        setLastSaved(new Date());
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Pre-populate personal details from user profile
  useEffect(() => {
    if (user) {
      if (!form.getValues("fullName")) form.setValue("fullName", user.name || "");
      if (!form.getValues("email")) form.setValue("email", user.email || "");
      if (!form.getValues("phoneNumber")) form.setValue("phoneNumber", user.phoneNumber || "");
      // Note: dateOfBirth and address are new in the user entity, so they might be empty
      if (!form.getValues("dateOfBirth") && (user as any).dateOfBirth) {
         form.setValue("dateOfBirth", format(new Date((user as any).dateOfBirth), 'yyyy-MM-dd'));
      }
      if (!form.getValues("address") && (user as any).address) {
         form.setValue("address", (user as any).address || "");
      }
    }
  }, [user, form]);

  // Validate loan amount against maximum loan amount when loanAmount or loanProductId changes
  useEffect(() => {
    if (loanAmount && selectedProduct) {
      const enteredAmount = parseFloat(loanAmount);
      const maxAmount = selectedProduct.maximumLoanAmount || 0;

      if (!isNaN(enteredAmount) && enteredAmount > maxAmount) {
        // You can set a custom error if you want
        // form.setError("loanAmount", {
        //   type: "manual",
        //   message: `Loan amount exceeds maximum allowed amount of $${maxAmount.toLocaleString()}`
        // });
      }
    }
  }, [loanAmount, selectedProduct, form]);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = [
          "companyId",
          "loanProductId",
          "loanAmount",
          "loanPurpose",
          "loanTerm",
        ];
        break;
      case 2:
        fieldsToValidate = [
          "fullName",
          "email",
          "phoneNumber",
          "dateOfBirth",
          "address",
        ];
        break;
      case 3:
        fieldsToValidate = ["annualIncome", "employmentStatus"];
        break;
      case 4:
        fieldsToValidate = ["agreedToTerms"];
        break;
    }

    const result = await form.trigger(fieldsToValidate);

    // Additional validation for step 1: check if loan amount exceeds maximum
    if (step === 1 && result) {
      if (loanAmountExceedsMax) {
        toast.error(
          `Loan amount exceeds maximum allowed amount of ${
            selectedProduct?.maximumLoanAmount?.toLocaleString() || 0
          } FRW`
        );
        return false;
      }
    }

    return result;
  };

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Error message is already shown in validateStep
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSaveDraft = async () => {
    setIsDraftSaving(true);
    try {
      const formData = form.getValues();
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      setLastSaved(new Date());
      toast.success("Draft saved successfully", { icon: "💾" });
    } catch (error) {
      toast.error("Failed to save draft");
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSubmit = async (data: FormData) => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please log in first to submit your loan application", {
        icon: "🔐",
      });
      router.push("/portal/login");
      return;
    }

    if (!data.agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      return;
    }

    // Check if loan amount exceeds maximum
    if (selectedProduct && loanAmountExceedsMax) {
      toast.error(
        `Loan amount exceeds maximum allowed amount of ${
          selectedProduct.maximumLoanAmount?.toLocaleString() || 0
        } FRW`
      );
      return;
    }

    try {
      const selectedProduct = loanProducts?.find(
        (p) => p.id === data.loanProductId
      );

      // ✅ CORRECTED: Match backend DTO exactly with personal details snapshot
      const applicationData = {
        // Required fields
        companyId: data.companyId,
        applicantType: "Customer", // Matches ApplicantType enum
        applicantId: user?.id ?? "",
        loanProductId: data.loanProductId,
        requestedAmount: parseFloat(data.loanAmount),

        // Personal Details Snapshot
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        annualIncome: parseFloat(data.annualIncome || "0"),
        employmentStatus: data.employmentStatus,

        // Optional fields
        remarks: data.loanPurpose,
        applicationDate: new Date().toISOString().split("T")[0],
        repaymentStructure: "FIXED", // Default value
      };

      console.log("Submitting application data:", applicationData);

      await submitApplication.mutateAsync(applicationData);

      // Clear draft after successful submission
      localStorage.removeItem(DRAFT_STORAGE_KEY);

      toast.success("Application submitted successfully!", { icon: "✅" });
      router.push("/portal/loan-applications");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to submit application"
      );
    }
  };

  const progressPercentage = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  // Calculate monthly expenses
  const monthlyExpenses = [
    parseFloat(form.watch("monthlyRentMortgage") || "0"),
    parseFloat(form.watch("otherMonthlyExpenses") || "0"),
    parseFloat(form.watch("loanRepayments") || "0"),
    parseFloat(form.watch("creditCardDebts") || "0"),
  ].reduce((sum, val) => sum + val, 0);

  const annualIncome = parseFloat(form.watch("annualIncome") || "0");
  const monthlyIncome = annualIncome / 12;
  const debtToIncomeRatio =
    monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;

  if (companiesLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-4xl w-full mx-auto px-4">
          <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-display text-text-light dark:text-text-dark">
      {/* Main Content */}
      <main className="flex-1 w-full py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-light dark:text-text-dark">
                Loan Application
              </h1>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                Complete the following steps to apply for your loan.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">Progress</span>
                    <span className="text-primary font-bold">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-6 md:px-6">
              <div className="w-full">
                <div className="relative">
                  {/* Background line */}
                  <div
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 w-full h-0.5 bg-border-light dark:bg-border-dark"
                  />
                  {/* Progress line */}
                  <div
                    aria-hidden="true"
                    className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500"
                    style={{
                      width: `${
                        ((currentStep - 1) / (STEPS.length - 1)) * 100
                      }%`,
                    }}
                  />
                  {/* Steps */}
                  <ol className="relative grid grid-cols-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {STEPS.map((step) => {
                      const isActive = currentStep === step.id;
                      const isCompleted = currentStep > step.id;
                      const StepIcon = step.icon;

                      return (
                        <li key={step.id} className="text-center">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                                isActive
                                  ? "bg-primary text-white shadow-lg scale-110"
                                  : isCompleted
                                  ? "bg-secondary text-white"
                                  : "border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <StepIcon
                                  className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-white" : "text-gray-400"
                                  )}
                                />
                              )}
                            </div>
                            <span
                              className={cn(
                                "mt-2 text-xs md:text-sm",
                                isActive
                                  ? "font-bold text-primary"
                                  : isCompleted
                                  ? "font-semibold text-secondary"
                                  : "text-gray-500"
                              )}
                            >
                              {step.name}
                            </span>
                            {step.description && (
                              <span className="mt-1 text-xs text-gray-400 hidden md:block">
                                {step.description}
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>
            {/* Form Card */}
            <div className="bg-white dark:bg-background-dark border border-border-light dark:border-border-dark rounded-xl shadow-sm p-6 md:p-8">
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="flex flex-col gap-8"
              >
                {/* Step 1: Loan Details */}
                {currentStep === 1 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Step Header with Help */}
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold text-gray-900">
                              Loan Details
                            </h2>
                          </div>
                          <p className="text-sm md:text-base text-gray-600 mt-2">
                            Please provide basic information about your loan
                            request. All fields are required.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHelpModal(true)}
                          className="flex items-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Need Help?</span>
                        </Button>
                      </div>

                      {/* Quick Help Card */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              What you'll need:
                            </h3>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Know which company you're applying with
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Decide on the loan product that fits your
                                  needs
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Have an idea of how much you want to borrow
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Know the purpose of your loan</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Company <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Select the lending company you're applying with. This determines which loan products are available."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Select
                          label=""
                          options={
                            companies?.map((c) => ({
                              value: c.id,
                              label: c.name,
                            })) || []
                          }
                          {...form.register("companyId")}
                          error={form.formState.errors.companyId?.message}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Choose the company you have
                          an account with or want to work with.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Loan Product <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content={
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">
                                  Loan Product Types:
                                </p>
                                <ul className="text-xs space-y-1">
                                  <li>
                                    • <strong>Term Loan:</strong> Fixed
                                    repayment schedule
                                  </li>
                                  <li>
                                    • <strong>Secured:</strong> Requires
                                    collateral (lower rates)
                                  </li>
                                  <li>
                                    • <strong>Unsecured:</strong> No collateral
                                    needed (higher rates)
                                  </li>
                                </ul>
                              </div>
                            }
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Select
                          label=""
                          options={
                            loanProducts?.map((p) => ({
                              value: p.id,
                              label: `${
                                p.productName || p.name || "Unnamed Product"
                              } ${p.isTermLoan ? "(Term Loan)" : ""} ${
                                p.requiresCollateral ||
                                p.productType === "Secured"
                                  ? "(Secured)"
                                  : ""
                              }`,
                            })) || []
                          }
                          {...form.register("loanProductId")}
                          error={form.formState.errors.loanProductId?.message}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Compare interest rates and
                          terms. Secured loans typically have lower rates.
                        </p>
                        {selectedProduct && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-blue-800">
                                <p className="font-medium">Product Details:</p>
                                <ul className="mt-1 space-y-0.5">
                                  <li>
                                    Interest Rate:{" "}
                                    {selectedProduct.rateOfInterest}%
                                  </li>
                                  <li>
                                    Maximum amount:{" "}
                                    {selectedProduct.maximumLoanAmount?.toLocaleString() ||
                                      "N/A"}{" "}
                                    FRW
                                  </li>
                                  {selectedProduct.isTermLoan && (
                                    <li>Type: Term Loan</li>
                                  )}
                                  {(selectedProduct.requiresCollateral ||
                                    selectedProduct.productType === "Secured" ||
                                    selectedProduct.isSecuredLoan) && (
                                    <li>Type: Secured Loan</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Loan Amount <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Enter the total amount you want to borrow. Consider your needs and ability to repay."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0  pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="50,000"
                            className="pl-10"
                            {...form.register("loanAmount")}
                            error={
                              loanAmountExceedsMax
                                ? `Loan amount exceeds maximum allowed amount of ${
                                    selectedProduct?.maximumLoanAmount?.toLocaleString() ||
                                    0
                                  } FRW`
                                : form.formState.errors.loanAmount?.message
                            }
                            required
                            helperText="Enter the amount you wish to borrow (numbers only, no commas)"
                          />
                        </div>
                        {loanAmountExceedsMax && selectedProduct && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-800">
                                <p className="font-medium">
                                  Amount Exceeds Limit:
                                </p>
                                <p className="mt-1">
                                  The entered amount (
                                  {parseFloat(
                                    loanAmount || "0"
                                  ).toLocaleString()}{" "}
                                  FRW) exceeds the maximum allowed amount of{" "}
                                  {selectedProduct.maximumLoanAmount?.toLocaleString()}{" "}
                                  FRW for this product.
                                </p>
                                <p className="mt-1 font-medium">
                                  Please enter an amount less than or equal to{" "}
                                  {selectedProduct.maximumLoanAmount?.toLocaleString()}{" "}
                                  FRW.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Only borrow what you need.
                          The monthly payment estimate will update as you type.
                        </p>
                        {form.watch("loanAmount") &&
                          selectedProduct &&
                          !loanAmountExceedsMax && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="text-xs text-green-800">
                                  <p className="font-medium">
                                    Estimated Monthly Payment:
                                  </p>
                                  <p className="mt-1 text-base font-bold">
                                    {(
                                      (parseFloat(
                                        form.watch("loanAmount") || "0"
                                      ) *
                                        (selectedProduct.rateOfInterest /
                                          100 /
                                          12) *
                                        Math.pow(
                                          1 +
                                            selectedProduct.rateOfInterest /
                                              100 /
                                              12,
                                          parseInt(
                                            form.watch("loanTerm") || "12"
                                          )
                                        )) /
                                      (Math.pow(
                                        1 +
                                          selectedProduct.rateOfInterest /
                                            100 /
                                            12,
                                        parseInt(form.watch("loanTerm") || "12")
                                      ) -
                                        1)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    FRW
                                  </p>
                                  <p className="mt-1 text-gray-600">
                                    Based on {form.watch("loanTerm") || "12"}{" "}
                                    months at {selectedProduct.rateOfInterest}%
                                    APR
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Loan Purpose <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Describe what you plan to use the loan for. Be specific - this helps with approval."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Input
                          label=""
                          type="text"
                          placeholder="e.g., Home Renovation, Business Expansion, Debt Consolidation, Medical Expenses"
                          {...form.register("loanPurpose")}
                          error={form.formState.errors.loanPurpose?.message}
                          required
                          helperText="Briefly describe the purpose of the loan (minimum 5 characters)"
                        />
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Common purposes:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Home Renovation",
                              "Business Expansion",
                              "Debt Consolidation",
                              "Medical Expenses",
                              "Education",
                              "Vehicle Purchase",
                            ].map((purpose) => (
                              <button
                                key={purpose}
                                type="button"
                                onClick={() =>
                                  form.setValue("loanPurpose", purpose)
                                }
                                className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors"
                              >
                                {purpose}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Loan Term <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content={
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">
                                  Loan Term Explained:
                                </p>
                                <p className="text-xs mb-2">
                                  The loan term is how long you have to repay
                                  the loan.
                                </p>
                                <ul className="text-xs space-y-1">
                                  <li>
                                    • <strong>Shorter term:</strong> Higher
                                    monthly payments, less interest
                                  </li>
                                  <li>
                                    • <strong>Longer term:</strong> Lower
                                    monthly payments, more interest
                                  </li>
                                </ul>
                              </div>
                            }
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Select
                          label=""
                          options={[
                            { value: "12", label: "1 year (12 months)" },
                            { value: "24", label: "2 years (24 months)" },
                            { value: "36", label: "3 years (36 months)" },
                            { value: "48", label: "4 years (48 months)" },
                            { value: "60", label: "5 years (60 months)" },
                            { value: "72", label: "6 years (72 months)" },
                            { value: "84", label: "7 years (84 months)" },
                            { value: "96", label: "8 years (96 months)" },
                            { value: "108", label: "9 years (108 months)" },
                            { value: "120", label: "10 years (120 months)" },
                          ]}
                          {...form.register("loanTerm")}
                          error={form.formState.errors.loanTerm?.message}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Choose a term that fits your
                          budget. The monthly payment estimate updates
                          automatically.
                        </p>
                      </div>
                    </div>

                    {/* Loan Details Summary - shown on Step 1 */}
                    {form.watch("companyId") && selectedProduct && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Selected Loan Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Company
                              </span>
                              <span className="font-semibold text-gray-900">
                                {companies?.find(
                                  (c) => c.id === form.watch("companyId")
                                )?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Loan Product
                              </span>
                              <span className="font-semibold text-gray-900">
                                {selectedProduct?.productName ||
                                  selectedProduct?.name ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Loan Amount
                              </span>
                              <span
                                className={`font-semibold ${
                                  loanAmountExceedsMax
                                    ? "text-red-600"
                                    : "text-gray-900"
                                } text-lg`}
                              >
                                {parseFloat(
                                  form.watch("loanAmount") || "0"
                                ).toLocaleString()}{" "}
                                FRW
                                {loanAmountExceedsMax && (
                                  <span className="ml-2 text-xs font-normal text-red-500">
                                    (Exceeds limit)
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Loan Term
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("loanTerm")
                                  ? `${Math.floor(
                                      parseInt(form.watch("loanTerm")) / 12
                                    )} years (${form.watch("loanTerm")} months)`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Interest Rate
                              </span>
                              <span className="font-semibold text-gray-900">
                                {selectedProduct?.rateOfInterest
                                  ? `${selectedProduct.rateOfInterest}%`
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Maximum Allowed Amount
                              </span>
                              <span className="font-semibold text-gray-900">
                                {selectedProduct?.maximumLoanAmount?.toLocaleString() ||
                                  "N/A"}{" "}
                                FRW
                              </span>
                            </div>
                            {form.watch("loanAmount") &&
                              selectedProduct &&
                              form.watch("loanTerm") &&
                              !loanAmountExceedsMax && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-gray-500 font-medium">
                                    Estimated Monthly Payment
                                  </span>
                                  <span className="font-semibold text-gray-900 text-lg">
                                    {(
                                      (parseFloat(
                                        form.watch("loanAmount") || "0"
                                      ) *
                                        (selectedProduct.rateOfInterest /
                                          100 /
                                          12) *
                                        Math.pow(
                                          1 +
                                            selectedProduct.rateOfInterest /
                                              100 /
                                              12,
                                          parseInt(
                                            form.watch("loanTerm") || "12"
                                          )
                                        )) /
                                      (Math.pow(
                                        1 +
                                          selectedProduct.rateOfInterest /
                                            100 /
                                            12,
                                        parseInt(form.watch("loanTerm") || "12")
                                      ) -
                                        1)
                                    ).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}{" "}
                                    FRW
                                  </span>
                                </div>
                              )}
                            {selectedProduct?.shortDescription && (
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <span className="text-gray-500 font-medium">
                                  Product Description
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {selectedProduct.shortDescription}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Personal Info */}
                {currentStep === 2 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <User className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold text-gray-900">
                              Personal Information
                            </h2>
                          </div>
                          <p className="text-sm md:text-base text-gray-600 mt-2">
                            Please provide your personal details. This
                            information is kept confidential and secure.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHelpModal(true)}
                          className="flex items-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Need Help?</span>
                        </Button>
                      </div>

                      {/* Quick Help Card */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              Your Privacy Matters
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                              All information is encrypted and securely stored.
                              We only use this data to process your loan
                              application.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Use your legal name as it appears on your ID
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Provide an email you check regularly
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Include complete address with ZIP code
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Enter your full legal name exactly as it appears on your government-issued ID (driver's license, passport, etc.)"
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Input
                          label=""
                          type="text"
                          placeholder="John Michael Doe"
                          {...form.register("fullName")}
                          error={form.formState.errors.fullName?.message}
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Use your complete legal name,
                          including middle name if applicable.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Email Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="We'll send application updates, approval notifications, and important loan information to this email."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Input
                          label=""
                          type="email"
                          placeholder="john.doe@example.com"
                          {...form.register("email")}
                          error={form.formState.errors.email?.message}
                          required
                          helperText="We'll use this to send you updates and notifications"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Use an email you check
                          regularly. Check your spam folder if you don't receive
                          emails.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="We may call you to verify information or discuss your application. Include country code for international numbers."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Input
                          label=""
                          type="tel"
                          placeholder="+1 (123) 456-7890"
                          {...form.register("phoneNumber")}
                          error={form.formState.errors.phoneNumber?.message}
                          required
                          helperText="Include country code if international (e.g., +1 for USA)"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Format: +1 (123) 456-7890 or
                          123-456-7890. Minimum 10 digits required.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Date of Birth{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="You must be at least 18 years old to apply for a loan. We use this to verify your identity and age."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Input
                          label=""
                          type="date"
                          {...form.register("dateOfBirth")}
                          error={form.formState.errors.dateOfBirth?.message}
                          required
                          max={
                            new Date(
                              new Date().setFullYear(
                                new Date().getFullYear() - 18
                              )
                            )
                              .toISOString()
                              .split("T")[0]
                          }
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Must be 18 years or older.
                          Use the format: MM/DD/YYYY
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Complete Address{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Enter your complete residential address including street, city, state, and ZIP code. This must match your ID."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <textarea
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                            form.formState.errors.address
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300",
                            "min-h-[100px] resize-y"
                          )}
                          placeholder="123 Main Street, Apartment 4B&#10;Anytown, State 12345"
                          {...form.register("address")}
                          required
                        />
                        {form.formState.errors.address && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            {form.formState.errors.address.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Include street address,
                          apartment/unit number (if applicable), city, state,
                          and ZIP code. Minimum 10 characters.
                        </p>
                        <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Example format:
                          </p>
                          <p className="text-xs text-gray-600 font-mono">
                            123 Main Street, Apt 4B
                            <br />
                            Anytown, CA 12345
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info Summary - shown on Step 2 */}
                    {(form.watch("fullName") ||
                      form.watch("email") ||
                      form.watch("phoneNumber")) && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Personal Details Summary
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Full Name
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("fullName") || "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Email Address
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("email") || "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Phone Number
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("phoneNumber") || "N/A"}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Date of Birth
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("dateOfBirth")
                                  ? new Date(
                                      form.watch("dateOfBirth")
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="md:col-span-2 flex flex-col gap-1">
                              <span className="text-gray-500 font-medium">
                                Address
                              </span>
                              <span className="font-semibold text-gray-900">
                                {form.watch("address") || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Financial Info */}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-6 h-6 text-primary" />
                            <h2 className="text-2xl font-bold text-gray-900">
                              Financial Information
                            </h2>
                          </div>
                          <p className="text-sm md:text-base text-gray-600 mt-2">
                            Please provide your financial details. This helps us
                            assess your loan eligibility and determine the best
                            terms for you.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHelpModal(true)}
                          className="flex items-center gap-2"
                        >
                          <HelpCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Need Help?</span>
                        </Button>
                      </div>

                      {/* Quick Help Card */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              Why We Need This Information
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                              We use your financial information to determine
                              your ability to repay the loan and offer you the
                              best interest rates.
                            </p>
                            <ul className="space-y-1 text-sm text-gray-700">
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Use your gross annual income (before taxes)
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Include all sources of income (salary,
                                  freelance, investments)
                                </span>
                              </li>
                              <li className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>
                                  Be accurate - we may verify this information
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Annual Income{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content={
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">
                                  Annual Income:
                                </p>
                                <p className="text-xs mb-2">
                                  Your total income from all sources in one
                                  year, before taxes.
                                </p>
                                <p className="text-xs font-medium">Include:</p>
                                <ul className="text-xs space-y-1 mt-1">
                                  <li>• Salary/wages</li>
                                  <li>• Freelance income</li>
                                  <li>• Investment returns</li>
                                  <li>• Rental income</li>
                                  <li>• Other regular income</li>
                                </ul>
                              </div>
                            }
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="85,000"
                            className="pl-10"
                            {...form.register("annualIncome")}
                            error={form.formState.errors.annualIncome?.message}
                            required
                            helperText="Your total annual income before taxes (gross income)"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Use your gross annual income
                          (before deductions). Include all income sources.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Employment Status{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <Tooltip
                            content="Select your current employment situation. This helps us understand your income stability."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <Select
                          label=""
                          options={[
                            { value: "Full-time", label: "Full-time Employee" },
                            { value: "Part-time", label: "Part-time Employee" },
                            { value: "Self-employed", label: "Self-employed" },
                            { value: "Contractor", label: "Contractor" },
                            { value: "Retired", label: "Retired" },
                            { value: "Unemployed", label: "Unemployed" },
                          ]}
                          {...form.register("employmentStatus")}
                          error={
                            form.formState.errors.employmentStatus?.message
                          }
                          required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Select the option that best
                          describes your current employment situation.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Monthly Rent/Mortgage
                          </label>
                          <Tooltip
                            content="Enter your total monthly housing payment including rent or mortgage principal + interest + property taxes + insurance."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="1,500"
                            className="pl-10"
                            {...form.register("monthlyRentMortgage")}
                            error={
                              form.formState.errors.monthlyRentMortgage?.message
                            }
                            helperText="Your total monthly housing payment (rent or mortgage)"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Include rent OR mortgage
                          payment. If you own your home outright, enter $0.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Existing Loan Repayments
                          </label>
                          <Tooltip
                            content="Total of all monthly payments you make on other loans (car loans, student loans, personal loans, etc.)"
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="500"
                            className="pl-10"
                            {...form.register("loanRepayments")}
                            error={
                              form.formState.errors.loanRepayments?.message
                            }
                            helperText="Total monthly payments on other loans"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Add up all your monthly loan
                          payments. If you have no other loans, enter $0.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Credit Card Minimum Payments
                          </label>
                          <Tooltip
                            content="Enter the total minimum monthly payments required on all your credit cards. Not the total balance, just the minimum payments."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="200"
                            className="pl-10"
                            {...form.register("creditCardDebts")}
                            error={
                              form.formState.errors.creditCardDebts?.message
                            }
                            helperText="Minimum monthly credit card payments (not total balance)"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Use minimum payments, not
                          total balances. If you pay off cards monthly, enter
                          $0.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Other Monthly Expenses
                          </label>
                          <Tooltip
                            content="Include utilities, insurance, subscriptions, groceries, transportation, and other regular monthly expenses."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <Input
                            label=""
                            type="number"
                            placeholder="300"
                            className="pl-10"
                            {...form.register("otherMonthlyExpenses")}
                            error={
                              form.formState.errors.otherMonthlyExpenses
                                ?.message
                            }
                            helperText="Utilities, insurance, subscriptions, groceries, etc."
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> Estimate your regular monthly
                          expenses. You can add details in the box below.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Details for Other Expenses (Optional)
                          </label>
                          <Tooltip
                            content="Break down your other monthly expenses here. This helps us better understand your financial situation."
                            position="top"
                          >
                            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <textarea
                          className={cn(
                            "w-full px-3 py-2 border border-gray-300 rounded-lg transition-colors",
                            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                            "min-h-[100px] resize-y"
                          )}
                          placeholder="e.g., Utilities: $150, Insurance: $100, Subscriptions: $50, Groceries: $400"
                          {...form.register("expensesDetails")}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          💡 <strong>Tip:</strong> List your expenses for better
                          clarity. Example: "Utilities: $150, Insurance: $100"
                        </p>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    {annualIncome > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            Your Financial Summary
                          </h3>
                          <Tooltip
                            content={
                              <div className="max-w-xs">
                                <p className="font-semibold mb-1">
                                  Understanding Your Summary:
                                </p>
                                <ul className="text-xs space-y-1 mt-1">
                                  <li>
                                    • <strong>Debt-to-Income:</strong> Lower is
                                    better. Under 36% is ideal.
                                  </li>
                                  <li>
                                    • <strong>Disposable Income:</strong> Money
                                    available after expenses.
                                  </li>
                                  <li>
                                    • <strong>Monthly Income:</strong> Your
                                    income divided by 12.
                                  </li>
                                </ul>
                              </div>
                            }
                            position="left"
                          >
                            <HelpCircle className="w-5 h-5 text-gray-400 hover:text-primary cursor-help" />
                          </Tooltip>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Monthly Income
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                              {monthlyIncome.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              FRW
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Monthly Expenses
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                              {monthlyExpenses.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              FRW
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Debt-to-Income Ratio
                            </p>
                            <p
                              className={cn(
                                "text-xl font-bold",
                                debtToIncomeRatio > 43
                                  ? "text-red-600"
                                  : debtToIncomeRatio > 36
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              )}
                            >
                              {debtToIncomeRatio.toFixed(1)}%
                            </p>
                            <p className="text-xs mt-1 text-gray-500">
                              {debtToIncomeRatio > 43
                                ? "High - May affect approval"
                                : debtToIncomeRatio > 36
                                ? "Moderate"
                                : "Good"}
                            </p>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-blue-100">
                            <p className="text-xs text-gray-600 mb-1">
                              Disposable Income
                            </p>
                            <p className="text-xl font-bold text-gray-900">
                              {(monthlyIncome - monthlyExpenses).toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}{" "}
                              FRW
                            </p>
                          </div>
                        </div>
                        {debtToIncomeRatio > 36 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-yellow-800">
                                <p className="font-medium">
                                  Debt-to-Income Ratio Notice:
                                </p>
                                <p className="mt-1">
                                  Your debt-to-income ratio is{" "}
                                  {debtToIncomeRatio.toFixed(1)}%. Lenders
                                  typically prefer ratios under 36%. Consider
                                  paying down existing debts to improve your
                                  approval chances.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Review */}
                {currentStep === 4 && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="border-b border-gray-200 pb-6">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">
                          Review Your Application
                        </h2>
                      </div>
                      <p className="text-sm md:text-base text-gray-600 mt-2">
                        Please review all information carefully before
                        submitting. You can edit any section by clicking the
                        Edit button.
                      </p>
                    </div>

                    {/* Application Summary Card */}
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-white border-2 border-primary/20 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Application Summary
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Loan Amount
                          </p>
                          <p
                            className={`text-2xl font-bold ${
                              loanAmountExceedsMax
                                ? "text-red-600"
                                : "text-gray-900"
                            }`}
                          >
                            {parseFloat(
                              form.watch("loanAmount") || "0"
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            FRW
                            {loanAmountExceedsMax && (
                              <span className="block text-xs font-normal text-red-500 mt-1">
                                (Exceeds limit)
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Loan Term
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {form.watch("loanTerm")
                              ? `${Math.floor(
                                  parseInt(form.watch("loanTerm")) / 12
                                )} years`
                              : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Interest Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {selectedProduct?.rateOfInterest || "N/A"}%
                          </p>
                        </div>
                      </div>
                      {loanAmountExceedsMax && selectedProduct && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-red-800">
                              <p className="font-medium">
                                Loan Amount Exceeds Maximum Limit:
                              </p>
                              <p className="mt-1">
                                Your loan amount (
                                {parseFloat(
                                  form.watch("loanAmount") || "0"
                                ).toLocaleString()}{" "}
                                FRW) exceeds the maximum allowed amount of{" "}
                                {selectedProduct.maximumLoanAmount?.toLocaleString()}{" "}
                                FRW for this product.
                              </p>
                              <p className="mt-1 font-medium">
                                Please go back to Step 1 and adjust your loan
                                amount to continue.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      {form.watch("loanAmount") &&
                        selectedProduct &&
                        form.watch("loanTerm") &&
                        !loanAmountExceedsMax && (
                          <div className="mt-4 pt-4 border-t border-primary/20">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-700">
                                Estimated Monthly Payment
                              </p>
                              <p className="text-xl font-bold text-primary">
                                {(
                                  (parseFloat(form.watch("loanAmount") || "0") *
                                    (selectedProduct.rateOfInterest /
                                      100 /
                                      12) *
                                    Math.pow(
                                      1 +
                                        selectedProduct.rateOfInterest /
                                          100 /
                                          12,
                                      parseInt(form.watch("loanTerm") || "12")
                                    )) /
                                  (Math.pow(
                                    1 +
                                      selectedProduct.rateOfInterest / 100 / 12,
                                    parseInt(form.watch("loanTerm") || "12")
                                  ) -
                                    1)
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                FRW
                              </p>
                            </div>
                          </div>
                        )}
                    </div>

                    <div className="pt-2 space-y-6">
                      {/* Loan Details Review */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Loan Details
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(1)}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Company
                            </span>
                            <span className="font-semibold text-gray-900">
                              {companies?.find(
                                (c) => c.id === form.watch("companyId")
                              )?.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Loan Product
                            </span>
                            <span className="font-semibold text-gray-900">
                              {selectedProduct?.productName ||
                                selectedProduct?.name ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Loan Amount
                            </span>
                            <span
                              className={`font-semibold ${
                                loanAmountExceedsMax
                                  ? "text-red-600"
                                  : "text-gray-900"
                              } text-lg`}
                            >
                              {parseFloat(
                                form.watch("loanAmount") || "0"
                              ).toLocaleString()}{" "}
                              FRW
                              {loanAmountExceedsMax && (
                                <span className="ml-2 text-xs font-normal text-red-500">
                                  (Exceeds limit)
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Loan Purpose
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("loanPurpose") || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 md:col-span-2">
                            <span className="text-gray-500 font-medium">
                              Loan Term
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("loanTerm")
                                ? `${Math.floor(
                                    parseInt(form.watch("loanTerm")) / 12
                                  )} years (${form.watch("loanTerm")} months)`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Maximum Allowed Amount
                            </span>
                            <span className="font-semibold text-gray-900">
                              {selectedProduct?.maximumLoanAmount?.toLocaleString() ||
                                "N/A"}{" "}
                              FRW
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Personal Info Review */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Personal Information
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(2)}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Full Name
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("fullName") || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Email Address
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("email") || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Phone Number
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("phoneNumber") || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Date of Birth
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("dateOfBirth")
                                ? new Date(
                                    form.watch("dateOfBirth")
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                          <div className="md:col-span-2 flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Address
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("address") || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Info Review */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-600" />
                            Financial Information
                          </h3>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentStep(3)}
                          >
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 md:p-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Annual Income
                            </span>
                            <span className="font-semibold text-gray-900">
                              {parseFloat(
                                form.watch("annualIncome") || "0"
                              ).toLocaleString()}{" "}
                              FRW
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Employment Status
                            </span>
                            <span className="font-semibold text-gray-900">
                              {form.watch("employmentStatus") || "N/A"}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Monthly Rent/Mortgage
                            </span>
                            <span className="font-semibold text-gray-900">
                              {parseFloat(
                                form.watch("monthlyRentMortgage") || "0"
                              ).toLocaleString()}{" "}
                              FRW
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-500 font-medium">
                              Other Monthly Expenses
                            </span>
                            <span className="font-semibold text-gray-900">
                              {parseFloat(
                                form.watch("otherMonthlyExpenses") || "0"
                              ).toLocaleString()}{" "}
                              FRW
                            </span>
                          </div>
                          {monthlyExpenses > 0 && (
                            <div className="md:col-span-2 flex flex-col gap-1 pt-2 border-t border-gray-200">
                              <span className="text-gray-500 font-medium">
                                Total Monthly Expenses
                              </span>
                              <span className="font-semibold text-gray-900 text-lg">
                                {monthlyExpenses.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                FRW
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="space-y-4 pt-6 border-t border-gray-200">
                      <div className="relative flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex h-6 items-center pt-0.5">
                          <input
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
                            id="terms-and-conditions"
                            type="checkbox"
                            {...form.register("agreedToTerms")}
                          />
                        </div>
                        <div className="text-sm leading-6">
                          <label
                            className="font-medium text-gray-900 cursor-pointer"
                            htmlFor="terms-and-conditions"
                          >
                            I have read and agree to the{" "}
                            <Link
                              href="/terms"
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Terms and Conditions
                            </Link>{" "}
                            and{" "}
                            <Link
                              href="/privacy"
                              className="text-blue-600 hover:underline font-semibold"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </label>
                          {form.formState.errors.agreedToTerms && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {form.formState.errors.agreedToTerms.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="w-full sm:w-auto flex  items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto ml-auto">
                    {currentStep < STEPS.length ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={loanAmountExceedsMax}
                        className="w-full sm:w-auto min-w-[140px] flex  items-center"
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={
                          submitApplication.isPending ||
                          !form.watch("agreedToTerms") ||
                          loanAmountExceedsMax
                        }
                        isLoading={submitApplication.isPending}
                        className="w-full sm:w-auto min-w-[180px] flex items-center"
                      >
                        {submitApplication.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </div>
            {/* Footer */}
            <div className="text-center text-xs md:text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2 pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>
                  Your information is encrypted and securely transmitted.
                </span>
              </div>
              <Link
                href="/privacy"
                className="text-blue-600 hover:underline font-medium"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Comprehensive Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        currentStep={currentStep}
        expandedSections={expandedHelpSections}
        onToggleSection={(section) => {
          setExpandedHelpSections((prev) => ({
            ...prev,
            [section]: !prev[section],
          }));
        }}
      />
    </div>
  );
}

// Help Modal Component
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
}

function HelpModal({
  isOpen,
  onClose,
  currentStep,
  expandedSections,
  onToggleSection,
}: HelpModalProps) {
  const helpSections = [
    {
      id: "step1",
      title: "Step 1: Loan Details",
      icon: FileText,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Company Selection
            </h4>
            <p className="text-sm text-gray-700">
              Choose the lending company you want to work with. Each company
              offers different loan products and terms.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Loan Product</h4>
            <p className="text-sm text-gray-700 mb-2">
              Select a loan product that matches your needs:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>
                • <strong>Term Loan:</strong> Fixed repayment schedule over a
                set period
              </li>
              <li>
                • <strong>Secured Loan:</strong> Requires collateral (property,
                vehicle, etc.) - usually lower interest rates
              </li>
              <li>
                • <strong>Unsecured Loan:</strong> No collateral required -
                usually higher interest rates
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Loan Amount</h4>
            <p className="text-sm text-gray-700">
              Enter the amount you need. Consider your actual needs and ability
              to repay. The monthly payment estimate updates automatically.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Loan Purpose</h4>
            <p className="text-sm text-gray-700">
              Be specific about what you'll use the loan for. Common purposes
              include home renovation, debt consolidation, business expansion,
              medical expenses, education, or vehicle purchase.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Loan Term</h4>
            <p className="text-sm text-gray-700 mb-2">
              Choose how long you want to repay the loan:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>
                • <strong>Shorter terms (1-3 years):</strong> Higher monthly
                payments but less total interest
              </li>
              <li>
                • <strong>Longer terms (5-10 years):</strong> Lower monthly
                payments but more total interest
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "step2",
      title: "Step 2: Personal Information",
      icon: User,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Full Name</h4>
            <p className="text-sm text-gray-700">
              Use your complete legal name exactly as it appears on your
              government-issued ID (driver's license, passport, etc.). Include
              your middle name if it's on your ID.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Email Address</h4>
            <p className="text-sm text-gray-700">
              We'll send application updates, approval notifications, and
              important loan information to this email. Make sure it's an email
              you check regularly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Phone Number</h4>
            <p className="text-sm text-gray-700">
              We may call you to verify information or discuss your application.
              Include the country code for international numbers (e.g., +1 for
              USA).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Date of Birth</h4>
            <p className="text-sm text-gray-700">
              You must be at least 18 years old to apply for a loan. We use this
              to verify your identity and age eligibility.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Complete Address
            </h4>
            <p className="text-sm text-gray-700">
              Enter your full residential address including street,
              apartment/unit number (if applicable), city, state, and ZIP code.
              This must match the address on your ID.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "step3",
      title: "Step 3: Financial Information",
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Annual Income</h4>
            <p className="text-sm text-gray-700 mb-2">
              Enter your total income from all sources in one year, before taxes
              (gross income). Include:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Salary or wages</li>
              <li>• Freelance or contract work</li>
              <li>• Investment returns</li>
              <li>• Rental income</li>
              <li>• Any other regular income sources</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Employment Status
            </h4>
            <p className="text-sm text-gray-700">
              Select the option that best describes your current employment
              situation. This helps us understand your income stability.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Monthly Expenses
            </h4>
            <p className="text-sm text-gray-700 mb-2">
              Provide accurate information about your monthly expenses:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>
                • <strong>Rent/Mortgage:</strong> Your total monthly housing
                payment
              </li>
              <li>
                • <strong>Loan Repayments:</strong> Total of all other loan
                payments
              </li>
              <li>
                • <strong>Credit Card Payments:</strong> Minimum payments (not
                total balance)
              </li>
              <li>
                • <strong>Other Expenses:</strong> Utilities, insurance,
                groceries, etc.
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Debt-to-Income Ratio
            </h4>
            <p className="text-sm text-gray-700">
              This is calculated automatically. It shows what percentage of your
              income goes to debt payments. Lenders typically prefer ratios
              under 36%. Lower is better!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "step4",
      title: "Step 4: Review & Submit",
      icon: CheckCircle2,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Review Carefully
            </h4>
            <p className="text-sm text-gray-700">
              Review all information carefully before submitting. You can click
              "Edit" on any section to go back and make changes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Application Summary
            </h4>
            <p className="text-sm text-gray-700">
              The summary card shows your loan amount, term, interest rate, and
              estimated monthly payment. Make sure these are correct.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Terms & Conditions
            </h4>
            <p className="text-sm text-gray-700">
              You must agree to the Terms and Conditions and Privacy Policy
              before submitting. Read them carefully to understand your rights
              and obligations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              After Submission
            </h4>
            <p className="text-sm text-gray-700">
              After submitting, you'll receive a confirmation email. Our team
              will review your application and contact you within 1-2 business
              days.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "general",
      title: "General Tips",
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Save Your Progress
            </h4>
            <p className="text-sm text-gray-700">
              Use the "Save Progress" button in the header to save your work.
              Your draft is automatically saved every 2 seconds, but you can
              manually save anytime.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Required Fields
            </h4>
            <p className="text-sm text-gray-700">
              Fields marked with a red asterisk (*) are required. You must fill
              them out before proceeding to the next step.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Getting Help</h4>
            <p className="text-sm text-gray-700">
              Click the help icon (?) next to any field for detailed
              explanations. You can also click "Need Help?" in the header for
              comprehensive guidance.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Data Security</h4>
            <p className="text-sm text-gray-700">
              All your information is encrypted and securely stored. We only use
              this data to process your loan application and never share it with
              third parties without your consent.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Application Help & Guidance"
      size="lg"
    >
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Welcome to the Loan Application Guide!
              </h3>
              <p className="text-sm text-gray-700">
                This guide will help you complete your loan application
                successfully. Click on any section below to expand and learn
                more.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {helpSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => onToggleSection(section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        section.id === `step${currentStep}`
                          ? "bg-primary/20 text-primary"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {section.title}
                      </h4>
                      {section.id === `step${currentStep}` && (
                        <p className="text-xs text-primary mt-0.5">
                          Current Step
                        </p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <div className="pt-4">{section.content}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">
                Still Need Help?
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                If you have questions or need assistance, our support team is
                here to help.
              </p>
              <div className="space-y-1 text-sm text-gray-700">
                <p>📧 Email: support@uruti.com</p>
                <p>📞 Phone: 1-800-URUTI (1-800-87884)</p>
                <p>🕐 Hours: Monday-Friday, 9 AM - 6 PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}


