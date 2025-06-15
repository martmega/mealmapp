import { useState, useEffect, useCallback } from 'react';
import { generateTagSuggestions } from '@/lib/tagSuggestions';

export default function useTagHandler(formData, setFormData) {
  const [showTagManager, setShowTagManager] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [existingTags, setExistingTags] = useState(() => {
    const saved = localStorage.getItem('existingTags');
    return saved ? JSON.parse(saved) : [];
  });

  const updateSuggestedTags = useCallback(async () => {
    const localExistingTags = JSON.parse(localStorage.getItem('existingTags') || '[]');
    let baseSuggestions = [];
    if (
      formData.ingredients.some((i) => i.name) ||
      formData.meal_types.length > 0 ||
      formData.name
    ) {
      baseSuggestions = await generateTagSuggestions(
        { ...formData, mealTypes: formData.meal_types },
        localExistingTags
      );
    }

    const combinedSuggestions = Array.from(new Set([...localExistingTags, ...baseSuggestions]));
    setSuggestedTags(combinedSuggestions.filter((tag) => !formData.tags.includes(tag)));
  }, [formData.ingredients, formData.meal_types, formData.tags, formData.name]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      updateSuggestedTags();
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [updateSuggestedTags]);

  const handleAddTag = (tag) => {
    if (tag && tag.trim() && !formData.tags.includes(tag.trim())) {
      const newTag = tag.trim();
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      if (!existingTags.includes(newTag)) {
        const updatedSystemTags = Array.from(new Set([...existingTags, newTag]));
        setExistingTags(updatedSystemTags);
        localStorage.setItem('existingTags', JSON.stringify(updatedSystemTags));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  return {
    showTagManager,
    setShowTagManager,
    suggestedTags,
    existingTags,
    setExistingTags,
    handleAddTag,
    handleRemoveTag,
  };
}
