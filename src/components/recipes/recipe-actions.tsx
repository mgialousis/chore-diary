"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRecipe } from "@/actions/recipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RecipeForm } from "@/components/recipes/recipe-form";
import type { RecipeFormValues } from "@/types";

export function RecipeActions({
  recipeId,
  householdId,
  recipe,
}: {
  recipeId: string;
  householdId: string;
  recipe: RecipeFormValues;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteRecipe(recipeId);
    if (result?.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success("Recipe deleted");
      router.push("/recipes");
    }
  }

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            householdId={householdId}
            recipeId={recipeId}
            defaultValues={recipe}
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete recipe?</DialogTitle>
            <DialogDescription>
              This will permanently delete the recipe and all its ingredients. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
