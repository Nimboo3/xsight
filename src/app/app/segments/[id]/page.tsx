'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Trash2, Users, Calendar, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { PageHeader, ErrorState } from '@/components/dashboard';
import { SegmentBuilder, SegmentPreview, type SegmentFilters, filtersToApiFormat, createEmptyFilters } from '@/components/segments';
import { useSegment, useUpdateSegment, useDeleteSegment, useCustomers, type Customer } from '@/hooks/use-api';
import { useShop } from '@/hooks/use-shop';
import { toast } from '@/components/ui/use-toast';
import { formatDate, formatCurrency, formatNumber, getRfmSegmentName } from '@/lib/utils';

// Generate unique ID for filters
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Convert API filters back to SegmentFilters format
function apiFiltersToSegmentFilters(apiFilters: unknown): SegmentFilters {
  if (!apiFilters || typeof apiFilters !== 'object') {
    return createEmptyFilters();
  }

  // Handle different filter formats from API
  const filters = apiFilters as Record<string, unknown>;
  
  // If it's already in our format with groups
  if ('groups' in filters && Array.isArray(filters.groups)) {
    // Ensure all filters have IDs
    const groups = (filters.groups as unknown[]).map((group: unknown) => {
      const g = group as Record<string, unknown>;
      return {
        id: (g.id as string) || generateId(),
        logic: (g.logic as 'AND' | 'OR') || 'AND',
        filters: Array.isArray(g.filters) 
          ? (g.filters as unknown[]).map((f: unknown) => {
              const filter = f as Record<string, unknown>;
              return {
                id: (filter.id as string) || generateId(),
                field: (filter.field as string) || 'totalSpent',
                operator: (filter.operator as string) || 'gte',
                value: filter.value ?? '',
              };
            })
          : [{ id: generateId(), field: 'totalSpent', operator: 'gte', value: '' }]
      };
    });
    return {
      logic: (filters.logic as 'AND' | 'OR') || 'AND',
      groups: groups as SegmentFilters['groups'],
    };
  }

  // If it's in conditions format from API
  if ('conditions' in filters && Array.isArray(filters.conditions)) {
    return {
      logic: (filters.logic as 'AND' | 'OR') || 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: (filters.conditions as unknown[]).map((c: unknown) => {
          const condition = c as Record<string, unknown>;
          return {
            id: generateId(),
            field: (condition.field as string) || 'totalSpent',
            operator: (condition.operator as string) || 'gte',
            value: condition.value ?? '',
          };
        }) as SegmentFilters['groups'][0]['filters']
      }]
    };
  }

  // If it's a flat array of conditions
  if (Array.isArray(filters)) {
    return {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: (filters as unknown[]).map((f: unknown) => {
          const filter = f as Record<string, unknown>;
          return {
            id: generateId(),
            field: (filter.field as string) || 'totalSpent',
            operator: (filter.operator as string) || 'gte',
            value: filter.value ?? '',
          };
        }) as SegmentFilters['groups'][0]['filters']
      }]
    };
  }

  // Default fallback
  return createEmptyFilters();
}

export default function SegmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const segmentId = params.id as string;
  const { shop, isLoading: shopLoading } = useShop();

  const { data: segment, isLoading, error, refetch } = useSegment(segmentId);
  const updateSegment = useUpdateSegment();
  const deleteSegment = useDeleteSegment();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [filters, setFilters] = useState<SegmentFilters>(createEmptyFilters());
  const [isEditing, setIsEditing] = useState(false);

  // Initialize form from segment data
  useEffect(() => {
    if (segment) {
      setName(segment.name);
      setDescription(segment.description || '');
      setIsActive(segment.isActive);
      setFilters(apiFiltersToSegmentFilters(segment.filters));
    }
  }, [segment]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a segment name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const apiFilters = filtersToApiFormat(filters);
      await updateSegment.mutateAsync({
        id: segmentId,
        name: name.trim(),
        description: description.trim() || undefined,
        filters: apiFilters,
        isActive,
      });

      toast({
        title: 'Segment Updated',
        description: `"${name}" has been updated successfully`,
      });

      setIsEditing(false);
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update segment',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this segment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteSegment.mutateAsync(segmentId);
      toast({
        title: 'Segment Deleted',
        description: 'The segment has been deleted',
      });
      router.push('/app/segments');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete segment',
        variant: 'destructive',
      });
    }
  };

  if (shopLoading) {
    return <div className="animate-pulse text-muted-foreground p-4">Loading...</div>;
  }

  if (!shop) {
    return (
      <div className="space-y-6">
        <PageHeader title="Segment Details" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please connect a Shopify store to view segments.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full" />
          </div>
          <div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Segment Details" />
        <ErrorState 
          message={error.message || 'Failed to load segment'} 
          onRetry={() => refetch()} 
        />
      </div>
    );
  }

  if (!segment) {
    return (
      <div className="space-y-6">
        <PageHeader title="Segment Not Found" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            This segment could not be found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? 'Edit Segment' : segment.name}
        description={isEditing ? 'Update segment filters and settings' : segment.description || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/app/segments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)}>
                Edit Segment
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEditing ? (
            <>
              {/* Name & Description Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Segment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., High Value Customers"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe who is in this segment..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Filter Builder */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                  <SegmentBuilder
                    value={filters}
                    onChange={setFilters}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Segment Stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Members</p>
                        <p className="text-2xl font-bold">{formatNumber(segment.memberCount)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={segment.isActive ? 'default' : 'secondary'}>
                          {segment.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Created</p>
                        <p className="text-sm font-medium">{formatDate(segment.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Criteria</CardTitle>
                  <CardDescription>Conditions that define this segment</CardDescription>
                </CardHeader>
                <CardContent>
                  <FilterSummary filters={segment.filters} />
                </CardContent>
              </Card>

              {/* Segment Members */}
              <SegmentMembers segmentId={segmentId} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {isEditing ? (
            <>
              <SegmentPreview filters={filters} />
              
              {/* Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleSave}
                    disabled={updateSegment.isPending}
                  >
                    {updateSegment.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form
                      if (segment) {
                        setName(segment.name);
                        setDescription(segment.description || '');
                        setIsActive(segment.isActive);
                        setFilters(apiFiltersToSegmentFilters(segment.filters));
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" onClick={() => setIsEditing(true)}>
                  Edit Segment
                </Button>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  onClick={handleDelete}
                  disabled={deleteSegment.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteSegment.isPending ? 'Deleting...' : 'Delete Segment'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to display filter summary in a readable format
function FilterSummary({ filters }: { filters: unknown }) {
  if (!filters) {
    return <p className="text-muted-foreground">No filters defined</p>;
  }

  const fieldLabels: Record<string, string> = {
    totalSpent: 'Total Spent',
    ordersCount: 'Orders Count',
    rfmSegment: 'RFM Segment',
    daysSinceLastOrder: 'Days Since Last Order',
    isHighValue: 'High Value',
    isChurnRisk: 'Churn Risk',
  };

  const operatorLabels: Record<string, string> = {
    eq: 'equals',
    neq: 'not equals',
    gt: 'greater than',
    gte: 'at least',
    lt: 'less than',
    lte: 'at most',
    contains: 'contains',
    in: 'is one of',
  };

  const renderCondition = (condition: { field?: string; operator?: string; value?: unknown }) => {
    const fieldLabel = fieldLabels[condition.field || ''] || condition.field || 'Unknown';
    const opLabel = operatorLabels[condition.operator || ''] || condition.operator || '';
    return `${fieldLabel} ${opLabel} ${condition.value}`;
  };

  // Parse filters
  const parsed = filters as Record<string, unknown>;
  
  // Handle conditions format from API
  if ('conditions' in parsed && Array.isArray(parsed.conditions)) {
    return (
      <div className="space-y-1 p-3 rounded-lg bg-muted/50">
        {(parsed.conditions as Array<{ field?: string; operator?: string; value?: unknown }>).map((condition, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {i > 0 && <span className="text-xs text-muted-foreground">{String(parsed.logic || 'AND')}</span>}
            <span>{renderCondition(condition)}</span>
          </div>
        ))}
      </div>
    );
  }

  if ('groups' in parsed && Array.isArray(parsed.groups)) {
    return (
      <div className="space-y-2">
        {(parsed.groups as Array<{ logic?: string; filters?: Array<{ field?: string; operator?: string; value?: unknown }> }>).map((group, gi: number) => (
          <div key={gi}>
            {gi > 0 && (
              <div className="text-xs font-medium text-muted-foreground my-2">
                {String(parsed.logic || 'AND')}
              </div>
            )}
            <div className="space-y-1 p-3 rounded-lg bg-muted/50">
              {group.filters?.map((condition, ci: number) => (
                <div key={ci} className="flex items-center gap-2 text-sm">
                  {ci > 0 && (
                    <span className="text-xs text-muted-foreground">{group.logic || 'AND'}</span>
                  )}
                  <span>{renderCondition(condition)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat array format
  if (Array.isArray(filters)) {
    return (
      <div className="space-y-1 p-3 rounded-lg bg-muted/50">
        {(filters as Array<{ field?: string; operator?: string; value?: unknown }>).map((condition, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {i > 0 && <span className="text-xs text-muted-foreground">AND</span>}
            <span>{renderCondition(condition)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-muted-foreground">Invalid filter format</p>;
}

// Component to show segment members
function SegmentMembers({ segmentId }: { segmentId: string }) {
  // In a real app, this would fetch customers filtered by the segment
  // For now, we'll show a placeholder since we don't have a direct endpoint
  const { data, isLoading } = useCustomers({ limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segment Members</CardTitle>
        <CardDescription>Sample of customers in this segment</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
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
              {data?.customers.slice(0, 5).map((customer) => (
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
                  <TableCell className="text-right">{customer.ordersCount}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
}
