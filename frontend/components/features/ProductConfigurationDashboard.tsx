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
  useCreateProductConfiguration,
  useUpdateProductConfiguration,
  useTestProductConfiguration,
  useActivateProductConfiguration,
  useProductConfigurations,
} from '@/lib/hooks/useAdministration';
import {
  Package,
  Plus,
  Edit,
  Play,
  CheckCircle,
  FileText,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';
import type { ProductStatus, CreateProductConfigurationDto } from '@/lib/api/administration';

export function ProductConfigurationDashboard() {
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [baseInterestRate, setBaseInterestRate] = useState('');
  const [minimumLoanAmount, setMinimumLoanAmount] = useState('');
  const [maximumLoanAmount, setMaximumLoanAmount] = useState('');
  const [testRemarks, setTestRemarks] = useState('');
  const [activateRemarks, setActivateRemarks] = useState('');

  const createProduct = useCreateProductConfiguration();
  const testProduct = useTestProductConfiguration();
  const activateProduct = useActivateProductConfiguration();
  const { data: products, isLoading, refetch } = useProductConfigurations(
    selectedStatus || undefined,
  );

  const handleCreate = () => {
    const dto: CreateProductConfigurationDto = {
      productCode,
      productName,
      companyId,
      baseInterestRate: parseFloat(baseInterestRate),
      minimumLoanAmount: minimumLoanAmount ? parseFloat(minimumLoanAmount) : undefined,
      maximumLoanAmount: maximumLoanAmount ? parseFloat(maximumLoanAmount) : undefined,
    };

    createProduct.mutate(dto, {
      onSuccess: () => {
        setShowCreateModal(false);
        resetForm();
        refetch();
      },
    });
  };

  const handleTest = () => {
    if (!selectedProductId) return;

    testProduct.mutate(
      {
        id: selectedProductId,
        dto: { testRemarks: testRemarks || undefined },
      },
      {
        onSuccess: () => {
          setShowTestModal(false);
          setSelectedProductId(null);
          setTestRemarks('');
          refetch();
        },
      },
    );
  };

  const handleActivate = () => {
    if (!selectedProductId) return;

    activateProduct.mutate(
      {
        id: selectedProductId,
        dto: { remarks: activateRemarks || undefined },
      },
      {
        onSuccess: () => {
          setShowActivateModal(false);
          setSelectedProductId(null);
          setActivateRemarks('');
          refetch();
        },
      },
    );
  };

  const resetForm = () => {
    setProductCode('');
    setProductName('');
    setCompanyId('');
    setBaseInterestRate('');
    setMinimumLoanAmount('');
    setMaximumLoanAmount('');
  };

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Testing':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Inactive':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const draftCount = products?.filter((p) => p.status === 'Draft').length || 0;
  const activeCount = products?.filter((p) => p.status === 'Active').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Product Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">Define loan products with eligibility criteria, pricing, and workflows</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ProductStatus | '')}
            className="w-40"
          >
            <option value="">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Testing">Testing</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
          <Button onClick={() => setShowCreateModal(true)}>
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
                <p className="text-2xl font-bold text-gray-900 mt-1">{products?.length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{draftCount}</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Configurations</h3>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Interest Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loan Amount Range
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">{product.productCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(product.status)}>{product.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.baseInterestRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          ${product.minimumLoanAmount?.toLocaleString() || 'N/A'} - ${product.maximumLoanAmount?.toLocaleString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {product.status === 'Draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setShowTestModal(true);
                              }}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Test
                            </Button>
                          )}
                          {product.status === 'Testing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProductId(product.id);
                                setShowActivateModal(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No product configurations found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Create Product Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create Product Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Code</label>
            <Input
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="PL-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Personal Loan Premium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
            <Input
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="company-123"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Base Interest Rate (%)</label>
            <Input
              type="number"
              step="0.01"
              value={baseInterestRate}
              onChange={(e) => setBaseInterestRate(e.target.value)}
              placeholder="12.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Loan Amount</label>
              <Input
                type="number"
                value={minimumLoanAmount}
                onChange={(e) => setMinimumLoanAmount(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Loan Amount</label>
              <Input
                type="number"
                value={maximumLoanAmount}
                onChange={(e) => setMaximumLoanAmount(e.target.value)}
                placeholder="100000"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!productCode || !productName || !companyId || !baseInterestRate || createProduct.isPending}
            >
              {createProduct.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Test Product Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          setSelectedProductId(null);
          setTestRemarks('');
        }}
        title="Test Product Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Test Remarks</label>
            <Textarea
              value={testRemarks}
              onChange={(e) => setTestRemarks(e.target.value)}
              placeholder="Enter test notes..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTestModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleTest} disabled={testProduct.isPending}>
              {testProduct.isPending ? 'Testing...' : 'Run Tests'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Activate Product Modal */}
      <Modal
        isOpen={showActivateModal}
        onClose={() => {
          setShowActivateModal(false);
          setSelectedProductId(null);
          setActivateRemarks('');
        }}
        title="Activate Product Configuration"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activation Remarks</label>
            <Textarea
              value={activateRemarks}
              onChange={(e) => setActivateRemarks(e.target.value)}
              placeholder="Enter activation notes..."
              rows={4}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowActivateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleActivate} disabled={activateProduct.isPending}>
              {activateProduct.isPending ? 'Activating...' : 'Activate Product'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

