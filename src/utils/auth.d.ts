import { VercelRequest } from '@vercel/node';
import { User } from '@supabase/supabase-js';

export function getUserFromRequest(req: VercelRequest): Promise<User | null>;
