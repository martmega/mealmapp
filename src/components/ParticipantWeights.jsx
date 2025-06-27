import React from 'react';
import SignedImage from './SignedImage';
import { Input } from './ui/input';
import { SUPABASE_BUCKETS } from '@/config/constants.client';
import { DEFAULT_AVATAR_URL } from '@/lib/images';

export default function ParticipantWeights({
  participants = [],
  weights = {},
  onWeightChange,
}) {
  if (!Array.isArray(participants) || participants.length === 0) return null;

  const handleChange = (id, value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    const clamped = Math.max(0, Math.min(1, num));
    onWeightChange && onWeightChange(id, clamped);
  };

  return (
    <div className="bg-pastel-card p-4 rounded-lg shadow-pastel-soft flex flex-wrap items-center gap-3">
      <span className="font-semibold text-pastel-text">Participants :</span>
      {participants.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          {p.avatar_url ? (
            <SignedImage
              bucket={SUPABASE_BUCKETS.avatars}
              path={p.avatar_url}
              alt={p.username}
              fallback={DEFAULT_AVATAR_URL}
              className="w-8 h-8 rounded-full object-cover border border-pastel-border"
            />
          ) : (
            <span className="w-8 h-8 rounded-full bg-pastel-muted flex items-center justify-center text-xs text-pastel-muted-foreground">
              {p.username?.charAt(0) || 'U'}
            </span>
          )}
          <span className="text-sm">{p.username}</span>
          <Input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={weights[p.id] ?? 0}
            onChange={(e) => handleChange(p.id, e.target.value)}
            className="w-16 h-7 text-xs px-1 py-0.5"
          />
        </div>
      ))}
    </div>
  );
}
