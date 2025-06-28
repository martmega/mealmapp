import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const TEXT_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_TEXT_CREDIT;
const IMAGE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_IMAGE_CREDIT;


export default function IACredits({ session }) {
  const { toast } = useToast();
  const [credits, setCredits] = useState({ text_credits: 0, image_credits: 0 });
  const [loading, setLoading] = useState(null);

  const fetchCredits = async () => {
    if (!session?.access_token) return;
    try {
      const res = await fetch('/api/get-ia-credits', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      if (data?.ia_credits) setCredits(data.ia_credits);
    } catch (err) {
      console.error('fetch ia credits error:', err);
    }
  };

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchCredits();
    };
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [session]);

  useEffect(() => {
    const handleAiAction = () => fetchCredits();
    window.addEventListener('ai-action-complete', handleAiAction);
    return () => window.removeEventListener('ai-action-complete', handleAiAction);
  }, [session]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('credits_success')) {
      toast.success('Crédits IA ajoutés à votre compte.');
      fetchCredits();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('credits_success');
      window.history.replaceState({}, '', newUrl.toString());
    }
    if (query.get('credits_canceled')) {
      toast.warning('Paiement annulé.');
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('credits_canceled');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [toast]);

  const handlePurchase = async (type) => {
    setLoading(type);
    try {
      const priceId = type === 'text' ? TEXT_PRICE_ID : IMAGE_PRICE_ID;
      const res = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const { url } = data;
      window.location.href = url;
    } catch (err) {
      console.error('purchase credits error:', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft space-y-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-pastel-text/90 border-b border-pastel-border pb-3 mb-5">
        Crédits IA
      </h3>
      <p className="text-sm text-pastel-muted-foreground">
        Crédits restants – Texte : {credits.text_credits ?? 0} / Images : {credits.image_credits ?? 0}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => handlePurchase('text')} disabled={loading === 'text'}>
          {loading === 'text' ? 'Chargement...' : 'Acheter 150 crédits description – 0,20 €'}
        </Button>
        <Button variant="accent" onClick={() => handlePurchase('image')} disabled={loading === 'image'}>
          {loading === 'image' ? 'Chargement...' : 'Acheter 50 crédits image – 0,90 €'}
        </Button>
      </div>
    </div>
  );
}

IACredits.propTypes = {
  session: PropTypes.shape({
    user: PropTypes.shape({ id: PropTypes.string }),
    access_token: PropTypes.string,
  }),
};
