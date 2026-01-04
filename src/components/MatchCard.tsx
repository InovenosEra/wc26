import { format, isPast, differenceInMinutes } from 'date-fns';
import { MapPin, Clock } from 'lucide-react';
import { Match, Prediction } from '@/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: Match;
  prediction?: Prediction | null;
  onPredict: (match: Match) => void;
}

export function MatchCard({ match, prediction, onPredict }: MatchCardProps) {
  const matchDate = new Date(match.match_date);
  const isCompleted = match.status === 'completed';
  const minutesToKickoff = differenceInMinutes(matchDate, new Date());
  const canPredict = !isCompleted && minutesToKickoff > 15;
  const isLive = !isCompleted && isPast(matchDate);

  return (
    <div className="glass-card rounded-xl p-4 animate-slide-up shadow-card">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{format(matchDate, 'MMM d, yyyy • HH:mm')}</span>
        </div>
        {isLive && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-destructive/20 text-destructive animate-pulse">
            LIVE
          </span>
        )}
        {isCompleted && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/20 text-accent">
            FT
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4">
        {/* Home Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <img 
            src={match.home_team.flag_url || ''} 
            alt={match.home_team.name}
            className="w-12 h-8 object-cover rounded shadow-sm"
          />
          <span className="text-xs font-semibold text-center leading-tight">
            {match.home_team.name}
          </span>
        </div>

        {/* Score / VS */}
        <div className="flex flex-col items-center">
          {isCompleted || isLive ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">{match.home_score}</span>
              <span className="text-sm text-muted-foreground">-</span>
              <span className="text-2xl font-bold text-foreground">{match.away_score}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">VS</span>
          )}
          
          {/* User prediction badge */}
          {prediction && (
            <div className={cn(
              "mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium",
              prediction.points_earned === 5 && "bg-primary/20 text-primary",
              prediction.points_earned === 2 && "bg-accent/20 text-accent",
              prediction.points_earned === 0 && isCompleted && "bg-muted text-muted-foreground",
              !isCompleted && "bg-secondary text-secondary-foreground"
            )}>
              Your pick: {prediction.predicted_home_score} - {prediction.predicted_away_score}
              {isCompleted && ` (+${prediction.points_earned}pts)`}
            </div>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <img 
            src={match.away_team.flag_url || ''} 
            alt={match.away_team.name}
            className="w-12 h-8 object-cover rounded shadow-sm"
          />
          <span className="text-xs font-semibold text-center leading-tight">
            {match.away_team.name}
          </span>
        </div>
      </div>

      {/* Stadium */}
      <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <MapPin className="w-3 h-3" />
        <span>{match.stadium}, {match.city}</span>
      </div>

      {/* Predict Button */}
      {canPredict && (
        <Button 
          onClick={() => onPredict(match)}
          className="w-full mt-3 h-9 text-xs font-semibold gradient-gold text-primary-foreground shadow-gold hover:opacity-90 transition-opacity"
        >
          {prediction ? 'Update Prediction' : 'Predict Score'}
        </Button>
      )}
    </div>
  );
}
