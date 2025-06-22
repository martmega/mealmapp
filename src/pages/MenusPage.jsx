import React, { useState } from 'react';
import { useMenus } from '@/hooks/useMenus.js';
import { useSession } from '@/hooks/useSession.js';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';

export default function MenusPage() {
  const { session } = useSession();
  const { menus, createMenu } = useMenus(session);
  const [name, setName] = useState('');
  const [isShared, setIsShared] = useState(false);

  const handleCreate = async () => {
    await createMenu({ name, isShared, participantIds: [] });
    setName('');
    setIsShared(false);
  };

  return (
    <div className="space-y-6 w-full max-w-xl mx-auto">
      <h2 className="text-2xl font-bold">Mes menus</h2>
      <div className="flex flex-col gap-3 bg-pastel-card p-4 rounded-lg">
        <Input
          placeholder="Nom du menu"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="flex items-center space-x-2">
          <Checkbox checked={isShared} onCheckedChange={setIsShared} />
          <span>Menu commun</span>
        </label>
        <Button onClick={handleCreate} disabled={!name.trim()}>
          Créer le menu
        </Button>
      </div>
      <div className="space-y-2">
        {menus.map((m) => (
          <div key={m.id} className="p-3 rounded border border-pastel-border">
            <strong>{m.name}</strong>
            {m.is_shared && <span className="ml-2 text-sm">(partagé)</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
