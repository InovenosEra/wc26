import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Match, Prediction, Team } from '@/types';
import { MatchCard } from '@/components/MatchCard';
import { PredictionModal } from '@/components/PredictionModal';
import { Loader2, CalendarDays, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'upcoming' | 'completed';

export function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMatches();
    if (user) {
      fetchPredictions();
    }
  }, [user]);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_score,
          away_score,
          match_date,
          stadium,
          city,
          stage,
          status,
          home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, group_name)
        `)
        .order('match_date', { ascending: true });

      if (error) throw error;
      
      const formattedMatches = (data || []).map((m: any) => ({
        id: m.id,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
        home_score: m.home_score,
        away_score: m.away_score,
        match_date: m.match_date,
        stadium: m.stadium,
        city: m.city,
        stage: m.stage,
        status: m.status,
      }));
      
      setMatches(formattedMatches);
    } catch (error: any) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const predictionsMap: Record<string, Prediction> = {};
      (data || []).forEach((p: any) => {
        predictionsMap[p.match_id] = p;
      });
      
      setPredictions(predictionsMap);
    } catch (error: any) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handlePredict = (match: Match) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to make predictions.',
      });
      return;
    }
    setSelectedMatch(match);
  };

  const handleSubmitPrediction = async (homeScore: number, awayScore: number) => {
    if (!selectedMatch || !user) return;
    
    try {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          match_id: selectedMatch.id,
          predicted_home_score: homeScore,
          predicted_away_score: awayScore,
        }, {
          onConflict: 'user_id,match_id'
        });

      if (error) throw error;
      
      toast({
        title: 'Prediction saved!',
        description: `${selectedMatch.home_team.code} ${homeScore} - ${awayScore} ${selectedMatch.away_team.code}`,
      });
      
      await fetchPredictions();
    } catch (error: any) {
      console.error('Error saving prediction:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save prediction. Please try again.',
      });
    }
  };

  const filteredMatches = matches.filter((match) => {
    if (filter === 'upcoming') return match.status === 'scheduled';
    if (filter === 'completed') return match.status === 'completed';
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Matches</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'upcoming', 'completed'] as FilterType[]).map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f)}
            className={cn(
              "h-8 px-3 text-xs capitalize whitespace-nowrap",
              filter === f 
                ? "bg-primary/10 text-primary border border-primary/30" 
                : "text-muted-foreground"
            )}
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Match List */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">No matches found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              prediction={predictions[match.id]}
              onPredict={handlePredict}
            />
          ))}
        </div>
      )}

      {/* Prediction Modal */}
      <PredictionModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSubmit={handleSubmitPrediction}
        initialHomeScore={selectedMatch ? predictions[selectedMatch.id]?.predicted_home_score : 0}
        initialAwayScore={selectedMatch ? predictions[selectedMatch.id]?.predicted_away_score : 0}
      />
    </div>
  );
}
