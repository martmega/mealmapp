import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { getUserFromRequest } from '../src/utils/auth.js';
import generateRecipeImagePrompt from '../src/lib/recipeImagePrompt.js';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_BUCKETS } from './_shared/constants.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  if (subscriptionTier !== 'premium' && subscriptionTier !== 'standard' && subscriptionTier !== 'vip') {
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

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OpenAI API key' });
  }

  try {
    const openai = new OpenAI({ apiKey });
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
  } catch (err) {
    console.error('OpenAI error:', err);
    return res
      .status(500)
      .json({ error: 'Internal Server Error', details: String(err) });
  }
}
