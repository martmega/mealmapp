import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-pastel-card-alt border-t border-pastel-border/60 text-pastel-muted-foreground py-8 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm">
            &copy; {currentYear} MealMapp - Clément Marty EI. Tous droits
            réservés.
          </p>
          <nav className="flex space-x-4 sm:space-x-6">
            <Link
              to="/contact"
              className="text-sm hover:text-pastel-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/terms"
              className="text-sm hover:text-pastel-primary transition-colors"
            >
              Conditions Générales
            </Link>
            <Link
              to="/privacy"
              className="text-sm hover:text-pastel-primary transition-colors"
            >
              Politique de Confidentialité
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
