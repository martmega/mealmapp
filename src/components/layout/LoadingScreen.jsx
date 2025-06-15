import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({
  message = 'Chargement de votre univers culinaire...',
  subMessage = 'Préparation des saveurs en cours.',
}) {
  return (
    <div className="min-h-screen bg-pastel-background flex flex-col items-center justify-center text-pastel-text">
      <Loader2 className="h-16 w-16 animate-spin text-pastel-primary mb-6" />
      <p className="text-2xl font-semibold tracking-wider">{message}</p>
      <p className="text-lg text-pastel-primary/80">{subMessage}</p>
    </div>
  );
}
