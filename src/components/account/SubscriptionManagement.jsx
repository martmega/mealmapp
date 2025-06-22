import React, { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Star, CheckCircle, CreditCard } from 'lucide-react';
import PropTypes from 'prop-types';
import { loadStripe } from '@stripe/stripe-js';

const supabase = getSupabase();

const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51RM7DtGEb36fLGJ0lbRvJ0HCxgKaCzj5iVnWXOSQvengGlpSFHKBEOmb2fYQEPUE0FuwOYZDndSj7IVRy3rijOmi00sJXXZ4sG';
const STANDARD_PRICE_ID = 'price_1RM8x4GEb36fLGJ0Ujde7SpN';
const PREMIUM_PRICE_ID = 'price_1RM8xWGEb36fLGJ04nw7meVK';

let stripePromise;
const getStripe = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export default function SubscriptionManagement({
  session,
  userProfile,
  onProfileUpdate,
}) {
  const { toast } = useToast();
  console.log('SubscriptionManagement subscription tier:', userProfile?.subscription_tier);
  const [loadingSubscriptionAction, setLoadingSubscriptionAction] =
    useState(null);
  const [currentSubscriptionTier, setCurrentSubscriptionTier] =
    useState('standard');

  useEffect(() => {
    if (userProfile) {
      setCurrentSubscriptionTier(userProfile.subscription_tier || 'standard');
    }
  }, [userProfile]);

  const handleSubscription = async (tier) => {
    if (!STRIPE_PUBLISHABLE_KEY || !STANDARD_PRICE_ID || !PREMIUM_PRICE_ID) {
      toast({
        title: 'Configuration Stripe incomplète',
        description: 'Les clés Stripe ne sont pas correctement configurées.',
        variant: 'destructive',
      });
      return;
    }

    let priceIdToUse =
      tier === 'premium' ? PREMIUM_PRICE_ID : STANDARD_PRICE_ID;

    setLoadingSubscriptionAction(tier);

    try {
      const stripe = await getStripe();
      if (!stripe) {
        toast({
          title: 'Erreur Stripe',
          description: 'Impossible de charger Stripe.',
          variant: 'destructive',
        });
        setLoadingSubscriptionAction(null);
        return;
      }

      const { error } = await stripe.redirectToCheckout({
        lineItems: [{ price: priceIdToUse, quantity: 1 }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/app/account?subscription_success=true&tier=${tier}`,
        cancelUrl: `${window.location.origin}/app/account?subscription_canceled=true`,
        customerEmail: session.user.email,
        clientReferenceId: session.user.id,
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        toast({
          title: 'Erreur de paiement',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Subscription handling error:', error);
      toast({
        title: "Erreur d'abonnement",
        description: "Une erreur s'est produite.",
        variant: 'destructive',
      });
    } finally {
      setLoadingSubscriptionAction(null);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get('subscription_success')) {
      const tier = query.get('tier');
      toast({
        title: 'Abonnement réussi !',
        description: `Vous êtes maintenant abonné au niveau ${tier === 'premium' ? 'Premium' : 'Standard'}.`,
      });

      (async () => {
        try {
          const { error: appMetaError } = await supabase.auth.updateUser({
            data: { subscription_tier: tier },
          });
          if (appMetaError)
            console.warn(
              'Error updating app_metadata for subscription:',
              appMetaError
            );

          setCurrentSubscriptionTier(tier);
          if (onProfileUpdate) {
            await onProfileUpdate();
          }
        } catch (error) {
          toast({
            title: 'Erreur de mise à jour du profil',
            description: error.message,
            variant: 'destructive',
          });
        }
      })();

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('subscription_success');
      newUrl.searchParams.delete('tier');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (query.get('subscription_canceled')) {
      toast({
        title: 'Paiement annulé',
        description: "Le processus d'abonnement a été annulé.",
        variant: 'default',
      });
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('subscription_canceled');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [toast, onProfileUpdate]);

  const isStandard = currentSubscriptionTier === 'standard';
  const isPremium = currentSubscriptionTier === 'premium';

  return (
    <div className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft space-y-6">
      <h3 className="text-xl sm:text-2xl font-semibold text-pastel-text/90 border-b border-pastel-border pb-3 mb-5">
        Gestion de l&apos;Abonnement
      </h3>
      <p className="text-sm text-pastel-muted-foreground">
        Statut actuel : {currentSubscriptionTier === 'premium' ? 'Premium' : 'Standard'}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className={`p-5 rounded-lg border-2 ${isStandard ? 'border-pastel-primary shadow-pastel-medium' : 'border-pastel-border bg-pastel-card-alt'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-pastel-primary">
              Standard
            </h4>
            {isStandard && (
              <CheckCircle className="h-6 w-6 text-pastel-primary" />
            )}
          </div>
          <p className="text-2xl font-bold text-pastel-text mb-1">
            0,90 €{' '}
            <span className="text-sm font-normal text-pastel-muted-foreground">
              / mois
            </span>
          </p>
          <ul className="text-sm text-pastel-text/80 space-y-1.5 my-4">
            <li>Accès aux fonctionnalités de base</li>
            <li>Création de recettes illimitée</li>
            <li>Planification de menus</li>
            <li>Listes de courses automatiques</li>
          </ul>
          {!isStandard && (
            <Button
              variant="secondary"
              className="w-full mt-3"
              onClick={() => handleSubscription('standard')}
              disabled={loadingSubscriptionAction === 'standard'}
            >
              {loadingSubscriptionAction === 'standard' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5 mr-2" />
              )}
              {loadingSubscriptionAction === 'standard'
                ? 'Chargement...'
                : 'Choisir Standard'}
            </Button>
          )}
        </div>

        <div
          className={`p-5 rounded-lg border-2 ${isPremium ? 'border-pastel-accent shadow-pastel-medium' : 'border-pastel-border bg-pastel-card-alt'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-lg font-semibold text-pastel-accent">
              Premium
            </h4>
            {isPremium && (
              <CheckCircle className="h-6 w-6 text-pastel-accent" />
            )}
          </div>
          <p className="text-2xl font-bold text-pastel-text mb-1">
            2,90 €{' '}
            <span className="text-sm font-normal text-pastel-muted-foreground">
              / mois
            </span>
          </p>
          <ul className="text-sm text-pastel-text/80 space-y-1.5 my-4">
            <li>Toutes les fonctionnalités Standard</li>
            <li className="font-medium text-pastel-accent/90">
              Génération IA de descriptions
            </li>
            <li className="font-medium text-pastel-accent/90">
              Génération IA d&apos;images
            </li>
            <li>Support prioritaire (à venir)</li>
          </ul>
          {!isPremium && (
            <Button
              variant="accent"
              className="w-full mt-3"
              onClick={() => handleSubscription('premium')}
              disabled={loadingSubscriptionAction === 'premium'}
            >
              {loadingSubscriptionAction === 'premium' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Star className="w-5 h-5 mr-2" />
              )}
              {loadingSubscriptionAction === 'premium'
                ? 'Chargement...'
                : 'Choisir Premium'}
            </Button>
          )}
        </div>
      </div>
      {(isStandard || isPremium) && (
        <p className="text-xs text-pastel-muted-foreground text-center pt-4">
          Pour gérer votre abonnement existant (annulation, modification de la
          carte), veuillez vous connecter à votre compte Stripe.
        </p>
      )}
    </div>
  );
}

SubscriptionManagement.propTypes = {
  session: PropTypes.shape({
    user: PropTypes.shape({
      id: PropTypes.string,
      email: PropTypes.string,
    }),
  }),
  userProfile: PropTypes.shape({
    subscription_tier: PropTypes.string,
  }),
  onProfileUpdate: PropTypes.func,
};
