import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';

export default function MenusPage() {
  const [checked, setChecked] = useState(false);
  return (
    <div className="p-6 space-x-2">
      <label className="flex items-center space-x-2">
        <Checkbox checked={checked} onChange={setChecked} />
        <span>Activer une option</span>
      </label>
    </div>
  );
}
