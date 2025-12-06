'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | null>(null);

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within an AlertDialog');
  }
  return context;
}

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function AlertDialog({ children, open: controlledOpen, onOpenChange }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    setUncontrolledOpen(newOpen);
  }, [onOpenChange]);
  
  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

interface AlertDialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const AlertDialogTrigger = React.forwardRef<HTMLButtonElement, AlertDialogTriggerProps>(
  ({ children, asChild, onClick, ...props }, ref) => {
    const { setOpen } = useAlertDialog();
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setOpen(true);
      onClick?.(e);
    };
    
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ onClick?: typeof handleClick }>, {
        onClick: handleClick,
      });
    }
    
    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
AlertDialogTrigger.displayName = 'AlertDialogTrigger';

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useAlertDialog();
    
    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      };
      
      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }, [open, setOpen]);
    
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 animate-in fade-in-0" 
          onClick={() => setOpen(false)}
        />
        
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
      className
    )}
    {...props}
  />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

interface AlertDialogActionProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const AlertDialogAction = React.forwardRef<HTMLButtonElement, AlertDialogActionProps>(
  ({ className, variant = 'default', onClick, ...props }, ref) => {
    const { setOpen } = useAlertDialog();
    
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(className)}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      />
    );
  }
);
AlertDialogAction.displayName = 'AlertDialogAction';

interface AlertDialogCancelProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const AlertDialogCancel = React.forwardRef<HTMLButtonElement, AlertDialogCancelProps>(
  ({ className, variant = 'outline', onClick, ...props }, ref) => {
    const { setOpen } = useAlertDialog();
    
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn('mt-2 sm:mt-0', className)}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      />
    );
  }
);
AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
