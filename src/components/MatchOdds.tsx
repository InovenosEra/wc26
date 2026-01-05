import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, Loader2 } from 'lucide-react';

// FIFA Rankings data (December 2024) - used for probability calculations
const fifaRankings: Record<string, number> = {
  // UEFA
  'Italy': 10,
  'Wales': 28,
  'Bosnia-Herzegovina': 75,
  'Northern Ireland': 73,
  'Ukraine': 22,
  'Sweden': 45,
  'Poland': 30,
  'Albania': 64,
  'Slovakia': 49,
  'Kosovo': 102,
  'Turkey': 42,
  'Romania': 35,
  'Czechia': 44,
  'Ireland': 58,
  'Denmark': 21,
  'North Macedonia': 68,
  // Intercontinental
  'New Caledonia': 161,
  'Jamaica': 63,
  'DR Congo': 60,
  'Bolivia': 88,
  'Suriname': 137,
  'Iraq': 63,
};

interface MatchOddsProps {
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
}

function calculateWinProbability(homeRank: number, awayRank: number): { home: number; draw: number; away: number } {
  // Use ELO-style probability calculation based on ranking difference
  // Lower rank = better team
  const rankDiff = awayRank - homeRank;
  
  // Base draw probability (around 25% for international matches)
  const baseDraw = 0.22;
  
  // Calculate win probability using logistic function
  // The divisor controls how much ranking difference matters
  const homeWinBase = 1 / (1 + Math.pow(10, -rankDiff / 100));
  
  // Add home advantage bonus (about 5-8% in international football)
  const homeAdvantage = 0.06;
  const homeWin = Math.min(0.85, Math.max(0.1, homeWinBase + homeAdvantage));
  
  // Distribute remaining probability
  const awayWin = Math.min(0.85, Math.max(0.1, 1 - homeWin - baseDraw));
  const draw = 1 - homeWin - awayWin;
  
  return {
    home: Math.round(homeWin * 100),
    draw: Math.round(draw * 100),
    away: Math.round(awayWin * 100),
  };
}

export function MatchOdds({ homeTeam, awayTeam, compact = true }: MatchOddsProps) {
  const [odds, setOdds] = useState<{ home: number; draw: number; away: number } | null>(null);
  
  useEffect(() => {
    // Skip for TBD/Winner matches
    if (
      homeTeam.includes('Winner') || 
      homeTeam.includes('TBD') ||
      awayTeam.includes('Winner') ||
      awayTeam.includes('TBD')
    ) {
      setOdds(null);
      return;
    }
    
    const homeRank = fifaRankings[homeTeam];
    const awayRank = fifaRankings[awayTeam];
    
    if (homeRank && awayRank) {
      setOdds(calculateWinProbability(homeRank, awayRank));
    }
  }, [homeTeam, awayTeam]);
  
  if (!odds) return null;
  
  const homeTeamShort = homeTeam.slice(0, 3).toUpperCase();
  const awayTeamShort = awayTeam.slice(0, 3).toUpperCase();
  
  // Determine favorite
  const favorite = odds.home > odds.away ? 'home' : odds.away > odds.home ? 'away' : 'draw';
  
  if (compact) {
    return (
      <div className="px-2 py-1.5 bg-secondary/20 border-t border-border/30">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
            <TrendingUp className="w-2.5 h-2.5" />
            <span>Win Prob.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-[9px] font-semibold px-1.5 py-0.5 rounded",
              favorite === 'home' ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              {homeTeamShort} {odds.home}%
            </div>
            <div className={cn(
              "text-[9px] font-medium px-1 py-0.5",
              favorite === 'draw' ? "text-primary" : "text-muted-foreground/60"
            )}>
              Draw {odds.draw}%
            </div>
            <div className={cn(
              "text-[9px] font-semibold px-1.5 py-0.5 rounded",
              favorite === 'away' ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              {awayTeamShort} {odds.away}%
            </div>
          </div>
        </div>
        {/* Visual bar */}
        <div className="flex h-1 mt-1 rounded-full overflow-hidden bg-muted/30">
          <div 
            className={cn(
              "transition-all",
              favorite === 'home' ? "bg-primary" : "bg-primary/40"
            )} 
            style={{ width: `${odds.home}%` }} 
          />
          <div 
            className="bg-muted-foreground/30" 
            style={{ width: `${odds.draw}%` }} 
          />
          <div 
            className={cn(
              "transition-all",
              favorite === 'away' ? "bg-accent" : "bg-accent/40"
            )} 
            style={{ width: `${odds.away}%` }} 
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-3 py-2 bg-secondary/20 border-t border-border/30">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium">Win Probability (FIFA Rankings)</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={cn(
          "p-2 rounded-md",
          favorite === 'home' ? "bg-primary/20" : "bg-muted/30"
        )}>
          <div className="text-[10px] text-muted-foreground mb-0.5">{homeTeam}</div>
          <div className={cn(
            "text-sm font-bold",
            favorite === 'home' ? "text-primary" : "text-foreground"
          )}>
            {odds.home}%
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-md",
          favorite === 'draw' ? "bg-primary/20" : "bg-muted/30"
        )}>
          <div className="text-[10px] text-muted-foreground mb-0.5">Draw</div>
          <div className="text-sm font-bold text-foreground">{odds.draw}%</div>
        </div>
        <div className={cn(
          "p-2 rounded-md",
          favorite === 'away' ? "bg-accent/20" : "bg-muted/30"
        )}>
          <div className="text-[10px] text-muted-foreground mb-0.5">{awayTeam}</div>
          <div className={cn(
            "text-sm font-bold",
            favorite === 'away' ? "text-accent" : "text-foreground"
          )}>
            {odds.away}%
          </div>
        </div>
      </div>
    </div>
  );
}
