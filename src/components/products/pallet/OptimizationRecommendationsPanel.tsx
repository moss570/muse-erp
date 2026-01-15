import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Lock, Snowflake, ArrowRight, Lightbulb } from "lucide-react";
import { calculateMaxTi, PALLET_TYPES, PalletType } from "@/lib/palletCalculations";

interface OptimizationOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  ti: number;
  efficiency: number;
  arrangement: {
    cols: number;
    rows: number;
    orientation: 'lengthwise' | 'widthwise';
  };
  highlight?: boolean;
}

interface OptimizationRecommendationsPanelProps {
  boxLengthIn: number | null | undefined;
  boxWidthIn: number | null | undefined;
  palletType: PalletType;
  customPalletLengthIn?: number | null;
  customPalletWidthIn?: number | null;
  currentTi: number | null;
  onApplyTi: (ti: number) => void;
}

export function OptimizationRecommendationsPanel({
  boxLengthIn,
  boxWidthIn,
  palletType,
  customPalletLengthIn,
  customPalletWidthIn,
  currentTi,
  onApplyTi,
}: OptimizationRecommendationsPanelProps) {
  const options = useMemo<OptimizationOption[]>(() => {
    if (!boxLengthIn || !boxWidthIn) return [];

    const palletDims = palletType === 'CUSTOM' 
      ? { lengthIn: customPalletLengthIn || 48, widthIn: customPalletWidthIn || 40 }
      : PALLET_TYPES[palletType];

    // Calculate both orientations
    const lengthwise = {
      cols: Math.floor(palletDims.lengthIn / boxLengthIn),
      rows: Math.floor(palletDims.widthIn / boxWidthIn),
    };
    const widthwise = {
      cols: Math.floor(palletDims.lengthIn / boxWidthIn),
      rows: Math.floor(palletDims.widthIn / boxLengthIn),
    };

    const lengthwiseTi = lengthwise.cols * lengthwise.rows;
    const widthwiseTi = widthwise.cols * widthwise.rows;

    // Calculate utilization percentages
    const palletArea = palletDims.lengthIn * palletDims.widthIn;
    const boxArea = boxLengthIn * boxWidthIn;

    const options: OptimizationOption[] = [];

    // Option A: Maximum Cases (best fitting orientation)
    const maxTiResult = calculateMaxTi(boxLengthIn, boxWidthIn, palletDims.lengthIn, palletDims.widthIn);
    if (maxTiResult.maxTi > 0 && maxTiResult.arrangement) {
      const usedArea = maxTiResult.maxTi * boxArea;
      options.push({
        id: 'max-cases',
        name: 'Maximum Cases',
        description: 'Fits the most cases per layer',
        icon: <Star className="h-4 w-4 text-amber-500" />,
        ti: maxTiResult.maxTi,
        efficiency: Math.round((usedArea / palletArea) * 100),
        arrangement: maxTiResult.arrangement,
        highlight: true,
      });
    }

    // Option B: Stability Pattern (slightly fewer cases for interlocking)
    // Use 90% of max for better stability with alternating layers
    const stabilityTi = Math.max(1, Math.floor(maxTiResult.maxTi * 0.9));
    if (stabilityTi > 0 && stabilityTi !== maxTiResult.maxTi) {
      const usedArea = stabilityTi * boxArea;
      options.push({
        id: 'stability',
        name: 'Best Stability',
        description: 'Allows interlocking pattern between layers',
        icon: <Lock className="h-4 w-4 text-blue-500" />,
        ti: stabilityTi,
        efficiency: Math.round((usedArea / palletArea) * 100),
        arrangement: maxTiResult.arrangement || { cols: 0, rows: 0, orientation: 'lengthwise' },
      });
    }

    // Option C: Cold Storage (gaps for airflow)
    // Use 80% of max for air circulation
    const coldStorageTi = Math.max(1, Math.floor(maxTiResult.maxTi * 0.8));
    if (coldStorageTi > 0 && coldStorageTi !== maxTiResult.maxTi && coldStorageTi !== stabilityTi) {
      const usedArea = coldStorageTi * boxArea;
      options.push({
        id: 'cold-storage',
        name: 'Cold Storage',
        description: 'Gaps between cases for air circulation',
        icon: <Snowflake className="h-4 w-4 text-cyan-500" />,
        ti: coldStorageTi,
        efficiency: Math.round((usedArea / palletArea) * 100),
        arrangement: maxTiResult.arrangement || { cols: 0, rows: 0, orientation: 'lengthwise' },
      });
    }

    // Alternative orientation if different
    if (lengthwiseTi !== widthwiseTi) {
      const alternateTi = lengthwiseTi === maxTiResult.maxTi ? widthwiseTi : lengthwiseTi;
      const alternateOrientation = lengthwiseTi === maxTiResult.maxTi ? 'widthwise' : 'lengthwise';
      const alternateCols = alternateOrientation === 'widthwise' ? widthwise.cols : lengthwise.cols;
      const alternateRows = alternateOrientation === 'widthwise' ? widthwise.rows : lengthwise.rows;
      
      if (alternateTi > 0) {
        const usedArea = alternateTi * boxArea;
        options.push({
          id: 'alternate',
          name: 'Alternate Orientation',
          description: `Cases rotated 90° (${alternateOrientation})`,
          icon: <ArrowRight className="h-4 w-4 text-purple-500 rotate-90" />,
          ti: alternateTi,
          efficiency: Math.round((usedArea / palletArea) * 100),
          arrangement: { cols: alternateCols, rows: alternateRows, orientation: alternateOrientation },
        });
      }
    }

    return options;
  }, [boxLengthIn, boxWidthIn, palletType, customPalletLengthIn, customPalletWidthIn]);

  if (!boxLengthIn || !boxWidthIn) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        <Lightbulb className="h-5 w-5 mx-auto mb-2 opacity-50" />
        Select a box material with dimensions to see optimization recommendations
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Unable to calculate arrangements for these dimensions
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        Optimization Recommendations
      </div>
      <div className="grid gap-2">
        {options.map((option) => (
          <Card 
            key={option.id} 
            className={`${option.highlight ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1">
                  {option.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{option.name}</span>
                      {option.highlight && (
                        <Badge variant="outline" className="text-xs bg-amber-100 border-amber-300 text-amber-700">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="font-medium">Ti: {option.ti}</span>
                      <span className="text-muted-foreground">
                        {option.arrangement.cols}×{option.arrangement.rows} ({option.arrangement.orientation})
                      </span>
                      <span className={`${option.efficiency >= 70 ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {option.efficiency}% efficient
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={currentTi === option.ti ? "secondary" : "outline"}
                  onClick={() => onApplyTi(option.ti)}
                  className="shrink-0"
                  disabled={currentTi === option.ti}
                >
                  {currentTi === option.ti ? "Applied" : "Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
