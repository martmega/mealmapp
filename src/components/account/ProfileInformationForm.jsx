import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_AVATAR_URL = 'https://placehold.co/100x100?text=Avatar';

export default function ProfileInformationForm({
  session,
  userProfile,
  onProfileUpdate,
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [userTag, setUserTag] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const [initialUsername, setInitialUsername] = useState('');
  const [initialBio, setInitialBio] = useState('');
  const [initialAvatarUrl, setInitialAvatarUrl] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || '');
      setInitialUsername(userProfile.username || '');
      setUserTag(userProfile.user_tag || '');
      setBio(userProfile.bio || '');
      setInitialBio(userProfile.bio || '');
      setAvatarPreview(userProfile.avatar_url || DEFAULT_AVATAR_URL);
      setInitialAvatarUrl(userProfile.avatar_url || DEFAULT_AVATAR_URL);
    }
  }, [userProfile]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: 'Fichier trop volumineux',
          description: "L'image ne doit pas dépasser 5MB.",
          variant: 'destructive',
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setLoading(true);

    let profileUpdated = false;
    let avatarUploaded = false;

    try {
      const userUpdates = {};
      const publicUserUpdates = {};

      if (username.trim() !== initialUsername && username.trim() !== '') {
        userUpdates.username = username.trim();
        publicUserUpdates.username = username.trim();
      }
      if (bio !== initialBio) {
        userUpdates.bio = bio;
        publicUserUpdates.bio = bio;
      }

      if (avatarFile) {
        const fileName = `${session.user.id}/${Date.now()}_${avatarFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
        userUpdates.avatar_url = publicUrl;
        publicUserUpdates.avatar_url = publicUrl;
        avatarUploaded = true;
      }

      // Update auth.users.user_metadata first
      if (Object.keys(userUpdates).length > 0) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: userUpdates,
        });
        if (metadataError) throw metadataError;
        profileUpdated = true;
      }

      // Then, ensure public_users is synced by the trigger (or manually if trigger is not comprehensive)
      // The trigger `handle_user_update` should take care of this.
      // If direct update to public_users is needed (e.g. if trigger is not covering all cases):
      // if (Object.keys(publicUserUpdates).length > 0) {
      //   const { error: publicUserError } = await supabase
      //     .from('public_users')
      //     .update(publicUserUpdates)
      //     .eq('id', session.user.id);
      //   if (publicUserError) console.warn("Could not directly update public_users:", publicUserError.message);
      // }

      if (profileUpdated) {
        setInitialUsername(
          userUpdates.username !== undefined
            ? userUpdates.username
            : initialUsername
        );
        setInitialBio(
          userUpdates.bio !== undefined ? userUpdates.bio : initialBio
        );
        if (avatarUploaded && userUpdates.avatar_url)
          setInitialAvatarUrl(userUpdates.avatar_url);
        toast({
          title: 'Profil mis à jour',
          description: 'Vos informations de profil ont été sauvegardées.',
        });
        if (onProfileUpdate) {
          await onProfileUpdate(); // This will refetch userProfile from App.jsx
        }
      } else {
        toast({
          title: 'Information',
          description: 'Aucune modification détectée pour le profil.',
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur de sauvegarde du profil',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setAvatarFile(null);
    }
  };

  const noProfileChangesMade =
    username === initialUsername && bio === initialBio && !avatarFile;

  return (
    <form
      onSubmit={handleSaveChanges}
      className="bg-pastel-card p-6 sm:p-8 rounded-xl shadow-pastel-soft space-y-5"
    >
      <h3 className="text-xl sm:text-2xl font-semibold text-pastel-text/90 border-b border-pastel-border pb-3 mb-5">
        Informations du profil
      </h3>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {avatarPreview ? (
          <img
            src={avatarPreview}
            alt="Aperçu Avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-pastel-secondary"
          />
        ) : (
          <UserCircle className="w-24 h-24 text-pastel-muted-foreground" />
        )}
        <div className="flex-grow w-full">
          <Label htmlFor="avatar" className="mb-1.5 block">
            Photo de profil
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/png, image/jpeg, image/gif"
            onChange={handleAvatarChange}
            ref={avatarInputRef}
            className="file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-pastel-secondary file:text-pastel-secondary-text hover:file:bg-pastel-secondary-hover"
          />
          <p className="text-xs text-pastel-muted-foreground mt-1.5">
            PNG, JPG, GIF (max 5MB).
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="userTag">Identifiant Unique</Label>
        <div className="flex items-center gap-2">
          <Input
            id="userTag"
            type="text"
            value={userTag}
            readOnly
            className="bg-pastel-muted/50 cursor-not-allowed"
          />
          <Info
            className="w-4 h-4 text-pastel-muted-foreground"
            title="Cet identifiant est unique et ne peut pas être modifié."
          />
        </div>
        <p className="text-xs text-pastel-muted-foreground">
          Utilisé pour vous trouver précisément. Non modifiable.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Pseudo</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Votre pseudo public"
        />
        <p className="text-xs text-pastel-muted-foreground">
          Affiché publiquement. Modifiable.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows="3"
          placeholder="Une courte description de vous..."
          className="flex w-full rounded-md border-2 border-pastel-input-border bg-pastel-card px-3 py-2 text-sm text-pastel-text placeholder-pastel-muted-foreground ring-offset-pastel-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150 shadow-pastel-input hover:border-pastel-muted-foreground/30 focus-visible:shadow-pastel-input-focus dark:border-pastel-input-border dark:bg-pastel-card-alt dark:text-pastel-text dark:placeholder-pastel-muted-foreground"
        />
      </div>
      <Button
        type="submit"
        variant="default"
        className="w-full py-2.5 text-sm mt-4"
        disabled={loading || noProfileChangesMade}
      >
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {loading ? 'Sauvegarde...' : 'Sauvegarder le profil'}
      </Button>
    </form>
  );
}
