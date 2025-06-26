import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
let stripePromise;
const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

const supabase = getSupabase();

export default function IACredits({ session }) {
  const { toast } = useToast();
  const [credits, setCredits] = useState({ text_credits: 0, image_credits: 0 });
  const [loading, setLoading] = useState(null);

  const fetchCredits = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('ia_credits')
      .select('text_credits, image_credits')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (data) setCredits(data);
  };

  useEffect(() => {
    fetchCredits();
  }, [session]);

  const handlePurchase = async (type) => {
    setLoading(type);
    try {
      const stripe = await getStripe();
      if (!stripe) {
        toast({ title: 'Stripe error', description: 'Configuration manquante', variant: 'destructive' });
        setLoading(null);
        return;
      }
      const res = await fetch('/api/purchase-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      const { sessionId } = data;
      await stripe.redirectToCheckout({ sessionId });
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
        Texte : {credits.text_credits ?? 0} / Images : {credits.image_credits ?? 0}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => handlePurchase('text')} disabled={loading === 'text'}>
          {loading === 'text' ? 'Chargement...' : 'Acheter 10 crédits texte'}
        </Button>
        <Button variant="accent" onClick={() => handlePurchase('image')} disabled={loading === 'image'}>
          {loading === 'image' ? 'Chargement...' : 'Acheter 5 crédits image'}
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
