// src/components/dashboard/RecommendationsPanel.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecommendationsPanelProps {
  userId: number;
  onSelectRecommendation: (question: string) => void;
}

interface Recommendation {
  type: string;
  category: string;
  title: string;
  question: string;
  description?: string;
  icon: string;
  id?: number;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  userId,
  onSelectRecommendation,
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadRecommendations();
    }
  }, [userId]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://query-genie-h0cy.onrender.com/api/recommendations/${userId}`);
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async (rec: Recommendation) => {
    onSelectRecommendation(rec.question);
    
    // Track usage if it's a template
    if (rec.type === 'template' && rec.id) {
      try {
        await fetch(`https://query-genie-h0cy.onrender.com/api/recommendations/${rec.id}/use`, {
          method: 'POST',
        });
      } catch (error) {
        console.error('Failed to track recommendation use:', error);
      }
    }
  };

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          <h3 className="text-xs font-medium text-foreground">Recommendations</h3>
          {recommendations.length > 0 && (
            <span className="text-xs text-muted-foreground">({recommendations.length})</span>
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
            ) : recommendations.length === 0 ? (
              <div className="text-center py-4 px-2">
                <p className="text-xs text-muted-foreground">No recommendations yet</p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  onClick={() => handleClick(rec)}
                  className="flex gap-2 p-2 mb-1 rounded hover:bg-muted cursor-pointer transition-colors"
                >
                  <span className="text-lg flex-shrink-0">{rec.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-foreground truncate">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-muted-foreground italic truncate mt-0.5">
                      {rec.question}
                    </p>
                    {rec.description && (
                      <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                        {rec.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default RecommendationsPanel;