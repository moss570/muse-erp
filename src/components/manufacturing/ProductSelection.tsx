import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Product, ProductRecipe, Machine } from "@/hooks/useProductionExecution";

interface ProductSelectionProps {
  products: Product[];
  recipes: ProductRecipe[];
  machines: Machine[];
  selectedProductId: string | null;
  selectedRecipeId: string | null;
  selectedMachineId: string | null;
  onProductChange: (productId: string) => void;
  onRecipeChange: (recipeId: string) => void;
  onMachineChange: (machineId: string) => void;
  isLoadingProducts: boolean;
  isLoadingRecipes: boolean;
  isLoadingMachines: boolean;
  disabled?: boolean;
}

export function ProductSelection({
  products,
  recipes,
  machines,
  selectedProductId,
  selectedRecipeId,
  selectedMachineId,
  onProductChange,
  onRecipeChange,
  onMachineChange,
  isLoadingProducts,
  isLoadingRecipes,
  isLoadingMachines,
  disabled = false,
}: ProductSelectionProps) {
  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Product Selection */}
      <div className="space-y-2">
        <Label htmlFor="product" className="text-base font-semibold">
          Product
        </Label>
        {isLoadingProducts ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <Select
            value={selectedProductId || ""}
            onValueChange={onProductChange}
            disabled={disabled}
          >
            <SelectTrigger id="product" className="h-12 text-base">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id} className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.sku}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Recipe Selection */}
      <div className="space-y-2">
        <Label htmlFor="recipe" className="text-base font-semibold">
          Recipe
        </Label>
        {isLoadingRecipes && selectedProductId ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <Select
            value={selectedRecipeId || ""}
            onValueChange={onRecipeChange}
            disabled={disabled || !selectedProductId || recipes.length === 0}
          >
            <SelectTrigger id="recipe" className="h-12 text-base">
              <SelectValue placeholder={selectedProductId ? "Select a recipe" : "Select product first"} />
            </SelectTrigger>
            <SelectContent>
              {recipes.map((recipe) => (
                <SelectItem key={recipe.id} value={recipe.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{recipe.recipe_name}</span>
                    {recipe.is_default && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    {recipe.recipe_version && (
                      <span className="text-xs text-muted-foreground">v{recipe.recipe_version}</span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {selectedRecipe && (
          <div className="text-sm text-muted-foreground">
            Batch size: {selectedRecipe.batch_size} {selectedRecipe.batch_unit?.code || "units"}
          </div>
        )}
      </div>

      {/* Machine Selection */}
      <div className="space-y-2">
        <Label htmlFor="machine" className="text-base font-semibold">
          Machine
        </Label>
        {isLoadingMachines ? (
          <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <Select
            value={selectedMachineId || ""}
            onValueChange={onMachineChange}
            disabled={disabled}
          >
            <SelectTrigger id="machine" className="h-12 text-base">
              <SelectValue placeholder="Select a machine" />
            </SelectTrigger>
            <SelectContent>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                      #{machine.machine_number}
                    </span>
                    <span className="font-medium">{machine.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
