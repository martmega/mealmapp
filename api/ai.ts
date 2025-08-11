import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../src/utils/auth.js';
import generateRecipeImagePrompt from '../src/lib/recipeImagePrompt.js';
import { SUPABASE_BUCKETS } from './_shared/constants.js';

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const RecipeSchema = z.object({
  title: z.string().optional(),
  ingredients: z.array(z.string()),
  instructions: z.string().min(10),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.query as { action?: string };
  const bodyAction = (req.body as any)?.action;
  const finalAction = (bodyAction || action)?.toString();

  if (!finalAction) {
    return res.status(400).json({ error: 'Missing action parameter' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('public_user_view')
    .select('subscription_tier')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('Subscription fetch error:', profileError.message);
  }

  const subscriptionTier = profile?.subscription_tier || 'standard';

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    switch (finalAction) {
      case 'description': {
        if (
          subscriptionTier !== 'premium' &&
          subscriptionTier !== 'standard' &&
          subscriptionTier !== 'vip'
        ) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        let parsed;
        try {
          const { recipe } = req.body;
          parsed = RecipeSchema.parse(recipe);
        } catch (err) {
          console.error('Payload invalid:', err);
          return res
            .status(400)
            .json({ error: 'Invalid recipe payload', details: err });
        }

        const prompt = `
Tu es un assistant culinaire.
Écris une courte description appétissante (2 à 3 phrases max) pour un plat appelé "${
          parsed.title || 'Recette'
        }".
Voici ses ingrédients : ${parsed.ingredients.join(', ')}.
Voici les instructions de préparation : ${parsed.instructions}.
N'inclus pas les instructions ni de formulation directive.
N’utilise pas de pronoms personnels (comme "notre", "vos", etc.).
N’utilise pas de formules d’accroche comme “Découvrez”, “Succombez à”, etc.
Ne termine pas par une formule type “Bon appétit”.
Écris une description comme sur une fiche recette ou une carte de restaurant, en te concentrant sur le rendu final et l’intérêt gustatif du plat.
`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });
        const description = response.choices[0].message.content || '';

        await supabaseAdmin.rpc('decrement_ia_credit', {
          user_uuid: user.id,
          credit_type: 'text',
        });

        return res.status(200).json({ description });
      }
      case 'image': {
        if (
          subscriptionTier !== 'premium' &&
          subscriptionTier !== 'standard' &&
          subscriptionTier !== 'vip'
        ) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const { data: creditRow, error: creditErr } = await supabaseAdmin
          .from('ia_credits')
          .select('image_credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (creditErr) {
          console.error('ia_credits fetch error:', creditErr.message);
        }

        const currentCredits = creditRow?.image_credits ?? 0;
        if (currentCredits <= 0) {
          return res.status(402).json({ error: 'Insufficient image credits' });
        }

        const { recipe } = req.body;
        if (!recipe) {
          return res.status(400).json({ error: 'Missing recipe' });
        }

        const prompt = generateRecipeImagePrompt(recipe);
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        });

        const dalleUrl = response.data?.[0]?.url;
        if (!dalleUrl) {
          throw new Error('Missing image URL from OpenAI response');
        }
        const imageRes = await fetch(dalleUrl);
        if (!imageRes.ok) throw new Error('Failed to download image');
        const arrayBuffer = await imageRes.arrayBuffer();
        const fileName = `${user.id}-${Date.now()}.png`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from(SUPABASE_BUCKETS.recipes)
          .upload(fileName, Buffer.from(arrayBuffer), {
            contentType: 'image/png',
          });
        if (uploadError) throw uploadError;

        await supabaseAdmin.rpc('decrement_ia_credit', {
          user_uuid: user.id,
          credit_type: 'image',
        });

        return res.status(200).json({ path: fileName });
      }
      case 'cost': {
        if (
          subscriptionTier !== 'premium' &&
          subscriptionTier !== 'vip'
        ) {
          return res.status(403).json({ error: 'Premium only' });
        }

        const { recipe } = req.body;

        const ingredientsList = Array.isArray(recipe.ingredients)
          ? (recipe.ingredients as { quantity: string | number; unit?: string; name: string }[])
              .map((ing) => `- ${ing.quantity} ${ing.unit ? ing.unit + ' ' : ''}${ing.name}`.trim())
              .join('\n')
          : '';

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: `Tu es un assistant culinaire. Estime le coût total d'une recette pour les quantités ci-dessous. Donne uniquement le prix en euros, sans explication ni unité. Par exemple : "4.70".\n\nRecette : ${recipe.name}\nNombre de portions : ${recipe.servings}\n\nIngrédients :\n${ingredientsList}`,
            },
          ],
        });

        const priceText = response.choices[0].message.content || '';
        const normalized = priceText.replace(',', '.').replace(/[^0-9.]/g, '');
        const price = parseFloat(normalized);

        await supabaseAdmin.rpc('decrement_ia_credit', {
          user_uuid: user.id,
          credit_type: 'text',
        });

        return res.status(200).json({ price });
      }
      case 'format': {
        if (
          subscriptionTier !== 'premium' &&
          subscriptionTier !== 'standard' &&
          subscriptionTier !== 'vip'
        ) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const { data: creditRow, error: creditErr } = await supabaseAdmin
          .from('ia_credits')
          .select('text_credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (creditErr) {
          console.error('ia_credits fetch error:', creditErr.message);
        }

        const currentCredits = creditRow?.text_credits ?? 0;
        if (currentCredits <= 0) {
          return res.status(402).json({ error: 'Insufficient text credits' });
        }

        const { rawText } = req.body || {};
        if (!rawText || typeof rawText !== 'string') {
          return res.status(400).json({ error: 'Invalid rawText' });
        }

        const prompt = `Tu es un assistant culinaire. Reprends ces instructions de recette et transforme-les en une suite d'étapes claires, numérotées si nécessaire. \nChaque étape doit être concise, contenir une seule action ou phase logique, et être formulée de manière naturelle.\nRetourne le tout sous forme d’un tableau JSON, chaque élément représentant une étape.\nN’ajoute pas d’ingrédients, ne déduis pas de quantités, ne change pas l’ordre des étapes.\nVoici les instructions brutes : ${rawText}`;

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
        });

        const content = response.choices[0].message.content || '[]';
        let instructions: string[] = [];
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            instructions = parsed.map((step) => {
              if (typeof step === 'string') return step.trim();
              if (step && typeof step === 'object') {
                const value = step.text || step.step || Object.values(step)[0];
                return typeof value === 'string'
                  ? value.trim()
                  : JSON.stringify(step);
              }
              return String(step);
            });
          } else {
            throw new Error('Not an array');
          }
        } catch (err) {
          console.error('Parse error:', err);
          return res.status(500).json({ error: 'Malformed AI response' });
        }

        await supabaseAdmin.rpc('decrement_ia_credit', {
          user_uuid: user.id,
          credit_type: 'text',
        });

        return res.status(200).json({ instructions });
      }
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: String(err) });
  }
}
