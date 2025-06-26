import React from 'react';
import { Navigate } from 'react-router-dom';
import ProfileInformationForm from '@/components/account/ProfileInformationForm';
import EmailForm from '@/components/account/EmailForm';
import PasswordChangeForm from '@/components/account/PasswordChangeForm';
import SubscriptionManagement from '@/components/account/SubscriptionManagement';
import IACredits from '@/components/account/IACredits';

export default function AccountPage({ session, userProfile, onProfileUpdate }) {
  if (!session) {
    return <Navigate to="/app/recipes" replace />;
  }
  if (!session || !userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft text-center p-8">
          Chargement des informations du compte...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto px-4 pb-12">
      <h2 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-10 text-center tracking-tight">
        Mon Compte
      </h2>

      <section className="bg-muted/10 p-6 rounded-xl space-y-6">
        <h3 className="text-xl font-semibold text-pastel-secondary">Profil</h3>
        <ProfileInformationForm
          session={session}
          userProfile={userProfile}
          onProfileUpdate={onProfileUpdate}
        />
      </section>

      <section className="bg-muted/10 p-6 rounded-xl space-y-6">
        <h3 className="text-xl font-semibold text-pastel-secondary">Email</h3>
        <EmailForm session={session} onProfileUpdate={onProfileUpdate} />
      </section>

      <section className="bg-muted/10 p-6 rounded-xl space-y-6">
        <h3 className="text-xl font-semibold text-pastel-secondary">Mot de passe</h3>
        <PasswordChangeForm />
      </section>

      <section className="bg-muted/10 p-6 rounded-xl space-y-6">
        <h3 className="text-xl font-semibold text-pastel-secondary">Abonnement</h3>
        <SubscriptionManagement
          session={session}
          userProfile={userProfile}
          onProfileUpdate={onProfileUpdate}
        />
      </section>

      {userProfile.subscription_tier === 'vip' && (
        <section className="bg-muted/10 p-6 rounded-xl space-y-6">
          <IACredits session={session} />
        </section>
      )}
    </div>
  );
}
