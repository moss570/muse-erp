import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Calculator } from 'lucide-react';
import {
  useAdditionalCosts,
  useAddAdditionalCost,
  useDeleteAdditionalCost,
  useCalculateLandedCosts,
  useLandedCostAllocations,
  COST_TYPES,
  ALLOCATION_METHODS,
} from '@/hooks/useInvoices';

const formSchema = z.object({
  cost_type: z.string().min(1, 'Cost type is required'),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  allocation_method: z.string().min(1, 'Allocation method is required'),
});

interface AdditionalCostsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}

export function AdditionalCostsDialog({
  open,
  onOpenChange,
  invoiceId,
}: AdditionalCostsDialogProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: costs, isLoading: costsLoading } = useAdditionalCosts(invoiceId);
  const { data: allocations, isLoading: allocationsLoading } = useLandedCostAllocations(invoiceId);
  const addCost = useAddAdditionalCost();
  const deleteCost = useDeleteAdditionalCost();
  const calculateLanded = useCalculateLandedCosts();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cost_type: '',
      description: '',
      amount: 0,
      allocation_method: 'proportional',
    },
  });

  const handleAddCost = async (values: z.infer<typeof formSchema>) => {
    await addCost.mutateAsync({
      invoice_id: invoiceId,
      cost_type: values.cost_type,
      description: values.description,
      amount: values.amount,
      allocation_method: values.allocation_method,
    });
    form.reset();
    setShowAddForm(false);
  };

  const handleDeleteCost = async (id: string) => {
    await deleteCost.mutateAsync({ id, invoiceId });
  };

  const handleCalculateLanded = async () => {
    await calculateLanded.mutateAsync(invoiceId);
  };

  const totalAdditionalCosts = costs?.reduce((sum, c) => sum + c.amount, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Additional Costs & Landed Cost</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Additional Costs List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Additional Costs</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Cost
              </Button>
            </div>

            {showAddForm && (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAddCost)}
                  className="border rounded-lg p-4 space-y-4 bg-muted/30"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cost_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COST_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allocation_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allocation Method *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ALLOCATION_METHODS.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={1} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={addCost.isPending}>
                      {addCost.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Add'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}

            {costsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : costs && costs.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {COST_TYPES.find((t) => t.value === cost.cost_type)?.label ||
                              cost.cost_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {cost.description || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {ALLOCATION_METHODS.find((m) => m.value === cost.allocation_method)
                            ?.label || cost.allocation_method}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${cost.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteCost(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">
                        Total Additional Costs
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${totalAdditionalCosts.toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                No additional costs added
              </div>
            )}
          </div>

          {/* Calculate Landed Cost Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleCalculateLanded}
              disabled={calculateLanded.isPending}
              className="gap-2"
            >
              {calculateLanded.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Calculate Landed Costs
            </Button>
          </div>

          {/* Landed Cost Allocations */}
          <div className="space-y-3">
            <h3 className="font-medium">Landed Cost Allocations</h3>

            {allocationsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : allocations && allocations.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Lot #</TableHead>
                      <TableHead className="text-right">Material Cost</TableHead>
                      <TableHead className="text-right">Additional</TableHead>
                      <TableHead className="text-right">Total Landed</TableHead>
                      <TableHead className="text-right">Cost/Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((alloc) => (
                      <TableRow key={alloc.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{alloc.receiving_lot?.material?.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {alloc.receiving_lot?.material?.code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {alloc.receiving_lot?.internal_lot_number}
                        </TableCell>
                        <TableCell className="text-right">
                          ${alloc.material_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${((alloc.freight_allocated || 0) + (alloc.duty_allocated || 0) + (alloc.other_costs_allocated || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${alloc.total_landed_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          ${alloc.cost_per_base_unit.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground border rounded-lg">
                No landed cost allocations yet. Add costs and click Calculate.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
