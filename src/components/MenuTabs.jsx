import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Pencil, X } from 'lucide-react';

export default function MenuTabs({
  menus = [],
  activeMenuId,
  onSelect,
  currentUserId,
  onRename,
  onDelete,
}) {
  return (
    <Tabs
      value={activeMenuId || ''}
      onValueChange={onSelect}
      className="w-full"
    >
      <TabsList className="flex overflow-x-auto">
        {menus.map((menu) => (
          <TabsTrigger
            key={menu.id}
            value={menu.id}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <span>{menu.name || 'Menu'}</span>
            {menu.user_id === currentUserId && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newName = window.prompt('Nouveau nom', menu.name);
                    if (newName && onRename) onRename(menu.id, newName);
                  }}
                  className="text-pastel-muted-foreground hover:text-pastel-primary"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer ce menu ?')) {
                      onDelete && onDelete(menu.id);
                    }
                  }}
                  className="text-destructive/70 hover:text-destructive hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
