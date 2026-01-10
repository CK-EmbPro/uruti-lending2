'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearch, useSearchSuggestions } from '@/lib/hooks/useSearch';
import { SearchDto, SearchEntityType, SearchResult } from '@/lib/api/search';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Search,
  X,
  FileText,
  Wallet,
  CreditCard,
  Package,
  DollarSign,
  ArrowRight,
  Clock,
  Filter,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface GlobalSearchProps {
  onResultClick?: (result: SearchResult) => void;
}

const entityIcons = {
  [SearchEntityType.LOAN]: Wallet,
  [SearchEntityType.LOAN_APPLICATION]: FileText,
  [SearchEntityType.LOAN_PRODUCT]: Package,
  [SearchEntityType.LOAN_REPAYMENT]: CreditCard,
  [SearchEntityType.LOAN_DISBURSEMENT]: DollarSign,
  [SearchEntityType.CUSTOMER]: FileText,
  [SearchEntityType.ALL]: Search,
};

const entityColors = {
  [SearchEntityType.LOAN]: 'text-blue-600',
  [SearchEntityType.LOAN_APPLICATION]: 'text-green-600',
  [SearchEntityType.LOAN_PRODUCT]: 'text-purple-600',
  [SearchEntityType.LOAN_REPAYMENT]: 'text-orange-600',
  [SearchEntityType.LOAN_DISBURSEMENT]: 'text-indigo-600',
  [SearchEntityType.CUSTOMER]: 'text-gray-600',
  [SearchEntityType.ALL]: 'text-gray-600',
};

export function GlobalSearch({ onResultClick }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<SearchEntityType | ''>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const searchDto: SearchDto = {
    q: query,
    type: entityType || undefined,
    limit: 10,
  };

  const { data: searchResults, isLoading } = useSearch(searchDto, query.length >= 2);
  const { data: suggestions = [] } = useSearchSuggestions(query);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}${entityType ? `&type=${entityType}` : ''}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      // Default navigation
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
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  return (
    <div className="relative flex-1 max-w-2xl">
      {/* Search Input */}
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search loans, applications, products..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
              }
            }}
            onFocus={() => {
              setIsOpen(true);
              setShowSuggestions(true);
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                Recent Searches
              </div>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded flex items-center gap-2"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results Dropdown */}
        {isOpen && query.length >= 2 && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black bg-opacity-25"
              onClick={() => setIsOpen(false)}
            />

            {/* Results Panel */}
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : searchResults && searchResults.results.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  <div className="p-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} found
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(`/search?q=${encodeURIComponent(query)}`);
                          setIsOpen(false);
                        }}
                        className="text-xs"
                      >
                        View all
                      </Button>
                    </div>
                  </div>
                  {searchResults.results.slice(0, 5).map((result) => {
                    const Icon = entityIcons[result.entityType] || FileText;
                    const colorClass = entityColors[result.entityType] || 'text-gray-600';

                    return (
                      <button
                        key={`${result.entityType}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {result.title}
                              </p>
                              <Badge className="text-xs">{result.entityType}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {result.description}
                            </p>
                            {result.highlights.length > 0 && (
                              <div className="text-xs text-gray-500 space-y-1">
                                {result.highlights.slice(0, 2).map((highlight, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3" />
                                    <span>{highlight}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No results found</p>
                  <p className="text-gray-400 text-xs mt-1">Try different keywords</p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

