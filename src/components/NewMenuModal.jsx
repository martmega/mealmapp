import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Checkbox } from '@/components/ui/Checkbox.jsx';

function NewMenuModal({ onCreate, friends = [], trigger }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleId = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    onCreate({ name, isShared, participantIds: selectedIds });
    setName('');
    setIsShared(false);
    setSelectedIds([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Créer un menu</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau menu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Nom du menu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <label className="flex items-center space-x-2">
            <Checkbox checked={isShared} onChange={setIsShared} />
            <span>Menu commun</span>
          </label>
          {isShared && (
            <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded-md">
              {friends.map((f) => (
                <label key={f.id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedIds.includes(f.id)}
                    onChange={() => toggleId(f.id)}
                  />
                  <span>{f.username || f.id}</span>
                </label>
              ))}
              {friends.length === 0 && <p className="text-sm">Aucun ami disponible</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button onClick={handleCreate}>Créer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewMenuModal;
