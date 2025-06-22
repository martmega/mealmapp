import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '@/lib/supabase';

const supabase = getSupabase();

export default function useSessionRequired() {
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      }
    };
    verify();
  }, [navigate]);
}

