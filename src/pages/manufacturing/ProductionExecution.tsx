import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Factory, Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { ProductSelection } from "@/components/manufacturing/ProductSelection";
import { IngredientWeighingCard } from "@/components/manufacturing/IngredientWeighingCard";
import { ProductionCostSummary } from "@/components/manufacturing/ProductionCostSummary";
import { OverrunCalculator } from "@/components/manufacturing/OverrunCalculator";
import {
  useApprovedProducts,
  useProductRecipes,
  useRecipeItems,
  useActiveMachines,
  useCreateProductionLot,
  type WeighedIngredient,
} from "@/hooks/useProductionExecution";

export default function ProductionExecution() {
  // Selection state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  
  // Production state
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [laborHours, setLaborHours] = useState<string>("1");
  const [machineHours, setMachineHours] = useState<string>("1");
  const [notes, setNotes] = useState<string>("");
  const [isStarted, setIsStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [weighedIngredients, setWeighedIngredients] = useState<WeighedIngredient[]>([]);

  // Data fetching
  const { data: products = [], isLoading: productsLoading } = useApprovedProducts();
  const { data: recipes = [], isLoading: recipesLoading } = useProductRecipes(selectedProductId);
  const { data: recipeItems = [], isLoading: itemsLoading } = useRecipeItems(selectedRecipeId);
  const { data: machines = [], isLoading: machinesLoading } = useActiveMachines();
  const createProductionLot = useCreateProductionLot();

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);
  const quantityToProduce = (selectedRecipe?.batch_size || 0) * batchMultiplier;

  // Initialize weighed ingredients when recipe items load
  useMemo(() => {
    if (recipeItems.length > 0 && weighedIngredients.length === 0 && isStarted) {
      setWeighedIngredients(
        recipeItems.map((item) => ({
          recipeItemId: item.id,
          materialId: item.material_id,
          materialName: item.material?.name || "",
          requiredQuantity: 0,
          unitAbbreviation: item.unit?.code || item.material?.usage_unit?.code || "units",
          weighedQuantity: 0,
          selectedLotId: "",
          selectedLotNumber: "",
          costPerUnit: 0,
          totalCost: 0,
          isCompleted: false,
        }))
      );
    }
  }, [recipeItems, isStarted]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedRecipeId(null);
    setIsStarted(false);
    setWeighedIngredients([]);
    setCurrentStep(0);
  };

  const handleRecipeChange = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const recipe = recipes.find((r) => r.id === recipeId);
    if (recipe?.standard_labor_hours) setLaborHours(recipe.standard_labor_hours.toString());
    if (recipe?.standard_machine_hours) setMachineHours(recipe.standard_machine_hours.toString());
    setIsStarted(false);
    setWeighedIngredients([]);
    setCurrentStep(0);
  };

  const handleStartProduction = () => {
    if (!selectedProductId || !selectedRecipeId || !selectedMachineId) return;
    setIsStarted(true);
    setWeighedIngredients(
      recipeItems.map((item) => ({
        recipeItemId: item.id,
        materialId: item.material_id,
        materialName: item.material?.name || "",
        requiredQuantity: 0,
        unitAbbreviation: item.unit?.code || item.material?.usage_unit?.code || "units",
        weighedQuantity: 0,
        selectedLotId: "",
        selectedLotNumber: "",
        costPerUnit: 0,
        totalCost: 0,
        isCompleted: false,
      }))
    );
  };

  const handleIngredientComplete = (data: WeighedIngredient) => {
    setWeighedIngredients((prev) =>
      prev.map((ing) => (ing.recipeItemId === data.recipeItemId ? data : ing))
    );
    if (currentStep < recipeItems.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const allIngredientsCompleted = weighedIngredients.every((ing) => ing.isCompleted);
  const canFinish = allIngredientsCompleted && quantityToProduce > 0;

  const handleFinishProduction = () => {
    if (!canFinish || !selectedProductId || !selectedMachineId || !selectedRecipeId) return;

    createProductionLot.mutate(
      {
        productId: selectedProductId,
        machineId: selectedMachineId,
        recipeId: selectedRecipeId,
        quantityProduced: quantityToProduce,
        weighedIngredients,
        laborHours: parseFloat(laborHours) || 0,
        machineHours: parseFloat(machineHours) || 0,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          // Reset form
          setSelectedProductId(null);
          setSelectedRecipeId(null);
          setSelectedMachineId(null);
          setBatchMultiplier(1);
          setIsStarted(false);
          setWeighedIngredients([]);
          setCurrentStep(0);
          setNotes("");
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Factory className="h-8 w-8" />
              Production Execution
            </h1>
            <p className="text-muted-foreground">
              Step-by-step batch production with ingredient weighing
            </p>
          </div>
          <OverrunCalculator />
        </div>

        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Setup</CardTitle>
            <CardDescription>Select product, recipe, and machine to begin production</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProductSelection
              products={products}
              recipes={recipes}
              machines={machines}
              selectedProductId={selectedProductId}
              selectedRecipeId={selectedRecipeId}
              selectedMachineId={selectedMachineId}
              onProductChange={handleProductChange}
              onRecipeChange={handleRecipeChange}
              onMachineChange={setSelectedMachineId}
              isLoadingProducts={productsLoading}
              isLoadingRecipes={recipesLoading}
              isLoadingMachines={machinesLoading}
              disabled={isStarted}
            />

            {selectedRecipe && (
              <>
                <Separator />
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Batch Multiplier</Label>
                    <Input
                      type="number"
                      min="1"
                      value={batchMultiplier}
                      onChange={(e) => setBatchMultiplier(parseInt(e.target.value) || 1)}
                      disabled={isStarted}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity to Produce</Label>
                    <div className="h-12 flex items-center px-3 bg-muted rounded-md text-lg font-bold">
                      {quantityToProduce} {selectedRecipe.batch_unit?.code || "units"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Labor Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={laborHours}
                      onChange={(e) => setLaborHours(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Machine Hours</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={machineHours}
                      onChange={(e) => setMachineHours(e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}

            {!isStarted && selectedProductId && selectedRecipeId && selectedMachineId && (
              <Button size="lg" className="w-full h-14 text-lg" onClick={handleStartProduction}>
                <Play className="h-5 w-5 mr-2" />
                Start Production Run
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Production Workflow */}
        {isStarted && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Weighing Steps */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold">Ingredient Weighing</h2>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recipeItems.map((item, index) => (
                    <IngredientWeighingCard
                      key={item.id}
                      recipeItem={item}
                      batchMultiplier={batchMultiplier}
                      onComplete={handleIngredientComplete}
                      isActive={index === currentStep}
                      isCompleted={weighedIngredients.find((w) => w.recipeItemId === item.id)?.isCompleted || false}
                      completedData={weighedIngredients.find((w) => w.recipeItemId === item.id)}
                      stepNumber={index + 1}
                    />
                  ))}
                </div>
              )}

              {/* Notes and Finish */}
              {allIngredientsCompleted && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Complete Production Run
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Production Notes (Optional)</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes about this batch..."
                        rows={3}
                      />
                    </div>
                    <Button
                      size="lg"
                      className="w-full h-14 text-lg"
                      onClick={handleFinishProduction}
                      disabled={createProductionLot.isPending}
                    >
                      {createProductionLot.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          Complete & Save Production Lot
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Cost Summary Sidebar */}
            <div>
              <ProductionCostSummary
                weighedIngredients={weighedIngredients}
                quantityToProduce={quantityToProduce}
                laborHours={parseFloat(laborHours) || 0}
                machineHours={parseFloat(machineHours) || 0}
              />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
