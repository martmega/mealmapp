import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentResultPage() {
  const [params] = useSearchParams();
  const success = params.get('success');
  const cancelled = params.get('cancelled');

  useEffect(() => {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('success');
    newUrl.searchParams.delete('cancelled');
    window.history.replaceState({}, '', newUrl.toString());
  }, []);

  let title = 'Statut de paiement inconnu';
  let description = "Nous n'avons pas pu déterminer le statut du paiement.";
  let icon = null;

  if (success) {
    title = 'Paiement réussi';
    description = 'Vos crédits IA ont été ajoutés à votre compte.';
    icon = <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />;
  } else if (cancelled) {
    title = 'Paiement annulé';
    description = 'La transaction a été annulée.';
    icon = <XCircle className="h-12 w-12 text-red-500 mx-auto" />;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl mx-auto bg-pastel-card p-6 sm:p-10 rounded-xl shadow-pastel-soft text-center space-y-6">
        {icon}
        <h1 className="text-3xl font-bold text-pastel-primary">{title}</h1>
        <p className="text-lg text-pastel-text/90">{description}</p>
        <Link to="/app/account" className="text-pastel-accent hover:underline">
          Retour à mon compte
        </Link>
      </div>
    </div>
  );
}
