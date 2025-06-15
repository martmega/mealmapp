import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

function ReplaceRecipeModal({
  isOpen,
  onOpenChange,
  searchTerm,
  onSearchTermChange,
  filteredRecipes,
  onSelectRecipe,
  userProfile,
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-pastel-card border border-pastel-border rounded-lg dark:bg-pastel-card dark:border-pastel-border">
        <DialogHeader>
          <DialogTitle className="text-pastel-primary">
            Remplacer la recette
          </DialogTitle>
          <DialogDescription>
            Choisissez une nouvelle recette pour ce repas.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pastel-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <ScrollArea className="h-[300px] border border-pastel-border rounded-md">
            {filteredRecipes.length > 0 ? (
              <div className="p-2 space-y-1">
                {(Array.isArray(filteredRecipes) ? filteredRecipes : []).map(
                  (recipe) =>
                    recipe && recipe.id ? (
                      <Button
                        key={recipe.id}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-pastel-highlight"
                        onClick={() => onSelectRecipe(recipe)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{recipe.name}</span>
                          <span className="text-xs text-pastel-muted-foreground">
                            {recipe.calories || 0} kcal, {recipe.servings || 1}{' '}
                            portions de base
                            {recipe.author &&
                              recipe.author !==
                                (userProfile?.username || 'Moi') &&
                              ` (par ${recipe.author})`}
                          </span>
                        </div>
                      </Button>
                    ) : null
                )}
              </div>
            ) : (
              <p className="p-4 text-center text-pastel-muted-foreground">
                Aucune recette correspondante trouvée.
              </p>
            )}
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ReplaceRecipeModal;
