'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard';
import { SegmentBuilder, SegmentPreview, type SegmentFilters, filtersToApiFormat, createEmptyFilters } from '@/components/segments';
import { useCreateSegment } from '@/hooks/use-api';
import { useShop } from '@/hooks/use-shop';
import { toast } from '@/components/ui/use-toast';

// Generate unique ID for filters
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Template definitions for quick segment creation
const SEGMENT_TEMPLATES: Record<string, {
  name: string;
  description: string;
  filters: SegmentFilters;
}> = {
  'high-value': {
    name: 'High Value Customers',
    description: 'Customers who have spent more than $500 total',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'totalSpent', operator: 'gte', value: 500 }
        ]
      }]
    }
  },
  'recent-purchasers': {
    name: 'Recent Purchasers',
    description: 'Customers who ordered in the last 30 days',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'daysSinceLastOrder', operator: 'lte', value: 30 }
        ]
      }]
    }
  },
  'at-risk': {
    name: 'At Risk Customers',
    description: 'Customers who haven\'t ordered in 90+ days',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'daysSinceLastOrder', operator: 'gte', value: 90 }
        ]
      }]
    }
  },
  'repeat-buyers': {
    name: 'Repeat Buyers',
    description: 'Customers with 3 or more orders',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'ordersCount', operator: 'gte', value: 3 }
        ]
      }]
    }
  },
  'champions': {
    name: 'Champions',
    description: 'Best customers by RFM analysis',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'rfmSegment', operator: 'eq', value: 'CHAMPIONS' }
        ]
      }]
    }
  },
  'new-customers': {
    name: 'New Customers',
    description: 'First-time buyers in the last 30 days',
    filters: {
      logic: 'AND',
      groups: [{
        id: generateId(),
        logic: 'AND',
        filters: [
          { id: generateId(), field: 'ordersCount', operator: 'eq', value: 1 },
          { id: generateId(), field: 'daysSinceLastOrder', operator: 'lte', value: 30 }
        ]
      }]
    }
  },
};

function CreateSegmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shop, isLoading: shopLoading } = useShop();
  const createSegment = useCreateSegment();

  // Get template from URL if provided
  const templateId = searchParams.get('template');
  const template = templateId ? SEGMENT_TEMPLATES[templateId] : null;

  // Form state
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [filters, setFilters] = useState<SegmentFilters>(template?.filters || createEmptyFilters());

  // Update form when template changes
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setFilters(template.filters);
    }
  }, [templateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a segment name',
        variant: 'destructive',
      });
      return;
    }

    // Check if filters have any real conditions
    const hasConditions = filters.groups.some(group => 
      group.filters.some(f => {
        if (f.operator === 'isNull' || f.operator === 'isNotNull') return true;
        return f.value !== '' && f.value !== null && f.value !== undefined;
      })
    );

    if (!hasConditions) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one filter condition',
        variant: 'destructive',
      });
      return;
    }

    try {
      const apiFilters = filtersToApiFormat(filters);
      await createSegment.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        filters: apiFilters,
        isActive: true,
      });

      toast({
        title: 'Segment Created',
        description: `"${name}" has been created successfully`,
      });

      router.push('/app/segments');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create segment',
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
        <PageHeader title="Create Segment" />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Please connect a Shopify store to create segments.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Segment"
        description={template ? `Starting from "${template.name}" template` : 'Build a new customer segment with filters'}
        actions={
          <Button variant="outline" asChild>
            <Link href="/app/segments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Segments
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Name & Description Card */}
            <Card>
              <CardHeader>
                <CardTitle>Segment Details</CardTitle>
                <CardDescription>Basic information about your segment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    placeholder="e.g., High Value Customers"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                    placeholder="Describe who is in this segment..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filter Builder Card */}
            <Card>
              <CardHeader>
                <CardTitle>Filter Criteria</CardTitle>
                <CardDescription>Define conditions to include customers in this segment</CardDescription>
              </CardHeader>
              <CardContent>
                <SegmentBuilder
                  value={filters}
                  onChange={setFilters}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Preview */}
            <SegmentPreview filters={filters} />

            {/* Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createSegment.isPending}
                >
                  {createSegment.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Segment
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/app/segments')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Use multiple conditions to narrow down your segment</p>
                <p>• Combine with RFM segments for behavioral targeting</p>
                <p>• The preview shows matching customers in real-time</p>
                <p>• Segments are updated automatically when data syncs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CreateSegmentPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-muted-foreground p-4">Loading...</div>}>
      <CreateSegmentContent />
    </Suspense>
  );
}
