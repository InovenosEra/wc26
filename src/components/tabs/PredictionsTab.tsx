import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Prediction, Match, Team } from '@/types';
import { MyPredictionsList } from '@/components/MyPredictionsList';
import { Loader2, Target, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PredictionsTabProps {
  onAuthClick: () => void;
}

export function PredictionsTab({ onAuthClick }: PredictionsTabProps) {
  const [predictions, setPredictions] = useState<(Prediction & { match: Match })[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPredictions();
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setTotalPoints(data?.total_points || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchPredictions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          id,
          user_id,
          match_id,
          predicted_home_score,
          predicted_away_score,
          points_earned,
          matches!inner(
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
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedPredictions = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        match_id: p.match_id,
        predicted_home_score: p.predicted_home_score,
        predicted_away_score: p.predicted_away_score,
        points_earned: p.points_earned,
        match: {
          id: p.matches.id,
          home_team: p.matches.home_team as Team,
          away_team: p.matches.away_team as Team,
          home_score: p.matches.home_score,
          away_score: p.matches.away_score,
          match_date: p.matches.match_date,
          stadium: p.matches.stadium,
          city: p.matches.city,
          stage: p.matches.stage,
          status: p.matches.status,
        },
      }));
      
      setPredictions(formattedPredictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sign in to track your picks</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          Make predictions, earn points, and compete with friends!
        </p>
        <Button onClick={onAuthClick} className="gradient-gold text-primary-foreground shadow-gold">
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header with Points */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">My Predictions</h2>
        </div>
        
        <div className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30">
          <span className="text-xs text-muted-foreground">Total: </span>
          <span className="text-sm font-bold text-primary">{totalPoints} pts</span>
        </div>
      </div>

      {/* Stats Summary */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-foreground">{predictions.length}</p>
            <p className="text-[10px] text-muted-foreground">Predictions</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-primary">
              {predictions.filter(p => p.points_earned === 5).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Exact</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-accent">
              {predictions.filter(p => p.points_earned === 2).length}
            </p>
            <p className="text-[10px] text-muted-foreground">Correct</p>
          </div>
        </div>
      )}

      {/* Predictions List */}
      <MyPredictionsList predictions={predictions} />
    </div>
  );
}
