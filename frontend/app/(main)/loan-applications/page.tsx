"use client";

import { useLoanApplications } from "@/lib/hooks/useLoanApplication";
import { useCompanies } from "@/lib/hooks/useCompany";
import { useLoanProducts } from "@/lib/hooks/useLoanProduct";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { Pagination } from "@/components/ui/Pagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { usePagination } from "@/hooks/usePagination";
import { useSort } from "@/hooks/useSort";
import Link from "next/link";
import {
  Plus,
  FileText,
  Search,
  Filter,
  X,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Download,
  Calendar,
  Building2,
  Percent,
  TrendingDown,
  Activity,
  MoreVertical,
  Zap,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, differenceInDays, differenceInBusinessDays } from "date-fns";

function getStatusVariant(
  status: string
): "success" | "warning" | "error" | "info" | "default" {
  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus === "APPROVED") return "success";
  if (normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED")
    return "error";
  if (normalizedStatus === "SUBMITTED") return "info";
  if (
    normalizedStatus === "UNDER_REVIEW" ||
    normalizedStatus === "UNDER REVIEW"
  )
    return "warning";
  return "default";
}

function getStatusIcon(status: string) {
  const normalizedStatus = status?.toUpperCase();
  if (normalizedStatus === "APPROVED")
    return <CheckCircle className="w-4 h-4" />;
  if (normalizedStatus === "REJECTED" || normalizedStatus === "CANCELLED")
    return <XCircle className="w-4 h-4" />;
  if (normalizedStatus === "SUBMITTED") return <FileText className="w-4 h-4" />;
  if (
    normalizedStatus === "UNDER_REVIEW" ||
    normalizedStatus === "UNDER REVIEW"
  )
    return <Clock className="w-4 h-4" />;
  return <AlertCircle className="w-4 h-4" />;
}

function getApplicationAmount(app: any): number {
  // Try multiple fields in order of preference
  let amount: any = app.requestedAmount;
  if (!amount || amount === null || amount === undefined) {
    amount = app.approvedAmount;
  }
  if (!amount || amount === null || amount === undefined) {
    amount = app.loanAmount;
  }
  if (!amount || amount === null || amount === undefined) {
    return 0;
  }

  // Convert to number if it's a string (decimal fields from DB might be strings)
  if (typeof amount === "string") {
    const cleaned = amount.replace(/,/g, "").trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  if (typeof amount === "number") {
    return isNaN(amount) ? 0 : amount;
  }

  return 0;
}

function formatCompactNumber(num: number): string {
  if (!num || isNaN(num) || num === 0) return "0";
  const value = Number(num);
  if (isNaN(value)) return "0";
  if (value < 1000)
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  if (value < 1000000) {
    const kValue = value / 1000;
    return kValue % 1 === 0 ? `${kValue}K` : `${kValue.toFixed(1)}K`;
  }
  if (value < 1000000000) {
    const mValue = value / 1000000;
    return mValue % 1 === 0 ? `${mValue}M` : `${mValue.toFixed(1)}M`;
  }
  const bValue = value / 1000000000;
  return bValue % 1 === 0 ? `${bValue}B` : `${bValue.toFixed(1)}B`;
}

export default function LoanApplicationsPage() {
  const { data: applicationsResponse, isLoading } = useLoanApplications();
  const { data: companies = [] } = useCompanies();
  const { data: loanProducts = [] } = useLoanProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const applications = applicationsResponse?.data || [];
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const totalAmount = applications.reduce((sum, app) => {
      return sum + getApplicationAmount(app);
    }, 0);
    const approvedCount = applications.filter(
      (app) => app.status === "Approved" || app.status === "APPROVED"
    ).length;
    const pendingCount = applications.filter(
      (app) =>
        app.status === "Submitted" ||
        app.status === "SUBMITTED" ||
        app.status === "Under Review" ||
        app.status === "UNDER_REVIEW" ||
        app.status === "Draft" ||
        app.status === "DRAFT"
    ).length;
    const rejectedCount = applications.filter(
      (app) =>
        app.status === "Rejected" ||
        app.status === "REJECTED" ||
        app.status === "Cancelled" ||
        app.status === "CANCELLED"
    ).length;

    // Calculate approval rate
    const processedCount = approvedCount + rejectedCount;
    const approvalRate =
      processedCount > 0 ? (approvedCount / processedCount) * 100 : 0;

    // Calculate average processing time (for approved/rejected)
    const processedApps = applications.filter(
      (app) =>
        (app.status === "Approved" ||
          app.status === "APPROVED" ||
          app.status === "Rejected" ||
          app.status === "REJECTED") &&
        app.createdAt
    );
    const avgProcessingTime =
      processedApps.length > 0
        ? processedApps.reduce((sum, app) => {
            const created = new Date(app.createdAt);
            const processed =
              app.status === "Approved" || app.status === "APPROVED"
                ? (app as any).approvalDate
                  ? new Date((app as any).approvalDate)
                  : new Date()
                : (app as any).rejectionDate
                ? new Date((app as any).rejectionDate)
                : new Date();
            return sum + differenceInBusinessDays(processed, created);
          }, 0) / processedApps.length
        : 0;

    // Calculate average loan amount
    const avgLoanAmount =
      totalApplications > 0 && totalAmount > 0 && !isNaN(totalAmount)
        ? totalAmount / totalApplications
        : 0;

    // Calculate pending applications age (average days pending)
    const pendingApps = applications.filter(
      (app) =>
        (app.status === "Submitted" ||
          app.status === "SUBMITTED" ||
          app.status === "Under Review" ||
          app.status === "UNDER_REVIEW") &&
        app.createdAt
    );
    const avgPendingAge =
      pendingApps.length > 0
        ? pendingApps.reduce(
            (sum, app) =>
              sum + differenceInDays(new Date(), new Date(app.createdAt)),
            0
          ) / pendingApps.length
        : 0;

    return {
      totalApplications,
      totalAmount,
      approvedCount,
      pendingCount,
      rejectedCount,
      approvalRate,
      avgProcessingTime,
      avgLoanAmount,
      avgPendingAge,
    };
  }, [applications]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    const statuses = Array.from(
      new Set(applications.map((app) => app.status).filter(Boolean))
    ).sort();
    return statuses;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let filtered = applications.filter(
      (app) =>
        (app.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.applicationNumber || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (app.applicantType || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (app.status || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (companies.find((c) => c.id === app.companyId)?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (loanProducts.find((p) => p.id === app.loanProductId)?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (companyFilter !== "all") {
      filtered = filtered.filter((app) => app.companyId === companyFilter);
    }

    if (productFilter !== "all") {
      filtered = filtered.filter((app) => app.loanProductId === productFilter);
    }

    return filtered;
  }, [
    applications,
    searchTerm,
    statusFilter,
    companyFilter,
    productFilter,
    companies,
    loanProducts,
  ]);

  const { sortedData, handleSort, getSortDirection } =
    useSort(filteredApplications);
  const { currentPage, totalPages, paginatedData, goToPage } = usePagination({
    data: sortedData,
    itemsPerPage: 10,
  });

  // Calculate filtered statistics (for display in cards)
  const filteredStats = useMemo(() => {
    const filteredTotalAmount = filteredApplications.reduce((sum, app) => {
      return sum + getApplicationAmount(app);
    }, 0);

    const filteredAvgAmount =
      filteredApplications.length > 0 &&
      filteredTotalAmount > 0 &&
      !isNaN(filteredTotalAmount)
        ? filteredTotalAmount / filteredApplications.length
        : 0;

    return {
      totalAmount: filteredTotalAmount > 0 ? filteredTotalAmount : 0,
      avgAmount: filteredAvgAmount > 0 ? filteredAvgAmount : 0,
    };
  }, [filteredApplications]);

  return (
    <div className="px-4 py-8 md:px-8 lg:px-12 xl:px-20">
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb items={[{ label: "Loan Applications" }]} />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight tracking-tight">
              Loan Applications
            </h1>
            <p className="text-base text-gray-600 mt-2">
              Review, manage, and track all loan applications
            </p>
          </div>
          <Link href="/loan-applications/new">
            <Button className="bg-primary flex justify-between items-center hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all">
              <Plus className="w-5 h-5 mr-2" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Compact Professional Statistics Cards */}
        {!isLoading && applications.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Total Applications */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </p>
                <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {stats.totalApplications}
              </p>
              <p className="text-[10px] text-gray-500">Applications</p>
            </div>

            {/* Total Amount */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </p>
                <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p
                className="text-2xl font-bold text-gray-900 leading-tight mb-1"
                title={`$${(filteredStats.totalAmount || 0).toLocaleString(
                  "en-US",
                  { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                )}`}
              >
                ${formatCompactNumber(filteredStats.totalAmount)}
              </p>
              <p
                className="text-[10px] text-gray-500 truncate"
                title={`Average: $${(
                  filteredStats.avgAmount || 0
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`}
              >
                Avg: ${formatCompactNumber(filteredStats.avgAmount)}
              </p>
            </div>

            {/* Approved */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Approved
                </p>
                <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {stats.approvedCount}
              </p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-gray-500" />
                <p className="text-[10px] text-gray-500">
                  {stats.approvalRate.toFixed(1)}% rate
                </p>
              </div>
            </div>

            {/* Pending */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Pending
                </p>
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {stats.pendingCount}
              </p>
              <p className="text-[10px] text-gray-500">
                {stats.avgPendingAge > 0
                  ? `Avg ${Math.round(stats.avgPendingAge)}d`
                  : "N/A"}
              </p>
            </div>

            {/* Rejected */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Rejected
                </p>
                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {stats.rejectedCount}
              </p>
              <p className="text-[10px] text-gray-500">
                {stats.totalApplications > 0
                  ? (
                      (stats.rejectedCount / stats.totalApplications) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>

            {/* Avg Processing Time */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Processing
                </p>
                <Activity className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-tight mb-1">
                {stats.avgProcessingTime > 0
                  ? Math.round(stats.avgProcessingTime)
                  : "N/A"}
              </p>
              <p className="text-[10px] text-gray-500">Business days</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by application number, applicant type, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap flex items-center justify-between"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {statusFilter !== "all" && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-bold">
                  {filteredApplications.length}
                </span>
              )}
            </Button>
          </div>

          {/* Enhanced Filter Panel */}
          {showFilters && (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setCompanyFilter("all");
                    setProductFilter("all");
                    setShowFilters(false);
                  }}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        statusFilter === "all"
                          ? "bg-primary text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All ({applications.length})
                    </button>
                    {uniqueStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          statusFilter === status
                            ? "bg-primary text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {getStatusIcon(status)}
                        {status} (
                        {
                          applications.filter((app) => app.status === status)
                            .length
                        }
                        )
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Company
                  </label>
                  <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
                  >
                    <option value="all">
                      All Companies ({companies.length})
                    </option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} (
                        {
                          applications.filter(
                            (app) => app.companyId === company.id
                          ).length
                        }
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Loan Product Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Loan Product
                  </label>
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all bg-white"
                  >
                    <option value="all">
                      All Products ({loanProducts.length})
                    </option>
                    {loanProducts.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} (
                        {
                          applications.filter(
                            (app) => app.loanProductId === product.id
                          ).length
                        }
                        )
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Applications Table */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} />
            </div>
          ) : paginatedData && paginatedData.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">
                        Application #
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">
                        Company
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">
                        Product
                      </TableHead>
                      <SortableHeader
                        onSort={() =>
                          handleSort(
                            "applicantType" as keyof (typeof paginatedData)[0]
                          )
                        }
                        sortDirection={getSortDirection(
                          "applicantType" as keyof (typeof paginatedData)[0]
                        )}
                        className="font-semibold text-gray-700 text-xs py-2 px-3"
                      >
                        Applicant
                      </SortableHeader>
                      <SortableHeader
                        onSort={() =>
                          handleSort(
                            "loanAmount" as keyof (typeof paginatedData)[0]
                          )
                        }
                        sortDirection={getSortDirection(
                          "loanAmount" as keyof (typeof paginatedData)[0]
                        )}
                        className="font-semibold text-gray-700 text-xs py-2 px-3"
                      >
                        Amount
                      </SortableHeader>
                      <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">
                        Rate
                      </TableHead>
                      <SortableHeader
                        onSort={() =>
                          handleSort(
                            "status" as keyof (typeof paginatedData)[0]
                          )
                        }
                        sortDirection={getSortDirection(
                          "status" as keyof (typeof paginatedData)[0]
                        )}
                        className="font-semibold text-gray-700 text-xs py-2 px-3"
                      >
                        Status
                      </SortableHeader>
                      <TableHead className="font-semibold text-gray-700 text-xs py-2 px-3">
                        Age
                      </TableHead>
                      <SortableHeader
                        onSort={() =>
                          handleSort(
                            "createdAt" as keyof (typeof paginatedData)[0]
                          )
                        }
                        sortDirection={getSortDirection(
                          "createdAt" as keyof (typeof paginatedData)[0]
                        )}
                        className="font-semibold text-gray-700 text-xs py-2 px-3"
                      >
                        Created
                      </SortableHeader>
                      <TableHead className="text-right font-semibold text-gray-700 text-xs py-2 px-3">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedData.map((app) => {
                      const company = companies.find(
                        (c) => c.id === app.companyId
                      );
                      const product = loanProducts.find(
                        (p) => p.id === app.loanProductId
                      );
                      const daysSinceCreated = app.createdAt
                        ? differenceInDays(new Date(), new Date(app.createdAt))
                        : 0;
                      const isUrgent =
                        daysSinceCreated > 7 &&
                        (app.status === "Submitted" ||
                          app.status === "SUBMITTED" ||
                          app.status === "Under Review" ||
                          app.status === "UNDER_REVIEW");

                      return (
                        <TableRow
                          key={app.id}
                          onClick={() =>
                            (window.location.href = `/loan-applications/${app.id}`)
                          }
                          className={`hover:bg-primary/5 cursor-pointer transition-colors ${
                            isUrgent
                              ? "bg-yellow-50/50 border-l-2 border-l-yellow-400"
                              : ""
                          }`}
                        >
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <div className="flex flex-col min-w-0">
                                <span className="font-mono text-xs font-semibold text-gray-900 truncate">
                                  {app.applicationNumber ||
                                    (app.id
                                      ? `${app.id.slice(0, 8).toUpperCase()}...`
                                      : "N/A")}
                                </span>
                                {isUrgent && (
                                  <span className="text-[10px] text-yellow-600 font-medium flex items-center gap-0.5">
                                    <Zap className="w-2.5 h-2.5" />
                                    Urgent
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span
                                className="text-xs text-gray-900 font-medium truncate max-w-[100px]"
                                title={company?.name}
                              >
                                {company?.name || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Target className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span
                                className="text-xs text-gray-900 font-medium truncate max-w-[100px]"
                                title={product?.name}
                              >
                                {product?.name || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-900 font-medium">
                                {app.applicantType || "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                              <span
                                className="text-xs font-bold text-gray-900"
                                title={`$${getApplicationAmount(
                                  app
                                ).toLocaleString("en-US", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`}
                              >
                                $
                                {formatCompactNumber(getApplicationAmount(app))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <Percent className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-700 font-medium">
                                {app.rateOfInterest
                                  ? `${app.rateOfInterest}%`
                                  : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <Badge
                              variant={getStatusVariant(app.status)}
                              className="flex items-center gap-1 w-fit text-xs py-0.5 px-2"
                            >
                              <span className="scale-75">
                                {getStatusIcon(app.status)}
                              </span>
                              <span className="text-xs">
                                {app.status || "N/A"}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <Clock
                                className={`w-3 h-3 flex-shrink-0 ${
                                  isUrgent ? "text-yellow-600" : "text-gray-400"
                                }`}
                              />
                              <span
                                className={`text-xs font-medium ${
                                  isUrgent ? "text-yellow-600" : "text-gray-600"
                                }`}
                              >
                                {daysSinceCreated}d
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-600">
                                {app.createdAt
                                  ? format(
                                      new Date(app.createdAt),
                                      "MMM d, yyyy"
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 px-3">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/loan-applications/${app.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">View</span>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </tbody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                  />
                </div>
              )}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {paginatedData.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredApplications.length}
                  </span>{" "}
                  applications
                </p>
                <button className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-12">
              <EmptyState
                icon={<FileText className="w-16 h-16 text-gray-400" />}
                title={
                  searchTerm || statusFilter !== "all"
                    ? "No applications found"
                    : "No loan applications yet"
                }
                description={
                  searchTerm || statusFilter !== "all"
                    ? "No applications match your search or filter criteria. Try adjusting your filters or search terms."
                    : "Get started by creating your first loan application to begin the lending process."
                }
                action={
                  !searchTerm && statusFilter === "all"
                    ? {
                        label: "Create New Application",
                        onClick: () =>
                          (window.location.href = "/loan-applications/new"),
                      }
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
