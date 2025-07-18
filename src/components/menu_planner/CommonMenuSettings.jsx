import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Info, Link, Unlink } from 'lucide-react';

function CommonMenuSettings({
  preferences,
  newLinkedUserTag,
  setNewLinkedUserTag,
  isLinkingUser,
  handleAddLinkedUser,
  handleLinkedUserRatioChange,
  handleRemoveLinkedUser,
  isShared,
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-pastel-border/70">
      {isShared && (
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
              type="text"
              placeholder="Identifiant de l'utilisateur à lier"
              value={newLinkedUserTag}
              onChange={(e) => setNewLinkedUserTag(e.target.value)}
              className="flex-grow h-9 text-sm"
            />
            <Button
              onClick={handleAddLinkedUser}
              disabled={isLinkingUser || !newLinkedUserTag.trim()}
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
