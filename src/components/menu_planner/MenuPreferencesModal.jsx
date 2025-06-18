import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Settings } from 'lucide-react';
import MenuPreferencesPanel from '@/components/menu_planner/MenuPreferencesPanel.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';

function MenuPreferencesModal({
  isOpen,
  onOpenChange,
  preferences,
  setPreferences,
  availableTags,
  linkedUserProps,
}) {
  const {
    newLinkedUserTag,
    setNewLinkedUserTag,
    isLinkingUser,
    handleAddLinkedUser,
    handleToggleCommonMenu,
    handleLinkedUserRatioChange,
    handleRemoveLinkedUser,
  } = linkedUserProps;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shadow-pastel-button hover:shadow-pastel-button-hover">
          <Settings className="w-4 h-4 mr-2" />
          Préférences
        </Button>
      </DialogTrigger>
      <DialogContent overlayClassName="backdrop-blur-sm bg-white/90" className="max-w-3xl bg-white bg-opacity-95 rounded-xl shadow-lg z-50">
        <DialogHeader>
          <DialogTitle>Préférences du Menu</DialogTitle>
          <DialogDescription>
            Configurez vos préférences pour la génération automatique du menu.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <MenuPreferencesPanel
            preferences={preferences}
            setPreferences={setPreferences}
            availableTags={availableTags}
            newLinkedUserTag={newLinkedUserTag}
            setNewLinkedUserTag={setNewLinkedUserTag}
            isLinkingUser={isLinkingUser}
            handleAddLinkedUser={handleAddLinkedUser}
            handleToggleCommonMenu={handleToggleCommonMenu}
            handleLinkedUserRatioChange={handleLinkedUserRatioChange}
            handleRemoveLinkedUser={handleRemoveLinkedUser}
          />
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fermer
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MenuPreferencesModal;
