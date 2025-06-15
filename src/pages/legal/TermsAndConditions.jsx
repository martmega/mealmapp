import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto bg-pastel-card p-6 sm:p-10 rounded-xl shadow-pastel-soft text-pastel-text">
        <h1 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-8 text-center">
          Conditions Générales et Politiques
        </h1>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            1. Abonnements et services proposés
          </h2>
          <p className="mb-3">
            MealMapp propose deux formules d’abonnement mensuel :
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4 mb-3">
            <li>
              <strong>Formule Standard (0,90€/mois) :</strong> accès aux
              fonctionnalités de création de recettes, génération de menus
              hebdomadaires, liste de courses, stockage sur serveur, absence de
              publicité, et possibilité d’ajouter des images à ses recettes.
            </li>
            <li>
              <strong>Formule Premium (2,90€/mois) :</strong> inclut tous les
              avantages de la formule Standard, ainsi que la génération d’images
              et de descriptions automatiques via intelligence artificielle.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            2. Conditions générales
          </h2>
          <p>
            En souscrivant à un abonnement, l’utilisateur accepte les présentes
            conditions et reconnaît que le service est fourni tel quel, selon
            les fonctionnalités annoncées au moment de la souscription.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            3. Résiliation et remboursement
          </h2>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              L’abonnement peut être annulé à tout moment depuis l’interface
              utilisateur.
            </li>
            <li>
              Aucune pénalité ne sera appliquée pour une résiliation anticipée.
            </li>
            <li>
              En cas de dysfonctionnement technique majeur ou d’impossibilité
              d’accès au service pendant plus de 72h (hors maintenance
              planifiée), un remboursement partiel ou total peut être demandé
              via notre service client.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            4. Litiges
          </h2>
          <p className="mb-3">
            En cas de litige concernant un abonnement ou l’utilisation du
            service :
          </p>
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li>
              L’utilisateur est invité à contacter notre service client en
              priorité (hello.mealmapp@gmail.com) pour tenter une résolution
              amiable.
            </li>
            <li>
              Si aucun accord n’est trouvé dans un délai de 15 jours, le litige
              pourra être porté devant les juridictions compétentes selon la
              législation française.
            </li>
            <li>
              Conformément à l’article L.612-1 du Code de la consommation,
              l’utilisateur peut également recourir à un médiateur de la
              consommation pour résoudre le litige à l’amiable.
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            5. Mise à jour
          </h2>
          <p>
            MealMapp se réserve le droit de modifier cette politique à tout
            moment. Les utilisateurs seront notifiés en cas de changement
            important.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-4">
            Politique d'annulation
          </h2>
          <p>
            La politique d'annulation est la même que celle décrite dans la
            section "Résiliation et remboursement". L'abonnement peut être
            annulé à tout moment sans pénalité.
          </p>
        </section>
      </div>
    </div>
  );
}
