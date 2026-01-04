import { format } from 'date-fns';
import { Target, Check, X, Clock } from 'lucide-react';
import { Prediction, Match } from '@/types';
import { cn } from '@/lib/utils';

interface MyPredictionsListProps {
  predictions: (Prediction & { match: Match })[];
}

export function MyPredictionsList({ predictions }: MyPredictionsListProps) {
  if (predictions.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">No predictions yet</p>
        <p className="text-muted-foreground text-xs mt-1">Head to Matches to make your first prediction!</p>
      </div>
    );
  }

  const getResultIcon = (prediction: Prediction & { match: Match }) => {
    if (prediction.match.status !== 'completed') {
      return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
    if (prediction.points_earned === 5) {
      return <Check className="w-4 h-4 text-primary" />;
    }
    if (prediction.points_earned === 2) {
      return <Check className="w-4 h-4 text-accent" />;
    }
    return <X className="w-4 h-4 text-destructive" />;
  };

  const getResultBadge = (prediction: Prediction & { match: Match }) => {
    if (prediction.match.status !== 'completed') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-secondary text-secondary-foreground">
          Pending
        </span>
      );
    }
    
    return (
      <span className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold",
        prediction.points_earned === 5 && "bg-primary/20 text-primary",
        prediction.points_earned === 2 && "bg-accent/20 text-accent",
        prediction.points_earned === 0 && "bg-destructive/20 text-destructive"
      )}>
        +{prediction.points_earned} pts
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {predictions.map((prediction) => (
        <div 
          key={prediction.id}
          className="glass-card rounded-xl p-4 animate-slide-up"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-muted-foreground">
              {format(new Date(prediction.match.match_date), 'MMM d, yyyy')}
            </span>
            {getResultBadge(prediction)}
          </div>

          <div className="flex items-center gap-3">
            {/* Home Team */}
            <div className="flex-1 flex items-center gap-2">
              <img 
                src={prediction.match.home_team.flag_url || ''} 
                alt={prediction.match.home_team.name}
                className="w-8 h-5 object-cover rounded shadow-sm"
              />
              <span className="text-xs font-medium truncate">
                {prediction.match.home_team.code}
              </span>
            </div>

            {/* Scores */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-[9px] text-muted-foreground mb-0.5">Your pick</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary">
                  <span className="text-sm font-bold">{prediction.predicted_home_score}</span>
                  <span className="text-xs text-muted-foreground">-</span>
                  <span className="text-sm font-bold">{prediction.predicted_away_score}</span>
                </div>
              </div>

              {prediction.match.status === 'completed' && (
                <>
                  {getResultIcon(prediction)}
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-muted-foreground mb-0.5">Result</span>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted">
                      <span className="text-sm font-bold">{prediction.match.home_score}</span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span className="text-sm font-bold">{prediction.match.away_score}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex items-center justify-end gap-2">
              <span className="text-xs font-medium truncate">
                {prediction.match.away_team.code}
              </span>
              <img 
                src={prediction.match.away_team.flag_url || ''} 
                alt={prediction.match.away_team.name}
                className="w-8 h-5 object-cover rounded shadow-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
