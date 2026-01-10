'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface ChartProps {
  data: any[];
  type: 'bar' | 'line' | 'pie';
  dataKey: string;
  nameKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function Chart({
  data,
  type,
  dataKey,
  nameKey = 'name',
  height = 300,
  showLegend = true,
  showGrid = true,
}: ChartProps) {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill="#3B82F6" />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Line type="monotone" dataKey={dataKey} stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );
      default:
        return null;
    }
  };

  const chartContent = renderChart();
  
  if (!chartContent) {
    return <div className="flex items-center justify-center h-full">Unsupported chart type</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {chartContent}
    </ResponsiveContainer>
  );
}

