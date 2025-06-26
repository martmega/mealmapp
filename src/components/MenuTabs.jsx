import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import NewMenuModal from '@/components/NewMenuModal.jsx';

export default function MenuTabs({
  menus = [],
  activeMenuId,
  onSelect,
  currentUserId,
  onDelete,
  onCreate,
  friends = [],
}) {
  if (!menus || menus.length === 0) {
    return (
      <div className="text-center py-12 px-6 bg-pastel-card rounded-xl shadow-pastel-soft space-y-4">
        <p className="text-xl text-pastel-muted-foreground">
          Aucun menu disponible pour le moment
        </p>
        <NewMenuModal onCreate={onCreate} friends={friends} />
      </div>
    );
  }
  return (
    <Tabs
      value={activeMenuId || ''}
      onValueChange={onSelect}
      className="w-full"
    >
      <TabsList className="flex overflow-x-auto items-center gap-2">
        {menus.map((menu) => {
          const isShared = menu.is_shared === true;
          // Shared menus turn mint when active
          const colorClasses = isShared
            ? 'shared-menu data-[state=active]:bg-pastel-mint data-[state=active]:text-white'
            : 'border-pastel-primary text-pastel-primary hover:bg-pastel-primary/10 data-[state=active]:bg-pastel-primary';
          return (
            <TabsTrigger
              key={menu.id}
              value={menu.id}
              className={cn(
                'relative group whitespace-nowrap rounded-md px-3 py-1 text-sm transition-all focus:outline-none focus-visible:ring-0 flex items-center',
                colorClasses,
                'data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:border-none'
              )}
            >
              {menu.name || 'Menu'}
              {menu.user_id === currentUserId && (
                <button
                  aria-label="Supprimer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Supprimer ce menu ?')) {
                      onDelete && onDelete(menu.id);
                    }
                  }}
                  className="absolute -top-1 -right-1 hidden group-hover:block text-destructive/70 hover:text-destructive bg-white rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </TabsTrigger>
          );
        })}
        <NewMenuModal
          onCreate={onCreate}
          friends={friends}
          trigger={
            <button
              type="button"
              className="ml-2 px-3 py-1 text-sm border-2 border-dashed border-pastel-primary rounded-md whitespace-nowrap hover:bg-pastel-primary hover:text-white"
            >
              + Nouveau menu
            </button>
          }
        />
      </TabsList>
    </Tabs>
  );
}
