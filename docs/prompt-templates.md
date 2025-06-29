# AI Prompt Templates

This document collects the main prompts used by the application.

## Recipe Description
```
Tu es un assistant culinaire.
Écris une courte description attrayante (2 à 3 phrases max) pour un plat appelé "${title}".
Voici ses ingrédients : ${ingredients}.
Voici les instructions de préparation : ${instructions}.
Ne recopie pas les instructions. Utilise-les uniquement pour savoir de quoi il s'agit.
Fais une description appétissante du plat final, comme on le lirait dans une carte de restaurant ou sur une fiche recette pour donner envie de le cuisiner.
```
(see `api/ai.ts` with `action=description`)

## Cost Estimation
```
Tu es un assistant culinaire. Estime le coût total d'une recette pour les quantités ci-dessous. Donne uniquement le prix en euros, sans explication ni unité. Par exemple : "4.70".

Recette : ${recipe.name}
Nombre de portions : ${recipe.servings}

Ingrédients :
${ingredientsList}
```
(see `api/ai.ts` with `action=cost`)

## Recipe Image Generation
The helper `generateRecipeImagePrompt()` builds an English description such as:
```
A delicious and realistic photo of a home-cooked dish: fried eggs with bacon and grilled cheese. It includes: egg, bacon, bread, cheese. Styled simply on a plate or in a pan. Lighting is natural and appetizing. Do not use a restaurant or gourmet aesthetic. Show the food clearly. No people, no logos, no text. Focus on realistic food presentation, homemade style.
```
(see `src/lib/recipeImagePrompt.js`)

## Instruction Formatting
```
Tu es un assistant culinaire. Reprends ces instructions de recette et transforme-les en une suite d'étapes claires, numérotées si nécessaire.
Chaque étape doit être concise, contenir une seule action ou phase logique, et être formulée de manière naturelle.
Retourne le tout sous forme d’un tableau JSON, chaque élément représentant une étape.
N’ajoute pas d’ingrédients, ne déduis pas de quantités, ne change pas l’ordre des étapes.
Voici les instructions brutes : ${rawText}
```
(see `api/ai.ts` with `action=format`)
