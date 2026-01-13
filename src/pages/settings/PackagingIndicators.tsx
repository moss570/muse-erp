import { useState } from 'react';
import { Plus, Trash2, Edit, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsBreadcrumb } from '@/components/settings/SettingsBreadcrumb';
import {
  usePackagingIndicators,
  useCreatePackagingIndicator,
  useUpdatePackagingIndicator,
  useDeletePackagingIndicator,
  PackagingIndicatorMapping,
  PackagingIndicatorInput,
} from '@/hooks/usePackagingIndicators';

export default function PackagingIndicators() {
  const { data: mappings, isLoading } = usePackagingIndicators();
  const createMutation = useCreatePackagingIndicator();
  const updateMutation = useUpdatePackagingIndicator();
  const deleteMutation = useDeletePackagingIndicator();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<PackagingIndicatorMapping | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<PackagingIndicatorInput>({
    case_pack_size: 1,
    indicator_digit: '1',
    description: '',
  });

  const handleOpenDialog = (mapping?: PackagingIndicatorMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      setFormData({
        case_pack_size: mapping.case_pack_size,
        indicator_digit: mapping.indicator_digit,
        description: mapping.description || '',
      });
    } else {
      setEditingMapping(null);
      setFormData({
        case_pack_size: 1,
        indicator_digit: '1',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMapping(null);
  };

  const handleSubmit = () => {
    if (editingMapping) {
      updateMutation.mutate(
        { ...formData, id: editingMapping.id },
        { onSuccess: handleCloseDialog }
      );
    } else {
      createMutation.mutate(formData, { onSuccess: handleCloseDialog });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SettingsBreadcrumb currentPage="Packaging Indicators" />
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsBreadcrumb currentPage="Packaging Indicators" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packaging Indicators</h1>
          <p className="text-muted-foreground">
            Map case pack sizes to GTIN-14 packaging indicator digits for UPC generation
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle>Case Pack Size Mappings</CardTitle>
          </div>
          <CardDescription>
            The packaging indicator is the first digit of a GTIN-14 case code, identifying the packaging level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mappings && mappings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case Pack Size</TableHead>
                  <TableHead>Indicator Digit</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.case_pack_size}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-mono font-bold">
                        {mapping.indicator_digit}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {mapping.description || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(mapping)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(mapping.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No packaging indicator mappings configured. Add one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About GTIN-14 Packaging Indicators</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            The packaging indicator is a single digit (0-9) that identifies the packaging level:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>0</strong> - Reserved for restricted distribution</li>
            <li><strong>1</strong> - Base unit or inner pack (most common)</li>
            <li><strong>2</strong> - Different packaging level</li>
            <li><strong>3-8</strong> - Additional packaging levels as needed</li>
            <li><strong>9</strong> - Variable measure trade item</li>
          </ul>
          <p className="mt-3">
            When generating case UPC codes, the system looks up the indicator based on the "units per case" value
            and uses it to create the 14-digit GTIN-14 code.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Edit Packaging Indicator' : 'Add Packaging Indicator'}
            </DialogTitle>
            <DialogDescription>
              Map a case pack size to its GTIN-14 packaging indicator digit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case_pack_size">Case Pack Size</Label>
              <Input
                id="case_pack_size"
                type="number"
                min={1}
                value={formData.case_pack_size}
                onChange={(e) =>
                  setFormData({ ...formData, case_pack_size: parseInt(e.target.value) || 1 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of units per case (e.g., 1, 2, 4, 8, 24)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicator_digit">Indicator Digit</Label>
              <Input
                id="indicator_digit"
                maxLength={1}
                value={formData.indicator_digit}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, indicator_digit: val });
                }}
                className="font-mono text-lg text-center w-20"
              />
              <p className="text-xs text-muted-foreground">
                Single digit 0-9 for GTIN-14 position 1
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Single unit, Four-pack"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !formData.indicator_digit ||
                formData.case_pack_size < 1
              }
            >
              {editingMapping ? 'Save Changes' : 'Add Mapping'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Packaging Indicator?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the mapping. Products with this case pack size will use the default indicator "1".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
