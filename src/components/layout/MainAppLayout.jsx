import React from 'react';
import {
  useLocation,
  useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Calendar,
  ShoppingCart,
  LogOut,
  LogIn,
  UserCircle,
  Moon,
  Sun,
  Star,
  Utensils,
  Users,
} from 'lucide-react';

const isLegalPage = (pathname) => {
  return ['/terms', '/privacy', '/contact'].includes(pathname);
};

export default function MainAppLayout({
  children,
  session,
  userProfile,
  activeTab,
  setActiveTabInternal,
  handleSignOut,
  showAuth,
  setShowAuth,
  toggleDarkMode,
  darkMode,
}) {
  const location = useLocation();
  const showMainNavigation = !isLegalPage(location.pathname);
  const routerNavigate = useRouterNavigate();

  const handleTabClick = (tab) => {
    setActiveTabInternal(tab.id);
    routerNavigate(tab.path);
  };

  return (
    <>
      <header className="border-b border-pastel-border/60 dark:border-pastel-border/30 shadow-pastel-soft sticky top-0 z-40 bg-pastel-card dark:bg-pastel-card-alt bg-opacity-90 dark:bg-opacity-80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-pastel-primary dark:text-pastel-primary-hover flex items-center">
              <Utensils className="h-7 w-7 mr-2 text-pastel-secondary dark:text-pastel-secondary-hover" />
              Mealmapp{' '}
              <span className="text-xs font-normal text-pastel-muted-foreground dark:text-pastel-muted-foreground/80 ml-2 tracking-wider">
                Alpha
              </span>
            </h1>
            <div className="flex items-center gap-2 sm:gap-3">
              {userProfile?.subscription_tier === 'premium' && (
                <span className="flex items-center text-sm font-medium text-yellow-500 bg-yellow-500/10 px-2.5 py-1 rounded-full">
                  <Star className="h-4 w-4 mr-1.5 text-yellow-400" /> Premium
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-pastel-accent dark:text-pastel-accent-hover hover:bg-pastel-accent/10 dark:hover:bg-pastel-accent/20 rounded-full"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              {session ? (
                <Button variant="outline" onClick={handleSignOut} size="sm">
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Déconnexion
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setShowAuth(true)}
                  size="sm"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Connexion
                </Button>
              )}
            </div>
          </div>
          {showMainNavigation && (
            <nav className="flex space-x-1 sm:space-x-2 mt-5 overflow-x-auto pb-1 -mb-px">
              {[
                {
                  id: 'recipes',
                  label: 'Recettes',
                  icon: PlusCircle,
                  path: '/app/recipes',
                },
                {
                  id: 'menu',
                  label: 'Menu',
                  icon: Calendar,
                  path: '/app/menu',
                },
                {
                  id: 'shopping',
                  label: 'Courses',
                  icon: ShoppingCart,
                  path: '/app/shopping',
                },
                ...(session
                  ? [
                      {
                        id: 'community',
                        label: 'Communauté',
                        icon: Users,
                        path: '/app/community',
                      },
                    ]
                  : []),
                ...(session
                  ? [
                      {
                        id: 'account',
                        label: 'Mon Compte',
                        icon: UserCircle,
                        path: '/app/account',
                      },
                    ]
                  : []),
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant="ghost"
                  onClick={() => handleTabClick(tab)}
                  className={`px-3 py-1.5 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-pastel-primary/10 dark:bg-pastel-primary/20 text-pastel-primary dark:text-pastel-primary-hover border-b-2 border-pastel-primary dark:border-pastel-primary-hover'
                        : 'text-pastel-text/60 dark:text-pastel-text/70 hover:bg-pastel-muted/70 dark:hover:bg-pastel-muted/30 hover:text-pastel-text dark:hover:text-pastel-text/90 border-b-2 border-transparent'
                    }`}
                >
                  <tab.icon className="w-3.5 h-3.5 mr-1.5 hidden sm:inline-block" />
                  {tab.label}
                </Button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow">
        {children}
      </main>
    </>
  );
}
