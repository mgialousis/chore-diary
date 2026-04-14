"use client";

import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { recipeSchema, type RecipeFormValues } from "@/types";
import { createRecipe, getIngredientSuggestions, updateRecipe } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IngredientInput } from "@/components/recipes/ingredient-input";

const PRESET_TAGS = [
  "Quick", "Healthy", "Vegetarian", "Vegan", "Comfort Food",
  "Meal Prep", "Cheap", "Gluten Free", "Dairy Free",
];

export function RecipeForm({
  defaultValues,
  recipeId,
  onSuccess,
}: {
  defaultValues?: Partial<RecipeFormValues>;
  recipeId?: string;
  onSuccess?: (id?: string) => void;
}) {
  const router = useRouter();
  const isEditing = !!recipeId;
  const [customTag, setCustomTag] = useState("");
  const [ingredientLibrary, setIngredientLibrary] = useState<string[]>([]);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultServings: 2,
      mealType: null,
      prepTimeMinutes: null,
      instructions: "",
      tags: [],
      ingredients: [{ ingredientName: "", quantity: 1, unit: null, isOptional: false, sortOrder: 0 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const tags = useWatch({
    control: form.control,
    name: "tags",
  });
  const mealType = useWatch({
    control: form.control,
    name: "mealType",
  });

  useEffect(() => {
    let mounted = true;

    async function loadIngredientLibrary() {
      const suggestions = await getIngredientSuggestions("");
      if (mounted) {
        setIngredientLibrary(suggestions);
      }
    }

    void loadIngredientLibrary();

    return () => {
      mounted = false;
    };
  }, []);

  function toggleTag(tag: string) {
    const current = tags ?? [];
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    form.setValue("tags", next);
  }

  function addCustomTag() {
    const nextTag = customTag.trim();
    if (!nextTag) return;

    const current = tags ?? [];
    if (!current.includes(nextTag)) {
      form.setValue("tags", [...current, nextTag]);
    }
    setCustomTag("");
  }

  async function onSubmit(data: RecipeFormValues) {
    try {
      if (isEditing) {
        await updateRecipe(recipeId, data);
        toast.success("Recipe saved");
        router.refresh();
        onSuccess?.();
      } else {
        const result = await createRecipe(data);
        if (result?.error) {
          toast.error(result.error);
          return;
        }
        toast.success("Recipe saved");
        router.push(`/recipes/${result?.id}`);
        onSuccess?.(result?.id);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Recipe name</Label>
        <Input id="name" placeholder="e.g. Spaghetti Bolognese" {...form.register("name")} />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" rows={2} placeholder="Brief description..." {...form.register("description")} />
      </div>

      {/* Servings + Prep time + Meal type */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="servings">Servings</Label>
          <Input
            id="servings"
            type="number"
            min={1}
            max={20}
            inputMode="numeric"
            {...form.register("defaultServings", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prep">Prep (min)</Label>
          <Input
            id="prep"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="—"
            {...form.register("prepTimeMinutes", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Meal type</Label>
          <Select
            value={mealType ?? "both"}
            onValueChange={(v) =>
              form.setValue("mealType", v === "both" ? null : (v as "LUNCH" | "DINNER"))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Both</SelectItem>
              <SelectItem value="LUNCH">Lunch</SelectItem>
              <SelectItem value="DINNER">Dinner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant={tags?.includes(tag) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder="Add custom tag"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomTag}>
            Add tag
          </Button>
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-2">
        <Label>Ingredients</Label>
        {ingredientLibrary.length > 0 && (
          <div className="space-y-2 rounded-2xl border bg-muted/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Existing ingredients
            </p>
            <div className="flex flex-wrap gap-2">
              {ingredientLibrary.map((ingredient) => (
                <Button
                  key={ingredient}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() =>
                    append({
                      ingredientName: ingredient,
                      quantity: 1,
                      unit: null,
                      isOptional: false,
                      sortOrder: fields.length,
                    })}
                >
                  {ingredient}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {fields.map((field, index) => (
            <IngredientInput
              key={field.id}
              index={index}
              form={form}
              onRemove={() => remove(index)}
            />
          ))}
        </div>
        {form.formState.errors.ingredients?.root && (
          <p className="text-xs text-destructive">{form.formState.errors.ingredients.root.message}</p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            append({ ingredientName: "", quantity: 1, unit: null, isOptional: false, sortOrder: fields.length })
          }
        >
          <Plus className="h-3.5 w-3.5" />
          Add ingredient
        </Button>
      </div>

      {/* Instructions */}
      <div className="space-y-1.5">
        <Label htmlFor="instructions">Instructions (optional)</Label>
        <Textarea
          id="instructions"
          rows={5}
          placeholder="Step 1: ..."
          {...form.register("instructions")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting
          ? isEditing ? "Saving..." : "Creating..."
          : isEditing ? "Save changes" : "Create recipe"}
      </Button>
    </form>
  );
}
