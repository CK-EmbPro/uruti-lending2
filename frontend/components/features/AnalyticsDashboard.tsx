'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAnalyticsWebSocket } from '@/lib/hooks/useAnalyticsWebSocket';
import { useTimeSeries } from '@/lib/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Clock,
  AlertTriangle,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  Save,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { GetMetricsDto, Metrics } from '@/lib/api/analytics';

interface AnalyticsDashboardProps {
  companyId?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#00C49F'];

export function AnalyticsDashboard({ companyId }: AnalyticsDashboardProps) {
  const { user, token } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  // Calculate date filters
  const getDateFilters = (): GetMetricsDto => {
    const now = new Date();
    const filters: GetMetricsDto = { companyId: companyId || (user as any)?.companyId };

    switch (selectedDateRange) {
      case 'today':
        filters.fromDate = new Date(now.setHours(0, 0, 0, 0)).toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filters.fromDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filters.fromDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filters.fromDate = yearAgo.toISOString().split('T')[0];
        break;
    }

    return filters;
  };

  const filters = getDateFilters();

  // Use WebSocket for real-time updates
  const { metrics, isConnected, error: wsError } = useAnalyticsWebSocket({
    filters,
    enabled: !!token,
    onMetrics: (data: Metrics) => {
      setLastRefresh(new Date());
    },
  });

  // Get time-series data for trend charts
  const { data: timeSeriesData } = useTimeSeries(
    'totalOutstandingLoans',
    filters,
    'day',
    !!token
  );

  // Layout state for drag-and-drop
  const [layout, setLayout] = useState([
    { i: 'portfolio-health', x: 0, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'operational', x: 6, y: 0, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'financial', x: 0, y: 2, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'customer', x: 6, y: 2, w: 6, h: 2, minW: 3, minH: 2 },
    { i: 'trend-chart', x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 },
    { i: 'pie-chart', x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
  ]);

  const handleLayoutChange = useCallback((newLayout: any) => {
    setLayout(newLayout);
  }, []);

  const saveLayout = useCallback(() => {
    // Save layout to localStorage or backend
    localStorage.setItem('analytics-dashboard-layout', JSON.stringify(layout));
    setIsEditing(false);
  }, [layout]);

  useEffect(() => {
    // Load saved layout
    const savedLayout = localStorage.getItem('analytics-dashboard-layout');
    if (savedLayout) {
      try {
        setLayout(JSON.parse(savedLayout));
      } catch (e) {
        console.error('Failed to load saved layout:', e);
      }
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const portfolioHealthData = [
    { name: 'Current', value: metrics?.totalOutstandingLoans || 0 },
    { name: 'Delinquent', value: (metrics?.totalOutstandingLoans || 0) * ((metrics?.delinquencyRate || 0) / 100) },
  ];

  const operationalData = [
    { name: 'Received', value: metrics?.applicationsReceived || 0 },
    { name: 'Approved', value: metrics?.applicationsApproved || 0 },
    { name: 'Disbursed', value: (metrics?.disbursementVolume || 0) / 1000 },
  ];

  // Prepare time-series data for charts
  const trendData = timeSeriesData?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.value,
  })) || [];

  const MetricCard = ({ title, value, subtitle, icon: Icon }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
  }) => (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <Icon className="h-4 w-4 text-gray-400" />
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </Card>
  );

  if (!metrics && !wsError) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
            {isConnected ? (
              <Badge variant="success" className="bg-green-500 text-white">
                <Wifi className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="error">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time portfolio and operational metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw className="h-4 w-4" />
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          </div>
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <Button
                key={range}
                variant={selectedDateRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {isEditing ? 'Done' : 'Edit Layout'}
            </Button>
            {isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={saveLayout}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            )}
          </div>
        </div>
      </div>

      {wsError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            WebSocket connection failed. Using fallback mode. {wsError}
          </p>
        </div>
      )}

      {/* Drag-and-Drop Grid Layout */}
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={80}
        width={1200}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
      >
        {/* Portfolio Health Metrics */}
        <div key="portfolio-health" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Portfolio Health
            </h2>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Total Outstanding"
              value={formatCurrency(metrics?.totalOutstandingLoans || 0)}
              subtitle="Active loan portfolio"
              icon={DollarSign}
            />
            <MetricCard
              title="Delinquency Rate"
              value={formatPercent(metrics?.delinquencyRate || 0)}
              subtitle="Loans past due"
              icon={AlertTriangle}
            />
            <MetricCard
              title="NPA Ratio"
              value={formatPercent(metrics?.npaRatio || 0)}
              subtitle="Non-performing assets"
              icon={TrendingDown}
            />
            <MetricCard
              title="Collection Efficiency"
              value={formatPercent(metrics?.collectionEfficiency || 0)}
              subtitle="Collection success rate"
              icon={Activity}
            />
          </div>
        </div>

        {/* Operational Metrics */}
        <div key="operational" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Operational Metrics
            </h2>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Applications Received"
              value={metrics?.applicationsReceived || 0}
              subtitle="Total applications"
              icon={FileText}
            />
            <MetricCard
              title="Approval Rate"
              value={formatPercent(metrics?.approvalRate || 0)}
              subtitle={`${metrics?.applicationsApproved || 0} approved`}
              icon={TrendingUp}
            />
            <MetricCard
              title="Avg Processing Time"
              value={`${(metrics?.averageProcessingTime || 0).toFixed(1)} days`}
              subtitle="Application to decision"
              icon={Clock}
            />
            <MetricCard
              title="Disbursement Volume"
              value={formatCurrency(metrics?.disbursementVolume || 0)}
              subtitle="Total disbursed"
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Financial Metrics */}
        <div key="financial" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Financial Metrics
            </h2>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics?.totalRevenue || 0)}
              subtitle="Interest + Fees"
              icon={DollarSign}
            />
            <MetricCard
              title="Interest Income"
              value={formatCurrency(metrics?.interestIncome || 0)}
              subtitle="From loan interest"
              icon={TrendingUp}
            />
            <MetricCard
              title="Fee Income"
              value={formatCurrency(metrics?.feeIncome || 0)}
              subtitle="Processing & other fees"
              icon={DollarSign}
            />
            <MetricCard
              title="Total Write-offs"
              value={formatCurrency(metrics?.totalWriteOffs || 0)}
              subtitle="Charged off loans"
              icon={TrendingDown}
            />
          </div>
        </div>

        {/* Customer Metrics */}
        <div key="customer" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Customer Metrics
            </h2>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricCard
              title="Active Customers"
              value={metrics?.activeCustomers || 0}
              subtitle="With active loans"
              icon={Users}
            />
            <MetricCard
              title="New Customers"
              value={metrics?.newCustomers || 0}
              subtitle="In selected period"
              icon={Users}
            />
            <MetricCard
              title="Average Loan Size"
              value={formatCurrency(metrics?.averageLoanSize || 0)}
              subtitle="Per loan"
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Trend Chart - Line/Area/Bar */}
        <div key="trend-chart" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Portfolio Trends
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Outstanding loans over time
              </p>
            </div>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <div className="mb-4 flex gap-2">
            {(['line', 'area', 'bar'] as const).map((type) => (
              <Button
                key={type}
                variant={chartType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'line' ? (
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            ) : (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div key="pie-chart" className="bg-white dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4 drag-handle cursor-move">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Portfolio Distribution
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Current vs Delinquent
              </p>
            </div>
            {isEditing && <Settings className="h-4 w-4 text-gray-400" />}
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={portfolioHealthData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {portfolioHealthData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </GridLayout>
    </div>
  );
}
