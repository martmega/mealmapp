import React from 'react';
import { Loader2 } from 'lucide-react';

export default function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <Loader2 className="h-10 w-10 animate-spin" />
    </div>
  );
}
