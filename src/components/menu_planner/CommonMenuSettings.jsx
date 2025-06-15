import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Info, Link, Unlink } from 'lucide-react';

function CommonMenuSettings({
  preferences,
  newLinkedUserEmail,
  setNewLinkedUserEmail,
  isLinkingUser,
  handleAddLinkedUser,
  handleToggleCommonMenu,
  handleLinkedUserRatioChange,
  handleRemoveLinkedUser,
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-pastel-border/70">
      <div className="flex items-center space-x-2">
        <Switch
          id="common-menu-toggle"
          checked={preferences.commonMenuSettings?.enabled || false}
          onCheckedChange={handleToggleCommonMenu}
        />
        <Label htmlFor="common-menu-toggle" className="text-base font-medium">
          Activer le menu commun
        </Label>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-pastel-muted-foreground">
              <Info className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-pastel-card border border-pastel-border rounded-lg dark:bg-pastel-card dark:border-pastel-border">
            <DialogHeader>
              <DialogTitle>Menu Commun</DialogTitle>
              <DialogDescription>
                Le menu commun vous permet de planifier des repas en utilisant les recettes d'autres utilisateurs que vous avez liés. Activez cette option pour lier des utilisateurs et ajuster les ratios de contribution pour la génération de menu.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      {preferences.commonMenuSettings?.enabled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 bg-pastel-card-alt p-4 rounded-lg shadow-pastel-card-item mt-3"
        >
          <Label className="text-sm font-medium text-pastel-text/90">Utilisateurs liés :</Label>
          {(preferences.commonMenuSettings?.linkedUsers || []).map((user, index) => (
            <div key={user.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate flex-1">
                {user.name} {user.isOwner && '(Vous)'}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={user.ratio || 0}
                  onChange={(e) => handleLinkedUserRatioChange(index, e.target.value)}
                  className="w-16 h-8 text-xs px-1.5 py-1"
                  min="0"
                  max="100"
                  disabled={
                    user.isOwner &&
                    (preferences.commonMenuSettings?.linkedUsers || []).length === 1
                  }
                />
                <span className="text-xs">%</span>
                {!user.isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleRemoveLinkedUser(user.id)}
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-2 border-t border-pastel-border/50">
            <Input
              type="email"
              placeholder="Email de l'utilisateur à lier"
              value={newLinkedUserEmail}
              onChange={(e) => setNewLinkedUserEmail(e.target.value)}
              className="flex-grow h-9 text-sm"
            />
            <Button
              onClick={handleAddLinkedUser}
              disabled={isLinkingUser || !newLinkedUserEmail.trim()}
              size="sm"
              className="h-9"
            >
              <Link className="w-3.5 h-3.5 mr-1.5" /> {isLinkingUser ? 'Liaison...' : 'Lier'}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default CommonMenuSettings;
