import { useState, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchFactProps {
  homeTeam: string;
  awayTeam: string;
  stadium?: string | null;
  city?: string | null;
  stage?: string;
}

export function MatchFact({ homeTeam, awayTeam, stadium, city, stage }: MatchFactProps) {
  const [fact, setFact] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFact();
  }, [homeTeam, awayTeam]);

  const fetchFact = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('match-fact', {
        body: {
          homeTeam,
          awayTeam,
          stadium,
          city,
          stage,
        },
      });

      if (error) throw error;
      setFact(data?.fact || 'An exciting World Cup match awaits!');
    } catch (error) {
      console.error('Error fetching match fact:', error);
      setFact('Two nations battle for World Cup glory in this exciting matchup!');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFact();
  };

  return (
    <div className="glass-card rounded-xl p-4 animate-fade-in border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-primary">Did You Know?</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="h-6 w-6 -mr-1"
            >
              <RefreshCw className={cn(
                "w-3 h-3 text-muted-foreground",
                refreshing && "animate-spin"
              )} />
            </Button>
          </div>
          
          {loading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading interesting fact...</span>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">
              {fact}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
