import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const urlDefined = Boolean(supabaseUrl);
  const keyDefined = Boolean(serviceRoleKey);

  if (urlDefined && keyDefined) {
    return res.status(200).json({
      status: 'success',
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: '✔ définie (masquée)',
    });
  }

  return res.status(500).json({
    status: 'error',
    message: "Variables d'environnement manquantes.",
    SUPABASE_URL: urlDefined ? supabaseUrl : 'non définie',
    SUPABASE_SERVICE_ROLE_KEY: keyDefined
      ? '✔ définie (masquée)'
      : 'non définie',
  });
}
