'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchApi, SearchDto, SearchEntityType, SearchResult, SearchResponse } from '@/lib/api/search';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import {
  Search,
  Filter,
  Download,
  X,
  Wallet,
  FileText,
  Package,
  CreditCard,
  DollarSign,
  ArrowRight,
  Save,
  SlidersHorizontal,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AdvancedSearchProps {
  initialQuery?: string;
  initialType?: SearchEntityType;
}

const entityIcons = {
  [SearchEntityType.LOAN]: Wallet,
  [SearchEntityType.LOAN_APPLICATION]: FileText,
  [SearchEntityType.LOAN_PRODUCT]: Package,
  [SearchEntityType.LOAN_REPAYMENT]: CreditCard,
  [SearchEntityType.LOAN_DISBURSEMENT]: DollarSign,
  [SearchEntityType.CUSTOMER]: FileText,
};

const entityColors = {
  [SearchEntityType.LOAN]: 'bg-blue-100 text-blue-700',
  [SearchEntityType.LOAN_APPLICATION]: 'bg-green-100 text-green-700',
  [SearchEntityType.LOAN_PRODUCT]: 'bg-purple-100 text-purple-700',
  [SearchEntityType.LOAN_REPAYMENT]: 'bg-orange-100 text-orange-700',
  [SearchEntityType.LOAN_DISBURSEMENT]: 'bg-indigo-100 text-indigo-700',
  [SearchEntityType.CUSTOMER]: 'bg-gray-100 text-gray-700',
};

export function AdvancedSearch({ initialQuery = '', initialType }: AdvancedSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [entityType, setEntityType] = useState<SearchEntityType | ''>(initialType || '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Advanced filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Build search DTO
  const searchDto: SearchDto = {
    q: query || undefined,
    type: entityType || undefined,
    filters: {
      ...filters,
      ...(statusFilter && { status: statusFilter }),
      ...(minAmount && { minAmount: parseFloat(minAmount) }),
      ...(maxAmount && { maxAmount: parseFloat(maxAmount) }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    },
    sortBy,
    sortOrder,
    page,
    limit,
  };

  // Determine if search should be enabled
  const isSearchEnabled = Boolean(
    query.length >= 2 ||
    Object.keys(filters).length > 0 ||
    statusFilter ||
    minAmount ||
    maxAmount ||
    startDate ||
    endDate
  );

  // Perform search
  const { data: searchResults, isLoading, refetch } = useQuery<SearchResponse>({
    queryKey: ['advancedSearch', searchDto],
    queryFn: () => searchApi.advancedSearch(searchDto),
    enabled: isSearchEnabled,
  });

  const handleSearch = () => {
    setPage(1);
    refetch();
  };

  const handleExport = async () => {
    try {
      const blob = await searchApi.exportSearch(searchDto);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Search results exported successfully');
    } catch (error: any) {
      toast.error('Failed to export search results');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.entityType) {
      case SearchEntityType.LOAN:
        router.push(`/loans/${result.id}`);
        break;
      case SearchEntityType.LOAN_APPLICATION:
        router.push(`/loan-applications/${result.id}`);
        break;
      case SearchEntityType.LOAN_PRODUCT:
        router.push(`/administration?tab=loanProducts&productId=${result.id}`);
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setFilters({});
  };

  const hasActiveFilters = statusFilter || minAmount || maxAmount || startDate || endDate || Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search loans, applications, products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as SearchEntityType)}
              className="w-48"
            >
              <option value="">All Types</option>
              <option value={SearchEntityType.LOAN}>Loans</option>
              <option value={SearchEntityType.LOAN_APPLICATION}>Applications</option>
              <option value={SearchEntityType.LOAN_PRODUCT}>Products</option>
              <option value={SearchEntityType.LOAN_REPAYMENT}>Repayments</option>
              <option value={SearchEntityType.LOAN_DISBURSEMENT}>Disbursements</option>
            </Select>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? 'bg-blue-50' : ''}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                    <option value="Disbursed">Disbursed</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Min Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Sort by:</label>
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-40">
                <option value="relevance">Relevance</option>
                <option value="createdAt">Date Created</option>
                <option value="loanAmount">Amount</option>
              </Select>
            </div>
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'ASC' | 'DESC')}
              className="w-32"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </Select>
            {searchResults && searchResults.total > 0 && (
              <Button variant="outline" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      {isLoading ? (
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </Card>
      ) : searchResults && searchResults.results.length > 0 ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Found {searchResults.total} result{searchResults.total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="space-y-4">
            {searchResults.results.map((result) => {
              const Icon = entityIcons[result.entityType] || FileText;
              const colorClass = entityColors[result.entityType] || 'bg-gray-100 text-gray-700';

              return (
                <Card
                  key={`${result.entityType}-${result.id}`}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {result.title}
                        </h3>
                        <Badge className={colorClass}>{result.entityType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {result.description}
                      </p>
                      {result.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {result.highlights.slice(0, 3).map((highlight, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Relevance: {(result.score * 100).toFixed(0)}%</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>Click to view details</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {searchResults.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={searchResults.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      ) : query.length >= 2 || hasActiveFilters ? (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">No results found</p>
          <p className="text-gray-400 text-sm">Try adjusting your search query or filters</p>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium mb-2">Start searching</p>
          <p className="text-gray-400 text-sm">Enter a search query to find loans, applications, and more</p>
        </Card>
      )}
    </div>
  );
}

