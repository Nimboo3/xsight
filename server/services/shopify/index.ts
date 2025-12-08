export * from './client';

// Customer sync
export { 
  syncCustomers,
  syncSingleCustomer,
  type SyncOptions as CustomerSyncOptions,
  type SyncResult as CustomerSyncResult 
} from './customers';

// Order sync
export { 
  syncOrders,
  syncSingleOrder,
  updateCustomerOrderStats,
  type SyncOptions as OrderSyncOptions,
  type SyncResult as OrderSyncResult 
} from './orders';

// Product sync
export { 
  syncProducts,
  type SyncOptions as ProductSyncOptions,
  type SyncResult as ProductSyncResult 
} from './products';

// Generic sync types (use CustomerSyncOptions as the standard)
export type { SyncOptions, SyncResult } from './customers';
