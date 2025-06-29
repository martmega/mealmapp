export interface RecipeLike {
  name?: string;
  ingredients?: { name?: string }[];
  instructions?: string | string[] | null;
  description?: string | null;
}

export default function generateRecipeImagePrompt(recipe: RecipeLike): string;
