import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PALLET_TYPES, PalletType } from "@/lib/palletCalculations";

interface PalletTypeSelectorProps {
  palletType: PalletType;
  onPalletTypeChange: (type: PalletType) => void;
  customLengthIn: number | null;
  customWidthIn: number | null;
  onCustomLengthChange: (value: number | null) => void;
  onCustomWidthChange: (value: number | null) => void;
}

export function PalletTypeSelector({
  palletType,
  onPalletTypeChange,
  customLengthIn,
  customWidthIn,
  onCustomLengthChange,
  onCustomWidthChange,
}: PalletTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Pallet Type</Label>
        <Select 
          value={palletType} 
          onValueChange={(value) => onPalletTypeChange(value as PalletType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select pallet type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US_STANDARD">
              {PALLET_TYPES.US_STANDARD.name}
            </SelectItem>
            <SelectItem value="EURO">
              {PALLET_TYPES.EURO.name}
            </SelectItem>
            <SelectItem value="CUSTOM">
              {PALLET_TYPES.CUSTOM.name}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {palletType === 'CUSTOM' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">Length (inches)</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g., 48"
              value={customLengthIn ?? ""}
              onChange={(e) => onCustomLengthChange(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Width (inches)</Label>
            <Input
              type="number"
              step="0.01"
              min="1"
              placeholder="e.g., 40"
              value={customWidthIn ?? ""}
              onChange={(e) => onCustomWidthChange(e.target.value ? parseFloat(e.target.value) : null)}
            />
          </div>
        </div>
      )}

      {palletType !== 'CUSTOM' && (
        <p className="text-xs text-muted-foreground">
          {palletType === 'US_STANDARD' 
            ? '48" × 40" (GMA/ISO standard)' 
            : '47.24" × 31.5" (1200mm × 800mm)'
          }
        </p>
      )}
    </div>
  );
}
