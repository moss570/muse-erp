import { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Plus, FileText, DollarSign, Calculator } from 'lucide-react';
import { usePOInvoices } from '@/hooks/useInvoices';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { AdditionalCostsDialog } from './AdditionalCostsDialog';

const getPaymentStatusBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-500">Paid</Badge>;
    case 'partial':
      return <Badge variant="secondary">Partial</Badge>;
    case 'overdue':
      return <Badge variant="destructive">Overdue</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
};

interface InvoiceListCardProps {
  purchaseOrderId: string;
  supplierId: string;
  canEdit: boolean;
}

export function InvoiceListCard({
  purchaseOrderId,
  supplierId,
  canEdit,
}: InvoiceListCardProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [costsDialogInvoiceId, setCostsDialogInvoiceId] = useState<string | null>(null);

  const { data: invoices, isLoading } = usePOInvoices(purchaseOrderId);

  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0;
  const totalPaid = invoices?.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) || 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoices
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Invoice
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date
                          ? format(new Date(invoice.due_date), 'MMM d, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(invoice.total_amount).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(invoice.payment_status || 'pending')}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCostsDialogInvoiceId(invoice.id)}
                        >
                          <Calculator className="h-4 w-4 mr-1" />
                          Costs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end gap-6 pt-2 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Invoiced:</span>{' '}
                  <span className="font-medium">
                    ${totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Paid:</span>{' '}
                  <span className="font-medium text-green-600">
                    ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No invoices yet</p>
              {canEdit && (
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Add the first invoice
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <InvoiceFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        purchaseOrderId={purchaseOrderId}
        supplierId={supplierId}
      />

      {costsDialogInvoiceId && (
        <AdditionalCostsDialog
          open={!!costsDialogInvoiceId}
          onOpenChange={(open) => !open && setCostsDialogInvoiceId(null)}
          invoiceId={costsDialogInvoiceId}
        />
      )}
    </>
  );
}
