import React from 'react';
import { Mail, Briefcase } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-xl mx-auto bg-pastel-card p-6 sm:p-10 rounded-xl shadow-pastel-soft text-pastel-text">
        <h1 className="text-3xl sm:text-4xl font-bold text-pastel-primary mb-8 text-center">
          Contactez-nous
        </h1>

        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <Briefcase className="h-6 w-6 text-pastel-secondary mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-pastel-secondary">Nom de l'entreprise :</h2>
              <p className="text-lg">Clément Marty EI</p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <Mail className="h-6 w-6 text-pastel-secondary mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-pastel-secondary">Support Client :</h2>
              <a 
                href="mailto:hello.mealmapp@gmail.com" 
                className="text-lg text-pastel-accent hover:underline"
              >
                hello.mealmapp@gmail.com
              </a>
              <p className="text-sm text-pastel-muted-foreground mt-1">
                Pour toute question ou demande de support, n'hésitez pas à nous envoyer un email.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-pastel-border">
            <h2 className="text-xl font-semibold text-pastel-secondary mb-3">Description des produits ou services proposés :</h2>
            <p className="mb-2">🍽️ Planifiez vos repas, simplement.</p>
            <p className="mb-2">MealMapp est votre assistant personnel pour une cuisine organisée et équilibrée. Ajoutez vos propres recettes, indiquez vos préférences alimentaires, et laissez l'application générer automatiquement un menu hebdomadaire personnalisé.</p>
            <p className="mb-2">🎯 Fini les prises de tête du dimanche soir : MealMapp sélectionne pour vous les meilleures combinaisons de plats selon vos goûts, pour une semaine équilibrée, variée et savoureuse.</p>
            <p className="mb-2">🛒 Et ce n’est pas tout : une liste de courses intelligente est automatiquement créée avec tous les ingrédients nécessaires pour la semaine. Vous gagnez du temps, vous réduisez le gaspillage, et vous cuisinez l’esprit léger.</p>
        </div>

      </div>
    </div>
  );
}