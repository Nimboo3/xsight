'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, getRfmSegmentName, getRfmSegmentColor, formatCurrency } from '@/lib/utils';
import type { RfmDistribution } from '@/hooks/use-api';

// Segment colors mapping
const SEGMENT_COLORS: Record<string, string> = {
  CHAMPIONS: '#10b981',
  LOYAL_CUSTOMERS: '#3b82f6',
  POTENTIAL_LOYALISTS: '#8b5cf6',
  NEW_CUSTOMERS: '#06b6d4',
  PROMISING: '#14b8a6',
  NEED_ATTENTION: '#f59e0b',
  ABOUT_TO_SLEEP: '#ef4444',
  AT_RISK: '#dc2626',
  CANT_LOSE: '#f97316',
  HIBERNATING: '#6b7280',
  LOST: '#374151',
};

interface RfmDistributionChartProps {
  data: RfmDistribution[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export function RfmDistributionChart({
  data,
  isLoading,
  title = 'RFM Segment Distribution',
  description,
}: RfmDistributionChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    name: getRfmSegmentName(item.segment),
    color: SEGMENT_COLORS[item.segment] || '#6b7280',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="font-medium">{data.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Customers: {formatNumber(data.count)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Spent: {formatCurrency(data.totalSpent)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.percentage.toFixed(1)}% of customers
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface RfmPieChartProps {
  data: RfmDistribution[];
  isLoading?: boolean;
  title?: string;
  valueKey?: 'count' | 'totalSpent';
}

export function RfmPieChart({
  data,
  isLoading,
  title = 'Customer Segments',
  valueKey = 'count',
}: RfmPieChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full rounded-full mx-auto max-w-[250px]" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    name: getRfmSegmentName(item.segment),
    value: item[valueKey],
    color: SEGMENT_COLORS[item.segment] || '#6b7280',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  valueKey === 'totalSpent' ? formatCurrency(value) : formatNumber(value)
                }
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface RfmHeatmapProps {
  matrix: Array<{
    recencyScore: number;
    frequencyScore: number;
    monetaryScore: number;
    count: number;
    avgSpent: number;
  }>;
  isLoading?: boolean;
  title?: string;
  onCellClick?: (recency: number, frequency: number, count: number) => void;
}

// Color scale for heatmap - green gradient from light to dark
const getHeatmapColor = (intensity: number): string => {
  // Interpolate from light green to dark green
  const hue = 160; // Green hue
  const saturation = 60 + intensity * 30; // 60-90%
  const lightness = 85 - intensity * 55; // 85-30%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export function RfmHeatmap({ matrix, isLoading, title = 'RFM Score Heatmap', onCellClick }: RfmHeatmapProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Create 5x5 grid for R x F (aggregated across M)
  const heatmapData: { count: number; avgSpent: number }[][] = Array(5)
    .fill(null)
    .map(() => Array(5).fill(null).map(() => ({ count: 0, avgSpent: 0 })));

  matrix.forEach(cell => {
    const r = cell.recencyScore - 1;
    const f = cell.frequencyScore - 1;
    if (r >= 0 && r < 5 && f >= 0 && f < 5) {
      const idx = 4 - r; // Invert R so high recency is at top
      heatmapData[idx][f].count += cell.count;
      // Weighted average for avgSpent
      const existingTotal = heatmapData[idx][f].avgSpent * (heatmapData[idx][f].count - cell.count);
      heatmapData[idx][f].avgSpent = (existingTotal + cell.avgSpent * cell.count) / heatmapData[idx][f].count || 0;
    }
  });

  const maxCount = Math.max(...heatmapData.flat().map(cell => cell.count));
  const totalCustomers = heatmapData.flat().reduce((sum, cell) => sum + cell.count, 0);

  // Labels for the axis
  const recencyLabels = ['Best', '', 'Medium', '', 'Worst'];
  const frequencyLabels = ['Low', '', 'Medium', '', 'High'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Recency (vertical) vs Frequency (horizontal) - Click cells to filter customers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(0.1) }} />
              <span>Few</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(0.5) }} />
              <span>Some</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: getHeatmapColor(0.9) }} />
              <span>Many</span>
            </div>
          </div>

          {/* Heatmap Grid */}
          <div className="relative">
            {/* Y-axis label */}
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-medium text-muted-foreground whitespace-nowrap">
              Recency →
            </div>
            
            {/* X-axis header */}
            <div className="flex items-center gap-1 mb-1 pl-10">
              {[1, 2, 3, 4, 5].map((f, idx) => (
                <div key={f} className="w-14 text-center">
                  <span className="text-xs font-medium">F{f}</span>
                  {frequencyLabels[idx] && (
                    <span className="text-[10px] text-muted-foreground block">{frequencyLabels[idx]}</span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Grid rows */}
            {heatmapData.map((row, rIdx) => (
              <div key={rIdx} className="flex items-center gap-1">
                {/* Y-axis labels */}
                <div className="w-10 text-right pr-1">
                  <span className="text-xs font-medium">R{5 - rIdx}</span>
                  {recencyLabels[rIdx] && (
                    <span className="text-[10px] text-muted-foreground block">{recencyLabels[rIdx]}</span>
                  )}
                </div>
                
                {/* Cells */}
                {row.map((cell, fIdx) => {
                  const intensity = maxCount > 0 ? cell.count / maxCount : 0;
                  const percentage = totalCustomers > 0 ? (cell.count / totalCustomers * 100).toFixed(1) : '0';
                  const isHighlighted = intensity > 0.5;
                  const recencyScore = 5 - rIdx;
                  const frequencyScore = fIdx + 1;
                  
                  return (
                    <button
                      key={fIdx}
                      className="w-14 h-12 rounded-md flex flex-col items-center justify-center text-xs transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                      style={{
                        backgroundColor: cell.count > 0 ? getHeatmapColor(intensity) : 'hsl(var(--muted))',
                        color: isHighlighted ? 'white' : 'inherit',
                      }}
                      title={`R${recencyScore} x F${frequencyScore}
${cell.count} customers (${percentage}%)
Avg spend: ${formatCurrency(cell.avgSpent)}`}
                      onClick={() => onCellClick?.(recencyScore, frequencyScore, cell.count)}
                    >
                      {cell.count > 0 && (
                        <>
                          <span className="font-bold">{formatNumber(cell.count)}</span>
                          <span className={`text-[10px] ${isHighlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {percentage}%
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            
            {/* X-axis label */}
            <div className="text-center text-xs font-medium text-muted-foreground mt-2 pl-10">
              Frequency →
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-muted-foreground">Total Customers</div>
              <div className="font-bold">{formatNumber(totalCustomers)}</div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Active Cells</div>
              <div className="font-bold">{heatmapData.flat().filter(c => c.count > 0).length}/25</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
