// src/components/dashboard/FavoritesPanel.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Heart, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface FavoritesPanelProps {
  userId: number;
  onSelectFavorite: (question: string) => void;
  refreshTrigger?: number; // Add this prop to trigger refresh
}

interface Favorite {
  id: number;
  question: string;
  sql_query: string;
  tags?: string;
  description?: string;
  created_at: string;
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  userId,
  onSelectFavorite,
  refreshTrigger, // Receive refresh trigger
}) => {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites when userId changes OR when refreshTrigger changes
  useEffect(() => {
    if (userId) {
      loadFavorites();
    }
  }, [userId, refreshTrigger]); // Add refreshTrigger as dependency

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/favorites/${userId}`);
      const data = await response.json();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!window.confirm('Remove this query from favorites?')) return;

    try {
      await fetch(`http://localhost:8000/api/favorites/${favoriteId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      setFavorites(favorites.filter(f => f.id !== favoriteId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-600" />
          <h3 className="text-xs font-medium text-foreground">Favorites</h3>
          {favorites.length > 0 && (
            <span className="text-xs text-muted-foreground">({favorites.length})</span>
          )}
        </div>
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      {isExpanded && (
        <ScrollArea className="max-h-60">
          <div className="px-2 pb-2">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">Loading...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-4 px-2">
                <Heart className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No favorites yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Click the heart icon on any query to save it
                </p>
              </div>
            ) : (
              favorites.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => onSelectFavorite(fav.question)}
                  className="flex items-start gap-2 p-2 mb-1 rounded hover:bg-pink-50 cursor-pointer transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-foreground truncate">
                      {fav.question}
                    </h4>
                    <code className="text-xs text-muted-foreground bg-gray-100 px-1 rounded truncate block mt-1">
                      {fav.sql_query}
                    </code>
                    {fav.tags && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {fav.tags.split(',').map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => removeFavorite(fav.id, e)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3 w-3 text-red-600" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default FavoritesPanel;