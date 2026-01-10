'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ScatterChart,
  Scatter,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

export type ChartType = 'line' | 'area' | 'bar' | 'combo' | 'scatter' | 'pie';

interface AdvancedAnalyticsChartsProps {
  data: any[];
  chartType?: ChartType;
  title?: string;
  xAxisKey?: string;
  yAxisKeys?: string[];
  showComparison?: boolean;
  comparisonData?: any[];
  comparisonLabel?: string;
  onExport?: () => void;
  height?: number;
  colors?: string[];
  showTrend?: boolean;
  threshold?: number;
  thresholdLabel?: string;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AdvancedAnalyticsCharts({
  data,
  chartType = 'line',
  title,
  xAxisKey = 'date',
  yAxisKeys = ['value'],
  showComparison = false,
  comparisonData,
  comparisonLabel = 'Previous Period',
  onExport,
  height = 300,
  colors = DEFAULT_COLORS,
  showTrend = false,
  threshold,
  thresholdLabel,
}: AdvancedAnalyticsChartsProps) {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>(chartType);

  const calculateTrend = (data: any[], key: string) => {
    if (data.length < 2) return null;
    const first = data[0][key] || 0;
    const last = data[data.length - 1][key] || 0;
    const change = last - first;
    const percentChange = first !== 0 ? (change / first) * 100 : 0;
    return { change, percentChange };
  };

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (selectedChartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
            {showComparison && comparisonData && (
              <Line
                type="monotone"
                dataKey="value"
                data={comparisonData}
                stroke="#888888"
                strokeDasharray="5 5"
                name={comparisonLabel}
              />
            )}
            {threshold !== undefined && (
              <ReferenceLine y={threshold} stroke="#ff0000" strokeDasharray="3 3" label={thresholdLabel || 'Threshold'} />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId={index === 0 ? '1' : undefined}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
              />
            ))}
            {threshold !== undefined && (
              <ReferenceLine y={threshold} stroke="#ff0000" strokeDasharray="3 3" label={thresholdLabel || 'Threshold'} />
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            {yAxisKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
            ))}
            {showComparison && comparisonData && (
              <Bar dataKey="value" data={comparisonData} fill="#888888" name={comparisonLabel} />
            )}
            {threshold !== undefined && (
              <ReferenceLine y={threshold} stroke="#ff0000" strokeDasharray="3 3" label={thresholdLabel || 'Threshold'} />
            )}
          </BarChart>
        );

      case 'combo':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            {yAxisKeys.slice(0, 1).map((key, index) => (
              <Area
                key={key}
                yAxisId="left"
                type="monotone"
                dataKey={key}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                stroke={colors[index % colors.length]}
              />
            ))}
            {yAxisKeys.slice(1).map((key, index) => (
              <Bar key={key} yAxisId="right" dataKey={key} fill={colors[(index + 1) % colors.length]} />
            ))}
            {threshold !== undefined && (
              <ReferenceLine yAxisId="left" y={threshold} stroke="#ff0000" strokeDasharray="3 3" label={thresholdLabel || 'Threshold'} />
            )}
          </ComposedChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            {yAxisKeys.map((key, index) => (
              <Scatter
                key={key}
                name={key}
                dataKey={key}
                fill={colors[index % colors.length]}
              />
            ))}
          </ScatterChart>
        );

      case 'pie':
        return (
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        );

      default:
        return null;
    }
  };

  const trend = showTrend && yAxisKeys[0] ? calculateTrend(data, yAxisKeys[0]) : null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>}
          {trend && (
            <div className="flex items-center gap-2 text-sm">
              {trend.percentChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={trend.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {trend.percentChange >= 0 ? '+' : ''}
                {trend.percentChange.toFixed(2)}% change
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedChartType}
            onChange={(e) => setSelectedChartType(e.target.value as ChartType)}
            className="w-32"
          >
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="bar">Bar</option>
            <option value="combo">Combo</option>
            <option value="scatter">Scatter</option>
            <option value="pie">Pie</option>
          </Select>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </Card>
  );
}

