import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { asTextArray, as2DTextArray } from './_shared/arrayUtils.js';

const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined');
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, name, menu_data, participant_ids, is_shared } = req.body || {};

  if (!Array.isArray(menu_data) || menu_data.length !== 7) {
    return res
      .status(400)
      .json({ error: 'menu_data must be an array of 7 days' });
  }

  if (!user_id || typeof user_id !== 'string') {
    return res.status(400).json({ error: 'user_id required' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name required' });
  }

  try {
    const { data: user, error: userErr } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (userErr || !user) {
      console.warn('create-shared-menu invalid user_id:', userErr?.message);
      return res.status(400).json({ error: 'Invalid user_id' });
    }
  } catch (err) {
    console.error('create-shared-menu user lookup error:', err);
    return res.status(500).json({ error: 'User lookup failed' });
  }

  const shared = typeof is_shared === 'boolean' ? is_shared : false;

  try {
    console.log('Inserting weekly menu:', {
      user_id,
      name,
      menu_data,
      is_shared: shared,
    });
    const sanitizedMenuData = Array.isArray(menu_data)
      ? menu_data
      : {
          ...menu_data,
          tag_preferences: asTextArray(menu_data?.tag_preferences),
          daily_meal_structure: as2DTextArray(
            menu_data?.daily_meal_structure
          ),
          common_menu_settings: JSON.stringify(
            menu_data?.common_menu_settings ?? {}
          ),
        };

    const { data: inserted, error } = await supabaseAdmin
      .from('weekly_menus')
      .insert({
        user_id,
        name,
        menu_data: sanitizedMenuData,
        is_shared: shared,
      })
      .select('id, is_shared') // pour log debug
      .single();

  if (error || !inserted) {
      console.error(
        '🛠 Menu insert error:',
        error || inserted
      );
    return res.status(500).json({ error: error?.message || 'Insert failed' });
  }

    console.log('Menu created with is_shared:', inserted.is_shared);

    if (
      inserted.is_shared &&
      Array.isArray(participant_ids) &&
      participant_ids.length > 0
    ) {
      const rows = participant_ids
        .filter((id: string) => id && id !== user_id)
        .map((id: string) => ({ menu_id: inserted.id, user_id: id }));

      if (rows.length > 0) {
        const { error: partErr } = await supabaseAdmin
          .from('menu_participants')
          .insert(rows);
        if (partErr) {
          console.warn('🛠 menu_participants insert error:', partErr.message);
        }
      }
    }

    return res.status(200).json({ id: inserted.id });
  } catch (err) {
    console.error('🛠 create-shared-menu error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
