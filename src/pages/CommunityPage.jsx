import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Compass, Eye } from 'lucide-react';
import LoadingScreen from '@/components/layout/LoadingScreen';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.jsx';
import FriendsTab from '@/components/FriendsTab.jsx';
import MyPublicProfile from '@/components/MyPublicProfile.jsx';
import PublicRecipeFeed from '@/components/PublicRecipeFeed.jsx';
import UserSearch from '@/components/UserSearch.jsx';

export default function CommunityPage({
  session,
  userProfile,
  onRequestsChange,
}) {
  const [activeSubTab, setActiveSubTab] = useState('discover');
  const navigate = useNavigate();

  const handleSelectRecipe = (recipe) => {
    if (recipe.user_id === session?.user?.id) {
      navigate(`/app/recipes?open=${recipe.id}`);
    } else {
      navigate(`/app/profile/${recipe.user_id}?recipe=${recipe.id}`);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs
        value={activeSubTab}
        onValueChange={setActiveSubTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <Compass className="w-4 h-4" /> Découvrir
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Amis
          </TabsTrigger>
          <TabsTrigger
            value="my-profile-preview"
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Profil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <div className="space-y-8">
            <UserSearch session={session} />
            <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
              <h2 className="text-xl sm:text-2xl font-bold text-pastel-secondary mb-6 text-center">
                Dernières Recettes Publiques
              </h2>
              <PublicRecipeFeed
                session={session}
                onSelectRecipe={handleSelectRecipe}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          {session && userProfile ? (
            <FriendsTab
              session={session}
              userProfile={userProfile}
              onRequestsChange={onRequestsChange}
            />
          ) : (
            <LoadingScreen message="Chargement des informations utilisateur..." />
          )}
        </TabsContent>

        <TabsContent value="my-profile-preview" className="mt-6">
          {session && userProfile ? (
            <MyPublicProfile session={session} userProfile={userProfile} />
          ) : (
            <LoadingScreen message="Chargement de votre aperçu de profil..." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
