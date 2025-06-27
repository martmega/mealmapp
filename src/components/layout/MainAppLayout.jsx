import React from 'react';
import {
  useLocation,
  useNavigate as useRouterNavigate,
  Link,
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
  pendingRequestCount = 0,
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
      <header className="border-b border-pastel-border/50 shadow-sm sticky top-0 z-40 bg-white dark:bg-[#1e1e1e] text-black dark:text-white transition-colors backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link
              to="/recipes"
              className="text-2xl sm:text-3xl font-bold text-pastel-primary dark:text-pastel-primary-hover flex items-center"
            >
              <Utensils className="h-7 w-7 mr-2 text-pastel-secondary dark:text-pastel-secondary-hover" />
              Mealmapp{' '}
              <span className="text-xs font-normal text-pastel-muted-foreground dark:text-pastel-muted-foreground/80 ml-2 tracking-wider">
                Alpha
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              {userProfile?.subscription_tier === 'premium' && (
                <span className="flex items-center text-sm font-medium text-pastel-accent bg-pastel-accent/10 px-2.5 py-1 rounded-full">
                  <Star className="h-4 w-4 mr-1.5 text-pastel-accent" /> Premium
                </span>
              )}
              {userProfile?.subscription_tier === 'vip' && (
                <span className="rounded-xl border border-yellow-500 bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-400">
                  Premium + VIP
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-black dark:text-white hover:text-purple-500 transition-colors rounded-full"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              {session ? (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  size="sm"
                  className="text-black dark:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Déconnexion
                </Button>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setShowAuth(true)}
                  size="sm"
                  className="text-black dark:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Connexion
                </Button>
              )}
            </div>
          </div>
          {showMainNavigation && (
            <nav className="flex gap-2 mt-4 overflow-x-auto pb-1 -mb-px transition-colors duration-300 bg-white text-black dark:bg-[#1e1e1e] dark:text-white">
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
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`cursor-pointer px-3 py-1.5 sm:px-4 rounded border transition-all text-xs sm:text-sm whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? 'bg-pastel-primary text-white font-bold border-pastel-primary'
                        : 'bg-transparent text-pastel-primary border-pastel-primary hover:bg-pastel-primary/10'
                    }`}
                >
                  <span className="relative mr-1.5 hidden sm:inline-block">
                    <tab.icon className="w-3.5 h-3.5" />
                    {pendingRequestCount > 0 &&
                      ['community', 'account'].includes(tab.id) && (
                        <span className="absolute -top-1 -right-1 block w-2 h-2 bg-red-500 rounded-full" />
                      )}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-grow bg-white text-black dark:bg-[#121212] dark:text-white transition-colors duration-300">
        {children}
      </main>
    </>
  );
}
