import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function PasswordChangeForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const resetPasswordFields = () => {
    setNewPassword('');
    setConfirmNewPassword('');
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword.trim() === '') {
      toast({
        title: 'Information',
        description: 'Le champ du nouveau mot de passe est vide.',
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Erreur',
        description: 'Les nouveaux mots de passe ne correspondent pas.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (passwordError) throw passwordError;

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été modifié avec succès.',
      });
      resetPasswordFields();
    } catch (error) {
      toast({
        title: 'Erreur de changement de mot de passe',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const noPasswordChangeMade = newPassword === '' && confirmNewPassword === '';

  return (
    <form
      onSubmit={handlePasswordChange}
      className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft space-y-5"
    >
      <h3 className="text-xl sm:text-2xl font-semibold text-pastel-text/90 border-b border-pastel-border pb-3 mb-5">
        Changer le mot de passe
      </h3>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Laissez vide pour ne pas changer"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">
          Confirmer le nouveau mot de passe
        </Label>
        <Input
          id="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          placeholder="Laissez vide pour ne pas changer"
        />
      </div>
      <Button
        type="submit"
        variant="default"
        className="w-full py-2.5 text-sm mt-4"
        disabled={loading || noPasswordChangeMade}
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {loading ? 'Sauvegarde...' : 'Changer le mot de passe'}
      </Button>
    </form>
  );
}
