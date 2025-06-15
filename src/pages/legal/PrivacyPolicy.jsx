import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto bg-pastel-card p-6 sm:p-10 rounded-xl shadow-pastel-soft text-pastel-text">
        <h1 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-8 text-center">
          Politique de Confidentialité
        </h1>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-3">
            Introduction
          </h2>
          <p className="mb-3">
            MealMapp ("nous", "notre", "nos") s'engage à protéger la vie privée de ses utilisateurs ("vous", "votre"). Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous utilisez notre application web MealMapp (le "Service").
          </p>
          <p>
            Veuillez lire attentivement cette politique de confidentialité. SI VOUS N'ÊTES PAS D'ACCORD AVEC LES TERMES DE CETTE POLITIQUE DE CONFIDENTIALITÉ, VEUILLEZ NE PAS ACCÉDER AU SERVICE.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-3">
            Collecte de vos informations
          </h2>
          <p className="mb-2">
            Nous pouvons collecter des informations vous concernant de différentes manières. Les informations que nous pouvons collecter via le Service comprennent :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4 mb-3">
            <li>
              <strong>Données personnelles :</strong> Informations d'identification personnelle, telles que votre nom d'utilisateur (pseudo), adresse e-mail, date de naissance, et informations de paiement que vous nous fournissez volontairement lorsque vous vous inscrivez au Service ou lorsque vous choisissez de participer à diverses activités liées au Service, comme les abonnements.
            </li>
            <li>
              <strong>Données d'utilisation :</strong> Informations que nos serveurs collectent automatiquement lorsque vous accédez au Service, telles que votre adresse IP, votre type de navigateur, votre système d'exploitation, vos temps d'accès et les pages que vous avez consultées directement avant et après avoir accédé au Service.
            </li>
             <li>
              <strong>Données de recettes et de menus :</strong> Toutes les informations que vous entrez concernant vos recettes, vos préférences alimentaires et les menus générés.
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-3">
            Utilisation de vos informations
          </h2>
          <p className="mb-2">
            Avoir des informations précises à votre sujet nous permet de vous fournir une expérience fluide, efficace et personnalisée. Plus précisément, nous pouvons utiliser les informations collectées à votre sujet via le Service pour :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-4 mb-3">
            <li>Créer et gérer votre compte.</li>
            <li>Traiter vos transactions et abonnements.</li>
            <li>Vous envoyer un e-mail concernant votre compte ou votre commande.</li>
            <li>Améliorer l'efficacité et le fonctionnement du Service.</li>
            <li>Surveiller et analyser l'utilisation et les tendances pour améliorer votre expérience avec le Service.</li>
            <li>Vous informer des mises à jour du Service.</li>
            <li>Prévenir les activités frauduleuses, surveiller contre le vol et protéger contre les activités criminelles.</li>
            <li>Respecter les obligations légales.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-3">
            Sécurité de vos informations
          </h2>
          <p>
            Nous utilisons des mesures de sécurité administratives, techniques et physiques pour aider à protéger vos informations personnelles. Bien que nous ayons pris des mesures raisonnables pour sécuriser les informations personnelles que vous nous fournissez, veuillez noter qu'aucune mesure de sécurité n'est parfaite ou impénétrable, et aucune méthode de transmission de données ne peut être garantie contre toute interception ou autre type d'utilisation abusive.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-pastel-secondary mb-3">
            Contactez-nous
          </h2>
          <p>
            Si vous avez des questions ou des commentaires concernant cette politique de confidentialité, veuillez nous contacter à : hello.mealmapp@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}