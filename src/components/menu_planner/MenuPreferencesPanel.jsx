import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Users,
  Link,
  Unlink,
  Info,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';

const MEAL_TYPE_OPTIONS_DATA = {
  'petit-dejeuner': 'Petit déjeuner',
  entree: 'Entrée',
  plat: 'Plat principal',
  dessert: 'Dessert',
  'encas-sucre': 'Encas sucré',
  'encas-sale': 'Encas salé',
};

function MenuPreferencesPanel({
  preferences,
  setPreferences,
  availableTags,
  newLinkedUserEmail,
  setNewLinkedUserEmail,
  isLinkingUser,
  handleAddLinkedUser,
  handleToggleCommonMenu,
  handleLinkedUserRatioChange,
  handleRemoveLinkedUser,
}) {
  const addMeal = () => {
    const newMealNumber = (preferences.meals?.length || 0) + 1;
    setPreferences({
      ...preferences,
      meals: [
        ...(preferences.meals || []),
        {
          id: Date.now(),
          types: [],
          enabled: true,
          mealNumber: newMealNumber,
        },
      ],
    });
  };

  const removeMeal = (index) => {
    const newMeals = [...(preferences.meals || [])];
    newMeals.splice(index, 1);
    const renumberedMeals = newMeals.map((meal, idx) => ({
      ...meal,
      mealNumber: idx + 1,
    }));
    setPreferences({ ...preferences, meals: renumberedMeals });
  };

  const toggleMealType = (mealIndex, type) => {
    const newMeals = [...(preferences.meals || [])];
    const currentTypes = newMeals[mealIndex].types || [];
    const typeIndex = currentTypes.indexOf(type);

    if (typeIndex === -1) {
      newMeals[mealIndex].types = [...currentTypes, type];
    } else {
      newMeals[mealIndex].types = currentTypes.filter((t) => t !== type);
    }

    setPreferences({ ...preferences, meals: newMeals });
  };

  const moveMeal = (index, direction) => {
    const newMeals = [...(preferences.meals || [])];
    let targetIndex;
    if (direction === 'up' && index > 0) {
      targetIndex = index - 1;
    } else if (direction === 'down' && index < newMeals.length - 1) {
      targetIndex = index + 1;
    } else {
      return;
    }
    [newMeals[index], newMeals[targetIndex]] = [
      newMeals[targetIndex],
      newMeals[index],
    ];
    const renumberedMeals = newMeals.map((meal, idx) => ({
      ...meal,
      mealNumber: idx + 1,
    }));
    setPreferences({ ...preferences, meals: renumberedMeals });
  };

  const addTagPreference = () => {
    if (availableTags?.length > 0) {
      setPreferences({
        ...preferences,
        tagPreferences: [
          ...(preferences.tagPreferences || []),
          { tag: availableTags[0], percentage: 50 },
        ],
      });
    }
  };

  const removeTagPreference = (index) => {
    const newPreferences = [...(preferences.tagPreferences || [])];
    newPreferences.splice(index, 1);
    setPreferences({ ...preferences, tagPreferences: newPreferences });
  };

  const updateTagPreference = (index, field, value) => {
    const newPreferences = [...(preferences.tagPreferences || [])];
    newPreferences[index] = { ...newPreferences[index], [field]: value };
    setPreferences({ ...preferences, tagPreferences: newPreferences });
  };

  const handleServingsPerMealChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setPreferences({ ...preferences, servingsPerMeal: value > 0 ? value : 1 });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft mb-8 space-y-6 overflow-hidden"
    >
      <h3 className="text-xl font-semibold text-pastel-primary">
        Préférences du menu
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label
            htmlFor="servingsPerMeal"
            className="block text-base font-medium mb-1.5 flex items-center"
          >
            <Users className="w-4 h-4 mr-2 text-pastel-secondary" /> Portions
            par repas (défaut)
          </Label>
          <Input
            id="servingsPerMeal"
            type="number"
            value={preferences.servingsPerMeal || 4}
            onChange={handleServingsPerMealChange}
            min="1"
            step="1"
            className="max-w-xs"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="maxCalories"
            className="block text-base font-medium mb-1.5"
          >
            Calories max. par jour
          </Label>
          <Input
            id="maxCalories"
            type="number"
            value={preferences.maxCalories || 2200}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                maxCalories: parseInt(e.target.value) || 0,
              })
            }
            min="500"
            step="50"
            className="max-w-xs"
          />
        </div>
      </div>

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
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-pastel-muted-foreground"
              >
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-pastel-card border border-pastel-border rounded-lg dark:bg-pastel-card dark:border-pastel-border">
              <DialogHeader>
                <DialogTitle>Menu Commun</DialogTitle>
                <DialogDescription>
                  Le menu commun vous permet de planifier des repas en utilisant
                  les recettes d'autres utilisateurs que vous avez liés. Activez
                  cette option pour lier des utilisateurs et ajuster les ratios
                  de contribution pour la génération de menu.
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
            <Label className="text-sm font-medium text-pastel-text/90">
              Utilisateurs liés :
            </Label>
            {(preferences.commonMenuSettings?.linkedUsers || []).map(
              (user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate flex-1">
                    {user.name} {user.isOwner && '(Vous)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={user.ratio || 0}
                      onChange={(e) =>
                        handleLinkedUserRatioChange(index, e.target.value)
                      }
                      className="w-16 h-8 text-xs px-1.5 py-1"
                      min="0"
                      max="100"
                      disabled={
                        user.isOwner &&
                        (preferences.commonMenuSettings?.linkedUsers || [])
                          .length === 1
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
              )
            )}
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
                <Link className="w-3.5 h-3.5 mr-1.5" />{' '}
                {isLinkingUser ? 'Liaison...' : 'Lier'}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-pastel-border/70">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">
            Composition des repas quotidiens
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMeal}
            className="shadow-pastel-button hover:shadow-pastel-button-hover"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un repas
          </Button>
        </div>

        {(preferences.meals || []).map((meal, index) => (
          <motion.div
            key={meal.id || index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 bg-pastel-card-alt p-4 rounded-lg shadow-pastel-card-item"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveMeal(index, 'up')}
                    disabled={index === 0}
                    className="h-7 w-7"
                  >
                    {' '}
                    <ChevronUp className="w-4 h-4" />{' '}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveMeal(index, 'down')}
                    disabled={index === (preferences.meals || []).length - 1}
                    className="h-7 w-7"
                  >
                    {' '}
                    <ChevronDown className="w-4 h-4" />{' '}
                  </Button>
                </div>
                <Label className="font-medium text-pastel-text/90">
                  Repas {meal.mealNumber}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={meal.enabled ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const newMeals = [...(preferences.meals || [])];
                    newMeals[index] = {
                      ...newMeals[index],
                      enabled: !meal.enabled,
                    };
                    setPreferences({ ...preferences, meals: newMeals });
                  }}
                  className="min-w-[90px]"
                >
                  {meal.enabled ? 'Activé' : 'Désactivé'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMeal(index)}
                  className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
                >
                  {' '}
                  <Trash2 className="w-4 h-4" />{' '}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-pastel-border/70">
              {Object.entries(MEAL_TYPE_OPTIONS_DATA).map(
                ([typeKey, label]) => {
                  const isActive = (meal.types || []).includes(typeKey);
                  return (
                    <Button
                      key={typeKey}
                      type="button"
                      size="sm"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => toggleMealType(index, typeKey)}
                      className="rounded-full px-3 py-1 text-xs"
                    >
                      {label}
                    </Button>
                  );
                }
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t border-pastel-border/70">
        <div className="flex justify-between items-center">
          <Label className="text-base font-medium">
            Préférences de tags hebdomadaires
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTagPreference}
            disabled={!availableTags?.length}
            className="shadow-pastel-button hover:shadow-pastel-button-hover"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Ajouter un tag
          </Button>
        </div>

        {(preferences.tagPreferences || []).map((pref, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-3 items-center bg-pastel-card-alt p-3 rounded-lg shadow-pastel-card-item"
          >
            <select
              className="flex-grow h-10 rounded-md bg-pastel-input px-3 text-sm text-pastel-text ring-offset-pastel-background placeholder:text-pastel-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pastel-ring focus-visible:border-pastel-input-focus-border shadow-pastel-input hover:border-pastel-muted-foreground/30 focus-visible:shadow-pastel-input-focus w-full sm:w-auto"
              value={pref.tag}
              onChange={(e) =>
                updateTagPreference(index, 'tag', e.target.value)
              }
            >
              {(availableTags || []).map((tag) => (
                <option key={tag} value={tag}>
                  {' '}
                  {tag}{' '}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input
                type="number"
                className="w-24"
                value={pref.percentage}
                onChange={(e) =>
                  updateTagPreference(
                    index,
                    'percentage',
                    Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                  )
                }
                min="0"
                max="100"
              />
              <span className="text-sm text-pastel-text/80">%</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeTagPreference(index)}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-8 w-8"
            >
              {' '}
              <Trash2 className="w-4 h-4" />{' '}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default MenuPreferencesPanel;
