import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

const supabase = getSupabase();

export default function CreditsConfirmedPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      try {
        const res = await fetch('/api/get-ia-credits', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        });
        if (res.ok) {
          toast.success('Cr\u00e9dits IA ajout\u00e9s \u00e0 votre compte.');
        }
      } catch (err) {
        console.error('refresh credits error:', err);
      } finally {
        setLoading(false);
      }
    };
    refresh();
  }, [navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-2xl font-bold text-pastel-primary">
        Cr\u00e9dits confirm\u00e9s
      </h1>
      {loading ? (
        <p>V\u00e9rification en cours...</p>
      ) : (
        <Button onClick={() => navigate('/app/account')}>
          Retour au compte
        </Button>
      )}
    </div>
  );
}
