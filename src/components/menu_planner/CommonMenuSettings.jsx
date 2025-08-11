import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link, Unlink } from 'lucide-react';

function CommonMenuSettings({ isShared, participants = [], setParticipants = () => {} }) {
  const [newUserId, setNewUserId] = useState('');

  const removeParticipant = (id) => {
    setParticipants(participants.filter((p) => p.user_id !== id));
  };

  const changeWeight = (id, value) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return;
    setParticipants(
      participants.map((p) => (p.user_id === id ? { ...p, weight: num } : p))
    );
  };

  const addParticipant = () => {
    const id = newUserId.trim();
    if (!id || participants.some((p) => p.user_id === id)) return;
    setParticipants([...participants, { user_id: id, weight: 0 }]);
    setNewUserId('');
  };

  return (
    <div className="space-y-4 pt-4 border-t border-pastel-border/70">
      {isShared && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 bg-pastel-card-alt p-4 rounded-lg shadow-pastel-card-item mt-3"
        >
          <Label className="text-sm font-medium text-pastel-text/90">Participants</Label>
          {participants.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate flex-1">{p.user_id}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.05"
                  value={p.weight ?? 0}
                  onChange={(e) => changeWeight(p.user_id, e.target.value)}
                  className="w-16 h-8 text-xs px-1.5 py-1"
                  min="0"
                  max="1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                  onClick={() => removeParticipant(p.user_id)}
                >
                  <Unlink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          <div className="text-right text-xs text-pastel-muted-foreground">
            Total{' '}
            {participants
              .reduce((sum, u) => sum + (Number(u.weight) || 0), 0)
              .toFixed(2)}
          </div>
          <div className="flex gap-2 pt-2 border-t border-pastel-border/50">
            <Input
              type="text"
              placeholder="Identifiant de l'utilisateur à lier"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              className="flex-grow h-9 text-sm"
            />
            <Button onClick={addParticipant} disabled={!newUserId.trim()} size="sm" className="h-9">
              <Link className="w-3.5 h-3.5 mr-1.5" /> Lier
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default CommonMenuSettings;
