import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

function TagManager({ onClose, existingTags: propExistingTags, setExistingTags: propSetExistingTags }) {
  const [localExistingTags, setLocalExistingTags] = useState(propExistingTags);
  const { toast } = useToast();

  useEffect(() => {
    setLocalExistingTags(propExistingTags);
  }, [propExistingTags]);

  const handleDeleteTag = async (tagToDelete) => {
    const { data: recipesWithTag, error: fetchError } = await supabase
      .from('recipes')
      .select('id, tags')
      .contains('tags', [tagToDelete]);

    if (fetchError) {
      toast({ title: "Erreur", description: "Impossible de vérifier l'utilisation du tag.", variant: "destructive" });
      return;
    }

    if (recipesWithTag && recipesWithTag.length > 0) {
      if (!window.confirm(`Le tag "${tagToDelete}" est utilisé dans ${recipesWithTag.length} recette(s). Voulez-vous vraiment le supprimer de ces recettes et de la liste des tags ?`)) {
        return;
      }
      
      try {
        for (const recipe of recipesWithTag) {
          const updatedTags = recipe.tags.filter(t => t !== tagToDelete);
          const { error: updateError } = await supabase
            .from('recipes')
            .update({ tags: updatedTags })
            .eq('id', recipe.id);
          if (updateError) throw updateError;
        }
        toast({ title: "Tag supprimé", description: `Le tag "${tagToDelete}" a été retiré des recettes affectées.` });
      } catch (error) {
        toast({ title: "Erreur de mise à jour", description: `Impossible de retirer le tag "${tagToDelete}" des recettes. ${error.message}`, variant: "destructive" });
        return;
      }
    }

    const newTags = localExistingTags.filter(tag => tag !== tagToDelete);
    setLocalExistingTags(newTags);
    propSetExistingTags(newTags); 
    localStorage.setItem("existingTags", JSON.stringify(newTags));
    toast({ title: "Tag supprimé", description: `Le tag "${tagToDelete}" a été supprimé de la liste globale.` });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-pastel-text/40 backdrop-blur-md flex items-center justify-center z-[60] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="bg-pastel-card text-pastel-text rounded-xl p-6 w-full max-w-md shadow-pastel-medium"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-pastel-border/60">
            <h2 className="text-xl sm:text-2xl font-semibold text-pastel-primary">Gérer les tags</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-pastel-muted-foreground hover:bg-pastel-muted/70 rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {localExistingTags.length === 0 ? (
            <p className="text-center text-pastel-muted-foreground py-4">Aucun tag personnalisé n'a été sauvegardé.</p>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {localExistingTags.map((tag) => (
                <motion.div
                  key={tag}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-lg shadow-pastel-card-item"
                >
                  <span className="text-sm text-pastel-text/90">{tag}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteTag(tag)}
                    className="px-2.5 py-1 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Supprimer
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
           <Button variant="outline" onClick={onClose} className="w-full mt-6">
            Fermer
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default TagManager;