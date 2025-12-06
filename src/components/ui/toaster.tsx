'use client';

import { X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'relative rounded-lg border bg-background p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5',
            toast.variant === 'destructive' && 'border-destructive bg-destructive text-destructive-foreground'
          )}
        >
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
          {toast.title && (
            <div className="font-semibold">{toast.title}</div>
          )}
          {toast.description && (
            <div className={cn(
              'text-sm',
              toast.variant !== 'destructive' && 'text-muted-foreground'
            )}>
              {toast.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
