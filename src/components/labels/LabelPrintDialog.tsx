import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Download } from 'lucide-react';
import { useLabelTemplates, LabelTemplate } from '@/hooks/useLabelTemplates';
import JsBarcode from 'jsbarcode';
import { format } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';

interface LabelElement {
  id: string;
  type: 'text' | 'barcode' | 'image' | 'field' | 'date';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  barcodeType?: string;
  fieldKey?: string;
}

interface LabelPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotId: string;
  lotType: 'receiving' | 'production';
}

export function LabelPrintDialog({
  open,
  onOpenChange,
  lotId,
  lotType,
}: LabelPrintDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [copies, setCopies] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  // Fetch templates for this lot type
  const { data: templates, isLoading: templatesLoading } = useLabelTemplates(lotType);

  // Fetch lot data based on type
  const { data: lotData, isLoading: lotLoading } = useQuery({
    queryKey: ['lot-for-label', lotType, lotId],
    queryFn: async () => {
      if (lotType === 'receiving') {
        const { data, error } = await supabase
          .from('receiving_lots')
          .select(`
            *,
            material:materials(id, name, code, allergens),
            supplier:suppliers(id, name, code),
            unit:units_of_measure(id, name, code),
            location:locations(id, name, location_code)
          `)
          .eq('id', lotId)
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('production_lots')
          .select(`
            *,
            product:products(id, name, sku),
            machine:machines(id, name, machine_number)
          `)
          .eq('id', lotId)
          .single();
        if (error) throw error;
        return data;
      }
    },
    enabled: open && !!lotId,
  });

  // Set default template
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      const defaultTemplate = templates.find((t) => t.is_default) || templates[0];
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId);

  // Get field value from lot data
  const getFieldValue = (fieldKey: string): string => {
    if (!lotData) return '';
    
    // Type guard for receiving lots
    const isReceivingLot = lotType === 'receiving';
    const data = lotData as Record<string, unknown>;

    if (isReceivingLot) {
      const material = data.material as { name?: string; code?: string; allergens?: string[] | null } | null;
      const supplier = data.supplier as { name?: string } | null;
      const unit = data.unit as { code?: string } | null;
      const location = data.location as { name?: string } | null;
      
      switch (fieldKey) {
        case 'lot_number':
        case 'internal_lot_number':
          return String(data.internal_lot_number || '');
        case 'material_name':
          return material?.name || '';
        case 'material_code':
          return material?.code || '';
        case 'supplier_name':
          return supplier?.name || '';
        case 'quantity':
          return String(data.quantity_received || '');
        case 'unit':
          return unit?.code || '';
        case 'expiry_date':
          return data.expiry_date ? format(new Date(data.expiry_date as string), 'MM/dd/yyyy') : '';
        case 'received_date':
          return data.received_date ? format(new Date(data.received_date as string), 'MM/dd/yyyy') : '';
        case 'location':
          return location?.name || '';
        case 'allergens':
          const allergens = material?.allergens;
          if (allergens && allergens.length > 0) {
            return `Contains: ${allergens.join(', ')}`;
          }
          return '';
        default:
          return '';
      }
    } else {
      const product = data.product as { name?: string; sku?: string } | null;
      
      switch (fieldKey) {
        case 'lot_number':
          return String(data.lot_number || '');
        case 'product_name':
          return product?.name || '';
        case 'product_sku':
          return product?.sku || '';
        case 'quantity':
          return String(data.quantity_produced || '');
        case 'expiry_date':
          return data.expiry_date ? format(new Date(data.expiry_date as string), 'MM/dd/yyyy') : '';
        case 'production_date':
          return data.production_date
            ? format(new Date(data.production_date as string), 'MM/dd/yyyy')
            : '';
        default:
          return '';
      }
    }
  };

  // Generate label HTML
  const generateLabelHtml = (template: LabelTemplate): string => {
    const elements = (template.fields_config as unknown as LabelElement[]) || [];
    const DPI = 96;
    const widthPx = template.width_inches * DPI;
    const heightPx = template.height_inches * DPI;

    let elementsHtml = '';

    elements.forEach((el) => {
      const left = (el.x / 100) * widthPx;
      const top = (el.y / 100) * heightPx;
      const width = (el.width / 100) * widthPx;

      if (el.type === 'text') {
        elementsHtml += `
          <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${width}px;
            font-size: ${el.fontSize || 12}px; font-weight: ${el.fontWeight || 'normal'};
            text-align: ${el.textAlign || 'left'};">
            ${el.content || ''}
          </div>
        `;
      } else if (el.type === 'field') {
        const value = getFieldValue(el.fieldKey || '');
        elementsHtml += `
          <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${width}px;
            font-size: ${el.fontSize || 12}px; font-weight: ${el.fontWeight || 'normal'};
            text-align: ${el.textAlign || 'left'};">
            ${value}
          </div>
        `;
      } else if (el.type === 'date') {
        elementsHtml += `
          <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${width}px;
            font-size: ${el.fontSize || 12}px;">
            ${format(new Date(), 'MM/dd/yyyy')}
          </div>
        `;
      } else if (el.type === 'barcode') {
        const barcodeValue = getFieldValue(el.fieldKey || 'lot_number') || '123456789';
        const barcodeWidth = Math.min((el.width / 100) * widthPx, widthPx - left - 10);
        elementsHtml += `
          <div style="position: absolute; left: ${left}px; top: ${top}px; width: ${barcodeWidth}px; overflow: hidden;"
            class="barcode-container" data-value="${barcodeValue}" data-format="${el.barcodeType || 'CODE128'}" data-width="${barcodeWidth}">
          </div>
        `;
      }
    });

    return `
      <div style="position: relative; width: ${widthPx}px; height: ${heightPx}px; 
        border: 1px solid #ccc; background: white; font-family: Arial, sans-serif; margin: 10px;">
        ${elementsHtml}
      </div>
    `;
  };

  // Render barcodes after HTML is set
  useEffect(() => {
    if (previewRef.current && selectedTemplate && lotData) {
      const containers = previewRef.current.querySelectorAll('.barcode-container');
      containers.forEach((container) => {
        const value = container.getAttribute('data-value') || '123456789';
        const formatType = container.getAttribute('data-format') || 'CODE128';
        const containerWidth = parseInt(container.getAttribute('data-width') || '200');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        container.innerHTML = '';
        container.appendChild(svg);
        
        // Calculate barcode width based on container and value length
        const barcodeWidth = Math.max(1, Math.min(2, Math.floor(containerWidth / (value.length * 11))));
        
        try {
          JsBarcode(svg, value, {
            format: formatType,
            width: barcodeWidth,
            height: 35,
            displayValue: true,
            fontSize: 9,
            margin: 2,
          });
          // Make SVG fit container
          svg.style.width = '100%';
          svg.style.height = 'auto';
          svg.style.maxWidth = `${containerWidth}px`;
        } catch {
          container.innerHTML = `<span style="color: red; font-size: 10px;">Invalid barcode</span>`;
        }
      });
    }
  }, [selectedTemplate, lotData]);

  const handlePrint = () => {
    if (!selectedTemplate || !lotData) return;

    const labelHtml = generateLabelHtml(selectedTemplate);
    const labelsHtml = Array(copies).fill(labelHtml).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Labels</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .label { page-break-after: always; }
            .label:last-child { page-break-after: auto; }
          }
          body { font-family: Arial, sans-serif; }
        </style>
      </head>
      <body>
        ${labelsHtml}
        <script>
          // Render barcodes
          document.querySelectorAll('.barcode-container').forEach(function(container) {
            var value = container.getAttribute('data-value') || '123456789';
            var format = container.getAttribute('data-format') || 'CODE128';
            var containerWidth = parseInt(container.getAttribute('data-width') || '200');
            var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            container.appendChild(svg);
            var barcodeWidth = Math.max(1, Math.min(2, Math.floor(containerWidth / (value.length * 11))));
            try {
              JsBarcode(svg, value, {
                format: format,
                width: barcodeWidth,
                height: 35,
                displayValue: true,
                fontSize: 9,
                margin: 2,
              });
              svg.style.width = '100%';
              svg.style.height = 'auto';
              svg.style.maxWidth = containerWidth + 'px';
            } catch(e) {
              container.innerHTML = '<span style="color: red;">Invalid barcode</span>';
            }
          });
          setTimeout(function() { window.print(); }, 500);
        </script>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isLoading = templatesLoading || lotLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Print Label</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Template Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.is_default && (
                          <Badge variant="secondary" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Copies</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={copies}
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Lot Info */}
            {lotData && (
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <h4 className="font-medium">Lot Information</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Lot #:</span>{' '}
                    <span className="font-mono">
                      {getFieldValue('lot_number')}
                    </span>
                  </div>
                  {lotType === 'receiving' ? (
                    <>
                      <div>
                        <span className="text-muted-foreground">Material:</span>{' '}
                        {getFieldValue('material_name')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Supplier:</span>{' '}
                        {getFieldValue('supplier_name')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        {getFieldValue('quantity')} {getFieldValue('unit')}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-muted-foreground">Product:</span>{' '}
                        {getFieldValue('product_name')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantity:</span>{' '}
                        {getFieldValue('quantity')}
                      </div>
                    </>
                  )}
                  {(lotData as Record<string, unknown>).expiry_date && (
                    <div>
                      <span className="text-muted-foreground">Expiry:</span>{' '}
                      {getFieldValue('expiry_date')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preview */}
            {selectedTemplate && lotData && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  ref={previewRef}
                  className="border rounded-lg p-4 bg-gray-50 overflow-auto"
                  style={{ maxHeight: 300 }}
                  dangerouslySetInnerHTML={{
                    __html: generateLabelHtml(selectedTemplate),
                  }}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrint} disabled={!selectedTemplate || !lotData}>
                <Printer className="h-4 w-4 mr-2" />
                Print {copies > 1 ? `${copies} Labels` : 'Label'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
