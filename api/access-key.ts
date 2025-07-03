import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '../src/utils/auth.js';
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey)
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { key } = req.body || {};
  if (!key) {
    return res.status(400).json({ error: 'Key required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('access_keys')
      .select('id, grants, used_by')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ error: 'Invalid key' });
    }

    if (data.used_by) {
      return res.status(409).json({ error: 'Key already used' });
    }

    const { error: updateError } = await supabaseAdmin
      .from('access_keys')
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      console.warn('access_keys update error:', updateError.message);
    }

    const previousTier =
      (user as any).raw_user_meta_data?.subscription_tier ||
      (user as any).user_metadata?.subscription_tier ||
      'standard';

    const { error: userUpdateErr } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        app_metadata: { subscription_tier: data.grants },
      }
    );
    if (userUpdateErr) {
      console.warn('update user tier error:', userUpdateErr.message);
    }

    if (data.grants === 'vip' && previousTier !== 'vip') {
      const { data: row, error: fetchErr } = await supabaseAdmin
        .from('ia_credits')
        .select('text_credits, image_credits')
        .eq('user_id', user.id)
        .maybeSingle();
      if (fetchErr) {
        console.error('ia_credits fetch error:', fetchErr.message);
      }
      const currentText = row?.text_credits ?? 0;
      const currentImage = row?.image_credits ?? 0;
      const { error: creditErr } = await supabaseAdmin.from('ia_credits').upsert(
        {
          user_id: user.id,
          text_credits: currentText + 100,
          image_credits: currentImage + 10,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      if (creditErr) {
        console.error('ia_credits upsert error:', creditErr.message);
      }
    }

    return res.status(200).json({ grants: data.grants });
  } catch (err) {
    console.error('access-key error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
