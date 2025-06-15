import React from 'react';
import { Navigate } from 'react-router-dom';
import ProfileInformationForm from '@/components/account/ProfileInformationForm';
import EmailForm from '@/components/account/EmailForm';
import PasswordChangeForm from '@/components/account/PasswordChangeForm';
import SubscriptionManagement from '@/components/account/SubscriptionManagement';

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
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      <h2 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-10 text-center tracking-tight">
        Mon Compte
      </h2>

      <ProfileInformationForm
        session={session}
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
      />

      <EmailForm session={session} onProfileUpdate={onProfileUpdate} />

      <PasswordChangeForm />

      <SubscriptionManagement
        session={session}
        userProfile={userProfile}
        onProfileUpdate={onProfileUpdate}
      />
    </div>
  );
}
