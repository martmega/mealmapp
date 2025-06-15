import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { X, ArrowLeft } from 'lucide-react';

export default function SignUpForm({ onClose, onBackToLogin }) {
  const [loading, setLoading] = useState(false);
  const [userTag, setUserTag] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (
      !userTag ||
      !username ||
      !email ||
      !dateOfBirth ||
      !password ||
      !confirmPassword
    ) {
      toast({
        title: 'Champs manquants',
        description: 'Veuillez remplir tous les champs.',
        variant: 'destructive',
      });
      return;
    }

    const userTagRegex = /^[a-zA-Z0-9_]{3,15}$/;
    if (!userTagRegex.test(userTag)) {
      toast({
        title: "Format d'Identifiant Unique Invalide",
        description:
          "L'identifiant unique doit contenir 3 à 15 caractères alphanumériques ou underscores.",
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Erreur de mot de passe',
        description: 'Les mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // First, check if user_tag already exists in public_users
      const { data: existingUserTag, error: userTagCheckError } = await supabase
        .from('public_users')
        .select('user_tag')
        .eq('user_tag', userTag.toLowerCase())
        .maybeSingle();

      if (userTagCheckError) {
        // Allow signup to proceed, auth.signUp will handle other errors like duplicate email
        console.warn('Warning checking user_tag:', userTagCheckError.message);
      }

      if (existingUserTag) {
        toast({
          title: 'Identifiant Unique Déjà Pris',
          description:
            'Cet identifiant unique est déjà utilisé. Veuillez en choisir un autre.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            user_tag: userTag.toLowerCase(),
            username: username,
            date_of_birth: dateOfBirth,
            subscription_tier: 'standard',
          },
        },
      });

      if (error) {
        console.error('SignUp error →', error);
        // The trigger handle_new_user might fail if user_tag is duplicate,
        // but auth.signUp itself might succeed if email is unique.
        // The UNIQUE constraint on public_users.user_tag is the primary defense.
        // Error.message from Supabase might directly mention the unique constraint violation from the trigger.
        if (
          error.message.includes('public_users_user_tag_key') ||
          error.message.includes('user_tag_already_taken')
        ) {
          // Adjust based on actual error
          toast({
            title: 'Identifiant Unique Déjà Pris',
            description:
              'Cet identifiant unique est déjà utilisé. Veuillez en choisir un autre.',
            variant: 'destructive',
          });
        } else if (error.message.includes('User already registered')) {
          toast({
            title: 'Email Déjà Utilisé',
            description: 'Un compte existe déjà avec cette adresse email.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Inscription réussie !',
          description:
            'Veuillez vérifier votre email pour confirmer votre compte.',
        });
        onClose();
      }
    } catch (unexpectedError) {
      console.error('Unexpected SignUp issue →', unexpectedError);
      toast({
        title: 'Erreur inattendue',
        description:
          "Une erreur s'est produite lors de la tentative d'inscription.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="w-full max-w-md bg-pastel-card p-8 rounded-xl shadow-lg relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-2"
          onClick={onBackToLogin}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h2 className="text-3xl font-bold text-center text-pastel-text mb-8">
          Inscription
        </h2>

        <form className="space-y-4" onSubmit={handleSignUp}>
          <div>
            <label
              htmlFor="user-tag-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Identifiant Unique (non modifiable)
            </label>
            <input
              id="user-tag-signup"
              type="text"
              value={userTag}
              onChange={(e) => setUserTag(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
              placeholder="Ex: mon_id_123"
            />
            <p className="text-xs text-pastel-muted-foreground mt-1">
              3-15 caractères, alphanumériques et '_'.
            </p>
          </div>
          <div>
            <label
              htmlFor="username-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Pseudo (modifiable)
            </label>
            <input
              id="username-signup"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div>
            <label
              htmlFor="email-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Email
            </label>
            <input
              id="email-signup"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div>
            <label
              htmlFor="dob-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Date de naissance
            </label>
            <input
              id="dob-signup"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div>
            <label
              htmlFor="password-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Mot de passe
            </label>
            <input
              id="password-signup"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password-signup"
              className="block text-sm font-medium text-pastel-text"
            >
              Confirmation du mot de passe
            </label>
            <input
              id="confirm-password-signup"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-pastel-input-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-pastel-card text-pastel-text"
            />
          </div>
          <div className="flex flex-col space-y-4 pt-2">
            <Button
              type="submit"
              disabled={
                loading ||
                !email ||
                !password ||
                !username ||
                !dateOfBirth ||
                !confirmPassword ||
                !userTag
              }
              className="w-full"
            >
              {loading ? 'Chargement...' : "Valider l'inscription"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
