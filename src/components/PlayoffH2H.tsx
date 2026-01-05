import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, History, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoricalMatch {
  year: number;
  tournament: string;
  stage: string;
  team1Score: number;
  team2Score: number;
  venue: string;
  winner: string;
}

interface HistoricalData {
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  matches: HistoricalMatch[];
  notableStats: string;
}

interface PlayoffH2HProps {
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  compact?: boolean;
}

export function PlayoffH2H({ homeTeam, awayTeam, homeFlag, awayFlag, compact = true }: PlayoffH2HProps) {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if teams are TBD placeholders
    if (
      homeTeam.includes('Winner') || 
      homeTeam.includes('TBD') || 
      awayTeam.includes('Winner') || 
      awayTeam.includes('TBD') ||
      homeTeam.includes('Place') ||
      awayTeam.includes('Place')
    ) {
      return;
    }

    fetchH2H();
  }, [homeTeam, awayTeam]);

  const fetchH2H = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: result, error: fetchError } = await supabase.functions.invoke('h2h-history', {
        body: {
          homeTeam,
          awayTeam,
        },
      });

      if (fetchError) throw fetchError;

      if (result?.history) {
        setData(result.history);
      }
    } catch (err) {
      console.error('Error fetching H2H:', err);
      setError('Could not load history');
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything for TBD matchups
  if (
    homeTeam.includes('Winner') || 
    homeTeam.includes('TBD') || 
    awayTeam.includes('Winner') || 
    awayTeam.includes('TBD') ||
    homeTeam.includes('Place') ||
    awayTeam.includes('Place')
  ) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
        <span className="text-[9px] text-muted-foreground ml-1">Loading H2H...</span>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  if (data.totalMatches === 0) {
    return (
      <div className="text-center py-2 border-t border-border/30">
        <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
          <Trophy className="w-3 h-3" />
          <span>First World Cup meeting!</span>
        </div>
      </div>
    );
  }

  if (compact && !expanded) {
    return (
      <button 
        onClick={() => setExpanded(true)}
        className="w-full py-2 border-t border-border/30 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center justify-center gap-2 text-[9px]">
          <History className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">
            World Cup H2H: 
            <span className="font-medium text-foreground ml-1">
              {data.team1Wins}-{data.draws}-{data.team2Wins}
            </span>
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </div>
      </button>
    );
  }

  return (
    <div className="border-t border-border/30">
      <button 
        onClick={() => setExpanded(false)}
        className="w-full py-2 hover:bg-secondary/30 transition-colors flex items-center justify-center gap-1"
      >
        <History className="w-3 h-3 text-primary" />
        <span className="text-[9px] font-medium text-primary">World Cup History</span>
        <ChevronUp className="w-3 h-3 text-muted-foreground" />
      </button>

      <div className="px-3 pb-3 space-y-2 animate-fade-in">
        {/* Stats Summary */}
        <div className="flex items-center justify-between gap-2 py-2 px-3 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-1.5">
            {homeFlag && <img src={homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
            <span className="text-xs font-bold text-primary">{data.team1Wins}</span>
          </div>
          <div className="text-center">
            <span className="text-xs font-medium text-muted-foreground">{data.draws} draws</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-accent">{data.team2Wins}</span>
            {awayFlag && <img src={awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />}
          </div>
        </div>

        {/* Notable Stats */}
        {data.notableStats && (
          <p className="text-[9px] text-muted-foreground text-center italic">
            {data.notableStats}
          </p>
        )}

        {/* Match List */}
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {data.matches.slice(0, 5).map((match, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between px-2 py-1.5 bg-muted/30 rounded text-[9px]"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-8">{match.year}</span>
                <span className="text-muted-foreground capitalize truncate max-w-[60px]">
                  {match.stage}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "font-bold",
                  match.team1Score > match.team2Score && "text-primary"
                )}>
                  {match.team1Score}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className={cn(
                  "font-bold",
                  match.team2Score > match.team1Score && "text-accent"
                )}>
                  {match.team2Score}
                </span>
              </div>
            </div>
          ))}
        </div>

        {data.matches.length > 5 && (
          <p className="text-[8px] text-muted-foreground text-center">
            +{data.matches.length - 5} more matches
          </p>
        )}
      </div>
    </div>
  );
}
