import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calculator, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverrunCalculatorProps {
  targetOverrun?: number;
  tolerancePercent?: number;
}

export function OverrunCalculator({
  targetOverrun = 100,
  tolerancePercent = 5,
}: OverrunCalculatorProps) {
  const [open, setOpen] = useState(false);
  const [mixVolume, setMixVolume] = useState("");
  const [density, setDensity] = useState("1.1");
  const [filledWeight, setFilledWeight] = useState("");
  const [samples, setSamples] = useState<number[]>([]);

  // Formula: Overrun % = ((Mix Volume x Density) / Filled Weight - 1) x 100
  const calculateOverrun = (volume: number, dens: number, weight: number) => {
    if (weight <= 0) return 0;
    return ((volume * dens) / weight - 1) * 100;
  };

  const currentOverrun = calculateOverrun(
    parseFloat(mixVolume) || 0,
    parseFloat(density) || 1,
    parseFloat(filledWeight) || 1
  );

  const minOverrun = targetOverrun * (1 - tolerancePercent / 100);
  const maxOverrun = targetOverrun * (1 + tolerancePercent / 100);
  const isWithinTolerance = currentOverrun >= minOverrun && currentOverrun <= maxOverrun;
  const isOverTarget = currentOverrun > maxOverrun;
  const isUnderTarget = currentOverrun < minOverrun;

  const handleAddSample = () => {
    if (filledWeight && parseFloat(filledWeight) > 0) {
      setSamples([...samples, currentOverrun]);
      setFilledWeight("");
    }
  };

  const averageOverrun = samples.length > 0
    ? samples.reduce((a, b) => a + b, 0) / samples.length
    : 0;

  const getStatusIcon = (overrun: number) => {
    const min = targetOverrun * (1 - tolerancePercent / 100);
    const max = targetOverrun * (1 + tolerancePercent / 100);
    
    if (overrun >= min && overrun <= max) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (overrun > max) {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="gap-2">
          <Calculator className="h-5 w-5" />
          Overrun Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Overrun Calculator
          </DialogTitle>
          <DialogDescription>
            Calculate and verify ice cream overrun percentage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Display */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div>
              <div className="text-sm text-muted-foreground">Target Overrun</div>
              <div className="text-2xl font-bold">{targetOverrun}%</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Tolerance</div>
              <div className="text-sm">±{tolerancePercent}%</div>
              <div className="text-xs text-muted-foreground">
                ({minOverrun.toFixed(1)}% - {maxOverrun.toFixed(1)}%)
              </div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mixVolume">Mix Volume (mL)</Label>
                <Input
                  id="mixVolume"
                  type="number"
                  value={mixVolume}
                  onChange={(e) => setMixVolume(e.target.value)}
                  placeholder="e.g., 100"
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="density">Mix Density (g/mL)</Label>
                <Input
                  id="density"
                  type="number"
                  step="0.01"
                  value={density}
                  onChange={(e) => setDensity(e.target.value)}
                  placeholder="e.g., 1.1"
                  className="h-12 text-lg"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filledWeight">Filled Product Weight (g)</Label>
              <Input
                id="filledWeight"
                type="number"
                value={filledWeight}
                onChange={(e) => setFilledWeight(e.target.value)}
                placeholder="Weigh a sample tub"
                className="h-12 text-lg"
              />
            </div>
          </div>

          {/* Current Calculation Result */}
          {mixVolume && density && filledWeight && (
            <Card className={cn(
              "border-2",
              isWithinTolerance && "border-green-500 bg-green-500/5",
              isOverTarget && "border-amber-500 bg-amber-500/5",
              isUnderTarget && "border-red-500 bg-red-500/5"
            )}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Calculated Overrun</div>
                    <div className="text-3xl font-bold">
                      {currentOverrun.toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusIcon(currentOverrun)}
                    <Badge
                      variant={isWithinTolerance ? "default" : "destructive"}
                      className={cn(
                        isWithinTolerance && "bg-green-500",
                        isOverTarget && "bg-amber-500"
                      )}
                    >
                      {isWithinTolerance ? "PASS" : isOverTarget ? "HIGH" : "LOW"}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={handleAddSample}
                >
                  Add to Samples
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sample History */}
          {samples.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Sample History</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSamples([])}
                  className="text-xs"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {samples.map((sample, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {getStatusIcon(sample)}
                    {sample.toFixed(1)}%
                  </Badge>
                ))}
              </div>
              <div className="p-2 rounded bg-muted text-sm">
                <span className="text-muted-foreground">Average:</span>
                <span className="ml-2 font-semibold">{averageOverrun.toFixed(1)}%</span>
                <span className="ml-2">
                  {averageOverrun >= minOverrun && averageOverrun <= maxOverrun ? (
                    <CheckCircle2 className="inline h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="inline h-4 w-4 text-red-500" />
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Formula Reference */}
          <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
            <strong>Formula:</strong> Overrun % = ((Mix Volume × Density) / Filled Weight - 1) × 100
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
