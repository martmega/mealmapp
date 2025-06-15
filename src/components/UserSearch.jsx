import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserSearch } from '@/hooks/useUserSearch';

export default function UserSearch({ session }) {
  const [term, setTerm] = useState('');
  const { results, search, loading, clear } = useUserSearch(session);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) search(term);
    else clear();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
        <Input
          type="text"
          placeholder="Rechercher par pseudo ou @identifiant..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="w-full flex-grow"
        />
        <Button type="submit" variant="primary" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Search className="w-5 h-5 mr-2" />}
          Rechercher
        </Button>
      </form>
      {results.length > 0 && (
        <div className="bg-pastel-card p-6 rounded-xl shadow-pastel-soft">
          <h2 className="text-xl font-semibold text-pastel-primary mb-4">Résultats :</h2>
          <ul className="space-y-3">
            {results.map((user) => (
              <li key={user.id} className="flex items-center justify-between p-3 bg-pastel-card-alt rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={`Avatar de ${user.username}`} className="w-10 h-10 rounded-full object-cover border border-pastel-border" />
                  ) : (
                    <UserCircle className="w-10 h-10 text-pastel-muted-foreground" />
                  )}
                  <div>
                    <span className="font-medium text-pastel-text text-md">{user.username}</span>
                    {user.user_tag && <p className="text-xs text-pastel-muted-foreground font-mono">@{user.user_tag}</p>}
                  </div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/app/profile/${user.id}`}>Voir le profil</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {term && !loading && results.length === 0 && (
        <div className="flex items-center justify-center h-40 bg-pastel-card rounded-xl shadow-pastel-soft px-6 text-center">
          <p className="text-lg text-pastel-muted-foreground">Aucun utilisateur trouvé pour "{term}".</p>
        </div>
      )}
    </div>
  );
}
