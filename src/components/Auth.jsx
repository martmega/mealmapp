import React, { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import SignUpForm from '@/components/SignUpForm';

const supabase = getSupabase();

export default function Auth({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUp, setShowSignUp] = useState(false);
  const { toast } = useToast();

  const isEmail = (input) => /\S+@\S+\.\S+/.test(input);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    let loginEmail = emailOrUsername;
    try {
      if (!isEmail(emailOrUsername)) {
        const { data: userData, error: userError } = await supabase
          .from('public_user_view')
          .select('email')
          .eq('username', emailOrUsername)
          .single();

        if (userError || !userData) {
          toast({
            title: 'Utilisateur introuvable',
            description: "Aucun compte trouvé avec ce nom d'utilisateur.",
            variant: 'destructive',
          });
          return;
        }

        loginEmail = userData.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) {
        console.error('Login error →', error);
        toast({
          title: 'Erreur de connexion',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Connecté !',
          description: 'Vous êtes maintenant connecté à votre compte.',
        });
        onClose();
      }
    } catch (unexpectedError) {
      console.error('Unexpected login issue →', unexpectedError);
      toast({
        title: 'Erreur inattendue',
        description:
          "Une erreur s'est produite lors de la tentative de connexion.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (showSignUp) {
    return (
      <SignUpForm
        onClose={onClose}
        onBackToLogin={() => setShowSignUp(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-pastel-card p-8 rounded-xl shadow-lg relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-3xl font-bold text-center text-pastel-text mb-8">
          Connexion
        </h2>

        <form className="space-y-6">
          <div>
            <label
              htmlFor="email-login"
              className="block text-sm font-medium text-pastel-text"
            >
              Email ou Identifiant
            </label>
            <input
              id="email-login"
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div>
            <label
              htmlFor="password-login"
              className="block text-sm font-medium text-pastel-text"
            >
              Mot de passe
            </label>
            <input
              id="password-login"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div className="flex flex-col space-y-4">
            <Button
              onClick={handleLogin}
              disabled={loading || !emailOrUsername || !password}
              className="w-full"
            >
              {loading ? 'Chargement...' : 'Se connecter'}
            </Button>
            <Button
              onClick={() => setShowSignUp(true)}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Chargement...' : "S'inscrire"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
