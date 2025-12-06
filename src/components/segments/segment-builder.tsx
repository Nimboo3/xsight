'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// FILTER TYPES (matching backend DSL)
// ============================================================================

export type FilterOperator = 
  | 'eq' | 'ne' 
  | 'gt' | 'lt' | 'gte' | 'lte' 
  | 'in' | 'notIn'
  | 'contains' | 'startsWith' | 'endsWith'
  | 'isNull' | 'isNotNull';

export type FilterField = 
  | 'totalSpent' 
  | 'ordersCount' 
  | 'avgOrderValue'
  | 'daysSinceLastOrder'
  | 'rfmSegment'
  | 'recencyScore'
  | 'frequencyScore'
  | 'monetaryScore'
  | 'isHighValue'
  | 'isChurnRisk'
  | 'email';

export interface Filter {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string | number | boolean | string[];
}

export interface FilterGroup {
  id: string;
  logic: 'AND' | 'OR';
  filters: Filter[];
}

export interface SegmentFilters {
  logic: 'AND' | 'OR';
  groups: FilterGroup[];
}

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

interface FieldDefinition {
  label: string;
  type: 'number' | 'string' | 'boolean' | 'enum' | 'date';
  operators: FilterOperator[];
  enumValues?: { value: string; label: string }[];
  placeholder?: string;
}

export const FIELD_DEFINITIONS: Record<FilterField, FieldDefinition> = {
  totalSpent: {
    label: 'Total Spent ($)',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: 'e.g., 100',
  },
  ordersCount: {
    label: 'Number of Orders',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: 'e.g., 5',
  },
  avgOrderValue: {
    label: 'Avg Order Value ($)',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: 'e.g., 50',
  },
  daysSinceLastOrder: {
    label: 'Days Since Last Order',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: 'e.g., 30',
  },
  rfmSegment: {
    label: 'RFM Segment',
    type: 'enum',
    operators: ['eq', 'ne', 'in', 'notIn'],
    enumValues: [
      { value: 'CHAMPIONS', label: 'Champions' },
      { value: 'LOYAL', label: 'Loyal Customers' },
      { value: 'POTENTIAL_LOYALIST', label: 'Potential Loyalists' },
      { value: 'NEW_CUSTOMERS', label: 'New Customers' },
      { value: 'PROMISING', label: 'Promising' },
      { value: 'NEED_ATTENTION', label: 'Need Attention' },
      { value: 'ABOUT_TO_SLEEP', label: 'About to Sleep' },
      { value: 'AT_RISK', label: 'At Risk' },
      { value: 'CANNOT_LOSE', label: "Can't Lose" },
      { value: 'HIBERNATING', label: 'Hibernating' },
      { value: 'LOST', label: 'Lost' },
    ],
  },
  recencyScore: {
    label: 'Recency Score (1-5)',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: '1-5',
  },
  frequencyScore: {
    label: 'Frequency Score (1-5)',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: '1-5',
  },
  monetaryScore: {
    label: 'Monetary Score (1-5)',
    type: 'number',
    operators: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte'],
    placeholder: '1-5',
  },
  isHighValue: {
    label: 'High Value Customer',
    type: 'boolean',
    operators: ['eq'],
  },
  isChurnRisk: {
    label: 'Churn Risk',
    type: 'boolean',
    operators: ['eq'],
  },
  email: {
    label: 'Email',
    type: 'string',
    operators: ['contains', 'startsWith', 'endsWith', 'isNull', 'isNotNull'],
    placeholder: 'e.g., @gmail.com',
  },
};

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'equals',
  ne: 'not equals',
  gt: 'greater than',
  lt: 'less than',
  gte: 'at least',
  lte: 'at most',
  in: 'is any of',
  notIn: 'is not any of',
  contains: 'contains',
  startsWith: 'starts with',
  endsWith: 'ends with',
  isNull: 'is empty',
  isNotNull: 'is not empty',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function createEmptyFilter(): Filter {
  return {
    id: generateId(),
    field: 'totalSpent',
    operator: 'gte',
    value: '',
  };
}

function createEmptyGroup(): FilterGroup {
  return {
    id: generateId(),
    logic: 'AND',
    filters: [createEmptyFilter()],
  };
}

// ============================================================================
// FILTER ROW COMPONENT
// ============================================================================

interface FilterRowProps {
  filter: Filter;
  onChange: (filter: Filter) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function FilterRow({ filter, onChange, onRemove, canRemove }: FilterRowProps) {
  const fieldDef = FIELD_DEFINITIONS[filter.field];
  const needsValueInput = !['isNull', 'isNotNull'].includes(filter.operator);

  const handleFieldChange = (field: FilterField) => {
    const newFieldDef = FIELD_DEFINITIONS[field];
    const firstOperator = newFieldDef.operators[0];
    onChange({
      ...filter,
      field,
      operator: firstOperator,
      value: newFieldDef.type === 'boolean' ? true : '',
    });
  };

  const handleOperatorChange = (operator: FilterOperator) => {
    onChange({ ...filter, operator });
  };

  const handleValueChange = (value: string | number | boolean | string[]) => {
    onChange({ ...filter, value });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Field Select */}
      <Select value={filter.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FIELD_DEFINITIONS).map(([key, def]) => (
            <SelectItem key={key} value={key}>
              {def.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Select */}
      <Select value={filter.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldDef.operators.map((op) => (
            <SelectItem key={op} value={op}>
              {OPERATOR_LABELS[op]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      {needsValueInput && (
        <>
          {fieldDef.type === 'number' && (
            <Input
              type="number"
              value={filter.value as string}
              onChange={(e) => handleValueChange(e.target.value ? Number(e.target.value) : '')}
              placeholder={fieldDef.placeholder}
              className="w-[120px]"
            />
          )}
          
          {fieldDef.type === 'string' && (
            <Input
              type="text"
              value={filter.value as string}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={fieldDef.placeholder}
              className="w-[180px]"
            />
          )}
          
          {fieldDef.type === 'boolean' && (
            <Select
              value={filter.value ? 'true' : 'false'}
              onValueChange={(v) => handleValueChange(v === 'true')}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {fieldDef.type === 'enum' && (
            <Select
              value={filter.value as string}
              onValueChange={handleValueChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {fieldDef.enumValues?.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}

      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============================================================================
// FILTER GROUP COMPONENT
// ============================================================================

interface FilterGroupProps {
  group: FilterGroup;
  onChange: (group: FilterGroup) => void;
  onRemove: () => void;
  canRemove: boolean;
  groupIndex: number;
}

function FilterGroupCard({ group, onChange, onRemove, canRemove, groupIndex }: FilterGroupProps) {
  const handleFilterChange = useCallback((index: number, filter: Filter) => {
    const newFilters = [...group.filters];
    newFilters[index] = filter;
    onChange({ ...group, filters: newFilters });
  }, [group, onChange]);

  const handleAddFilter = useCallback(() => {
    onChange({
      ...group,
      filters: [...group.filters, createEmptyFilter()],
    });
  }, [group, onChange]);

  const handleRemoveFilter = useCallback((index: number) => {
    if (group.filters.length <= 1) return;
    const newFilters = group.filters.filter((_, i) => i !== index);
    onChange({ ...group, filters: newFilters });
  }, [group, onChange]);

  const handleLogicChange = useCallback((logic: 'AND' | 'OR') => {
    onChange({ ...group, logic });
  }, [group, onChange]);

  return (
    <Card className="relative">
      <CardContent className="pt-4">
        {/* Group Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Group {groupIndex + 1}</Badge>
            <Select value={group.logic} onValueChange={handleLogicChange}>
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Remove Group
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-2">
          {group.filters.map((filter, index) => (
            <div key={filter.id}>
              {index > 0 && (
                <div className="text-xs text-muted-foreground py-1 pl-2">
                  {group.logic}
                </div>
              )}
              <FilterRow
                filter={filter}
                onChange={(f) => handleFilterChange(index, f)}
                onRemove={() => handleRemoveFilter(index)}
                canRemove={group.filters.length > 1}
              />
            </div>
          ))}
        </div>

        {/* Add Filter Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddFilter}
          className="mt-2 text-muted-foreground"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add condition
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN SEGMENT BUILDER COMPONENT
// ============================================================================

interface SegmentBuilderProps {
  value: SegmentFilters;
  onChange: (filters: SegmentFilters) => void;
  className?: string;
}

export function SegmentBuilder({ value, onChange, className }: SegmentBuilderProps) {
  const handleGroupChange = useCallback((index: number, group: FilterGroup) => {
    const newGroups = [...value.groups];
    newGroups[index] = group;
    onChange({ ...value, groups: newGroups });
  }, [value, onChange]);

  const handleAddGroup = useCallback(() => {
    onChange({
      ...value,
      groups: [...value.groups, createEmptyGroup()],
    });
  }, [value, onChange]);

  const handleRemoveGroup = useCallback((index: number) => {
    if (value.groups.length <= 1) return;
    const newGroups = value.groups.filter((_, i) => i !== index);
    onChange({ ...value, groups: newGroups });
  }, [value, onChange]);

  const handleLogicChange = useCallback((logic: 'AND' | 'OR') => {
    onChange({ ...value, logic });
  }, [value, onChange]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top-level logic selector (shown when multiple groups) */}
      {value.groups.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Match</span>
          <Select value={value.logic} onValueChange={handleLogicChange}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL groups</SelectItem>
              <SelectItem value="OR">ANY group</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Filter Groups */}
      {value.groups.map((group, index) => (
        <div key={group.id}>
          {index > 0 && (
            <div className="flex items-center justify-center py-2">
              <Badge variant="secondary" className="text-xs">
                {value.logic}
              </Badge>
            </div>
          )}
          <FilterGroupCard
            group={group}
            groupIndex={index}
            onChange={(g) => handleGroupChange(index, g)}
            onRemove={() => handleRemoveGroup(index)}
            canRemove={value.groups.length > 1}
          />
        </div>
      ))}

      {/* Add Group Button */}
      <Button
        variant="outline"
        onClick={handleAddGroup}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Filter Group
      </Button>
    </div>
  );
}

// ============================================================================
// HELPER: Create empty filters structure
// ============================================================================

export function createEmptyFilters(): SegmentFilters {
  return {
    logic: 'AND',
    groups: [createEmptyGroup()],
  };
}

// ============================================================================
// HELPER: Convert to API format
// ============================================================================

export function filtersToApiFormat(filters: SegmentFilters): unknown {
  // Convert to the backend DSL format
  const conditions = filters.groups.flatMap(group => {
    return group.filters.map(filter => ({
      field: filter.field,
      operator: filter.operator,
      value: filter.value,
    }));
  });

  return {
    logic: filters.logic,
    conditions,
  };
}
