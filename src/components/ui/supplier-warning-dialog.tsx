import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SupplierWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName?: string;
}

/**
 * A warning dialog that informs users when they select a supplier
 * that is not approved or is on probation.
 */
export function SupplierWarningDialog({
  open,
  onOpenChange,
  supplierName,
}: SupplierWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supplier Status Warning</AlertDialogTitle>
          <AlertDialogDescription>
            {supplierName ? (
              <>
                The supplier <strong>"{supplierName}"</strong> is not approved or is on probation.
              </>
            ) : (
              'This supplier is not approved or is on probation.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
