import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

function ServingsAdjuster({
  servings,
  onDecrease,
  onIncrease,
  min = 1,
  max = 99,
}) {
  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-pastel-text/70 hover:text-pastel-text hover:bg-pastel-card/30 rounded-full"
        onClick={onDecrease}
        disabled={servings <= min}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="mx-1.5 text-sm font-medium min-w-[20px] text-center">
        {servings}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-pastel-text/70 hover:text-pastel-text hover:bg-pastel-card/30 rounded-full"
        onClick={onIncrease}
        disabled={servings >= max}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default ServingsAdjuster;
