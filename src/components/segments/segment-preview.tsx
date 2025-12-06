'use client';

import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePreviewSegment, type Customer } from '@/hooks/use-api';
import { type SegmentFilters, filtersToApiFormat } from './segment-builder';
import { formatCurrency, getRfmSegmentName, cn } from '@/lib/utils';

interface SegmentPreviewProps {
  filters: SegmentFilters;
  className?: string;
}

export function SegmentPreview({ filters, className }: SegmentPreviewProps) {
  const previewMutation = usePreviewSegment();
  const [lastPreview, setLastPreview] = useState<{ count: number; sample: Customer[] } | null>(null);

  // Debounced preview fetch
  useEffect(() => {
    // Check if filters have any actual conditions
    const hasConditions = filters.groups.some(group => 
      group.filters.some(f => {
        if (f.operator === 'isNull' || f.operator === 'isNotNull') return true;
        return f.value !== '' && f.value !== null && f.value !== undefined;
      })
    );

    if (!hasConditions) {
      setLastPreview(null);
      return;
    }

    const timer = setTimeout(() => {
      const apiFilters = filtersToApiFormat(filters);
      previewMutation.mutate(apiFilters, {
        onSuccess: (data) => {
          setLastPreview(data);
        },
      });
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
  }, [filters]);

  const isLoading = previewMutation.isPending;
  const error = previewMutation.error;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Segment Preview
            </CardTitle>
            <CardDescription>
              Preview customers matching your criteria
            </CardDescription>
          </div>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Count Display */}
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground">Matching customers</div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : lastPreview ? (
            <div className="text-2xl font-bold">{lastPreview.count.toLocaleString()}</div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">—</div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm mb-4">
            {error.message || 'Failed to preview segment'}
          </div>
        )}

        {/* Sample Customers Table */}
        {lastPreview && lastPreview.sample.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Sample Customers</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead>Segment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lastPreview.sample.slice(0, 5).map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {customer.firstName || customer.lastName
                              ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
                              : 'No name'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {customer.email || 'No email'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(customer.totalSpent)}
                      </TableCell>
                      <TableCell className="text-right">
                        {customer.ordersCount}
                      </TableCell>
                      <TableCell>
                        {customer.rfmSegment ? (
                          <Badge variant="outline" className="text-xs">
                            {getRfmSegmentName(customer.rfmSegment)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {lastPreview.count > 5 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Showing 5 of {lastPreview.count.toLocaleString()} customers
              </p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && lastPreview && lastPreview.count === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No customers match these criteria</p>
            <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
          </div>
        )}

        {/* No Filters State */}
        {!isLoading && !lastPreview && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Add filters to preview matching customers</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
