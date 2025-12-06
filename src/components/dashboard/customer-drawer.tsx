'use client';

import { X, Mail, Phone, MapPin, Calendar, ShoppingBag, DollarSign, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCustomer, useOrders, type Customer, type Order } from '@/hooks/use-api';
import { formatCurrency, formatDate, formatRelativeTime, getRfmSegmentName, getRfmSegmentColor, cn } from '@/lib/utils';

interface CustomerDetailDrawerProps {
  customerId: string | null;
  open: boolean;
  onClose: () => void;
}

export function CustomerDetailDrawer({ customerId, open, onClose }: CustomerDetailDrawerProps) {
  const { data: customer, isLoading: customerLoading } = useCustomer(customerId || '');

  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    customerId: customerId || '', 
    limit: 5, 
    sortBy: 'createdAt', 
    sortOrder: 'desc'
  });

  const isLoading = customerLoading || ordersLoading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-background shadow-lg overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Customer Details</h2>
            <p className="text-sm text-muted-foreground">View detailed information about this customer</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <CustomerDetailSkeleton />
          ) : customer ? (
            <CustomerDetailContent customer={customer} orders={ordersData?.orders || []} />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              Customer not found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetailSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

interface CustomerDetailContentProps {
  customer: Customer;
  orders: Order[];
}

function CustomerDetailContent({ customer, orders }: CustomerDetailContentProps) {
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'No name';
  const initials = (customer.firstName?.[0] || '') + (customer.lastName?.[0] || '') || '?';

  // Determine customer health indicators
  const isHighValue = customer.totalSpent > 500;
  const isFrequentBuyer = customer.ordersCount >= 3;
  const daysSinceLastOrder = customer.lastOrderDate
    ? Math.floor((new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isAtRisk = daysSinceLastOrder !== null && daysSinceLastOrder > 90;

  return (
    <div className="mt-6 space-y-6">
      {/* Customer Header */}
      <div className="flex items-start gap-4">
        <div className={cn(
          "h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold text-white",
          customer.rfmSegment ? getRfmSegmentColor(customer.rfmSegment) : 'bg-gray-400'
        )}>
          {initials.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{fullName}</h3>
          {customer.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          {customer.rfmSegment && (
            <Badge variant="secondary" className="mt-2">
              {getRfmSegmentName(customer.rfmSegment)}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <DollarSign className="h-5 w-5 mx-auto text-muted-foreground" />
          <div className="text-xl font-bold mt-1">{formatCurrency(customer.totalSpent)}</div>
          <div className="text-xs text-muted-foreground">Total Spent</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <ShoppingBag className="h-5 w-5 mx-auto text-muted-foreground" />
          <div className="text-xl font-bold mt-1">{customer.ordersCount}</div>
          <div className="text-xs text-muted-foreground">Orders</div>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Calendar className="h-5 w-5 mx-auto text-muted-foreground" />
          <div className="text-xl font-bold mt-1">
            {customer.lastOrderDate ? formatRelativeTime(customer.lastOrderDate) : 'Never'}
          </div>
          <div className="text-xs text-muted-foreground">Last Order</div>
        </div>
      </div>

      {/* RFM Scores */}
      {(customer.recencyScore || customer.frequencyScore || customer.monetaryScore) && (
        <>
          <div>
            <h4 className="text-sm font-medium mb-3">RFM Scores</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recency</span>
                  <span className="text-lg font-bold">{customer.recencyScore || '-'}</span>
                </div>
                <div className="mt-1">
                  <RfmScoreBar score={customer.recencyScore || 0} color="blue" />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Frequency</span>
                  <span className="text-lg font-bold">{customer.frequencyScore || '-'}</span>
                </div>
                <div className="mt-1">
                  <RfmScoreBar score={customer.frequencyScore || 0} color="green" />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Monetary</span>
                  <span className="text-lg font-bold">{customer.monetaryScore || '-'}</span>
                </div>
                <div className="mt-1">
                  <RfmScoreBar score={customer.monetaryScore || 0} color="purple" />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Insights */}
      <div>
        <h4 className="text-sm font-medium mb-3">Insights</h4>
        <div className="space-y-2">
          {isHighValue && (
            <InsightBadge
              icon={<Star className="h-4 w-4" />}
              label="High Value Customer"
              description="Spent over $500 total"
              variant="success"
            />
          )}
          {isFrequentBuyer && (
            <InsightBadge
              icon={<TrendingUp className="h-4 w-4" />}
              label="Frequent Buyer"
              description="3+ orders placed"
              variant="info"
            />
          )}
          {isAtRisk && (
            <InsightBadge
              icon={<TrendingDown className="h-4 w-4" />}
              label="At Risk"
              description={`No orders in ${daysSinceLastOrder} days`}
              variant="warning"
            />
          )}
          {!isHighValue && !isFrequentBuyer && !isAtRisk && (
            <p className="text-sm text-muted-foreground">No special insights for this customer</p>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {orders.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Orders</h4>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderName || order.orderNumber}</TableCell>
                    <TableCell className="text-right">{formatCurrency(order.totalPrice)}</TableCell>
                    <TableCell>
                      <Badge variant={getOrderStatusVariant(order.financialStatus || 'unknown')}>
                        {order.financialStatus || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatDate(order.orderDate)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Customer Since */}
      <div className="text-xs text-muted-foreground text-center border-t pt-4">
        Customer since {formatDate(customer.createdAt)}
      </div>
    </div>
  );
}

// Helper component for RFM score visualization
function RfmScoreBar({ score, color }: { score: number; color: 'blue' | 'green' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', colors[color])}
        style={{ width: `${(score / 5) * 100}%` }}
      />
    </div>
  );
}

// Helper component for insight badges
interface InsightBadgeProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  variant: 'success' | 'warning' | 'info';
}

function InsightBadge({ icon, label, description, variant }: InsightBadgeProps) {
  const variants = {
    success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  };

  return (
    <div className={cn('flex items-center gap-3 p-2 rounded-lg border', variants[variant])}>
      {icon}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs opacity-80">{description}</div>
      </div>
    </div>
  );
}

// Helper function for order status badge variants
function getOrderStatusVariant(status: string): 'default' | 'secondary' | 'success' | 'destructive' | 'outline' {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'secondary';
    case 'refunded':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}
