import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function EmailForm({ session, onProfileUpdate }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');

  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || '');
      setInitialEmail(session.user.email || '');
    }
  }, [session]);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    if (email === initialEmail || email.trim() === '') {
      toast({
        title: 'Information',
        description: "Aucune modification de l'email détectée.",
      });
      return;
    }
    setLoading(true);
    try {
      const { error: emailError } = await supabase.auth.updateUser({
        email: email.trim(),
      });
      if (emailError) throw emailError;

      toast({
        title: 'Email mis à jour',
        description:
          'Un email de confirmation a été envoyé à votre nouvelle adresse.',
      });
      setInitialEmail(email.trim()); // Update initialEmail to prevent repeated "no change" messages
      if (onProfileUpdate) {
        await onProfileUpdate(); // Refresh user profile data in App.jsx
      }
    } catch (error) {
      toast({
        title: "Erreur de mise à jour de l'email",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const noEmailChangeMade = email === initialEmail;

  return (
    <form
      onSubmit={handleEmailChange}
      className="section-card space-y-5 p-6 sm:p-8"
    >
      <h3 className="text-xl sm:text-2xl font-semibold text-pastel-text/90 border-b border-pastel-border pb-3 mb-5">
        Adresse Email
      </h3>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <p className="text-xs text-pastel-muted-foreground pt-1">
        Si vous changez votre email, un message de confirmation sera envoyé à la
        nouvelle adresse.
      </p>
      <Button
        type="submit"
        variant="default"
        className="w-full py-2.5 text-sm mt-4"
        disabled={loading || noEmailChangeMade}
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {loading ? 'Sauvegarde...' : "Sauvegarder l'email"}
      </Button>
    </form>
  );
}
