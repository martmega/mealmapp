export interface RecipeImageData {
  name?: string;
  ingredients?: { name?: string }[];
  instructions?: string;
  description?: string;
}

export default function generateRecipeImagePrompt(recipe: RecipeImageData): string;
