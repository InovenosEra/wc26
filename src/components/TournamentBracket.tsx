import { cn } from '@/lib/utils';
import { Trophy, Flag } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface BracketMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag?: string;
  awayFlag?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'scheduled' | 'live' | 'completed' | 'tbd';
  date?: string;
}

// Simplified bracket for tree view (QF onwards)
const treeBracket = {
  quarterFinals: [
    { id: 'QF-1', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
    { id: 'QF-2', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
    { id: 'QF-3', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
    { id: 'QF-4', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
  ],
  semiFinals: [
    { id: 'SF-1', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
    { id: 'SF-2', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
  ],
  final: { id: 'F', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
  thirdPlace: { id: '3rd', homeTeam: 'TBD', awayTeam: 'TBD', status: 'tbd' as const },
};

// Earlier rounds data
const earlierRounds = {
  roundOf32: [
    { id: 'R32-1', homeTeam: '1A', awayTeam: '2B', status: 'tbd' as const },
    { id: 'R32-2', homeTeam: '1C', awayTeam: '2D', status: 'tbd' as const },
    { id: 'R32-3', homeTeam: '1E', awayTeam: '2F', status: 'tbd' as const },
    { id: 'R32-4', homeTeam: '1G', awayTeam: '2H', status: 'tbd' as const },
    { id: 'R32-5', homeTeam: '1B', awayTeam: '2A', status: 'tbd' as const },
    { id: 'R32-6', homeTeam: '1D', awayTeam: '2C', status: 'tbd' as const },
    { id: 'R32-7', homeTeam: '1F', awayTeam: '2E', status: 'tbd' as const },
    { id: 'R32-8', homeTeam: '1H', awayTeam: '2G', status: 'tbd' as const },
    { id: 'R32-9', homeTeam: '1I', awayTeam: '2J', status: 'tbd' as const },
    { id: 'R32-10', homeTeam: '1K', awayTeam: '2L', status: 'tbd' as const },
    { id: 'R32-11', homeTeam: '1J', awayTeam: '2I', status: 'tbd' as const },
    { id: 'R32-12', homeTeam: '1L', awayTeam: '2K', status: 'tbd' as const },
    { id: 'R32-13', homeTeam: '3rd Place', awayTeam: '3rd Place', status: 'tbd' as const },
    { id: 'R32-14', homeTeam: '3rd Place', awayTeam: '3rd Place', status: 'tbd' as const },
    { id: 'R32-15', homeTeam: '3rd Place', awayTeam: '3rd Place', status: 'tbd' as const },
    { id: 'R32-16', homeTeam: '3rd Place', awayTeam: '3rd Place', status: 'tbd' as const },
  ],
  roundOf16: [
    { id: 'R16-1', homeTeam: 'W1', awayTeam: 'W2', status: 'tbd' as const },
    { id: 'R16-2', homeTeam: 'W3', awayTeam: 'W4', status: 'tbd' as const },
    { id: 'R16-3', homeTeam: 'W5', awayTeam: 'W6', status: 'tbd' as const },
    { id: 'R16-4', homeTeam: 'W7', awayTeam: 'W8', status: 'tbd' as const },
    { id: 'R16-5', homeTeam: 'W9', awayTeam: 'W10', status: 'tbd' as const },
    { id: 'R16-6', homeTeam: 'W11', awayTeam: 'W12', status: 'tbd' as const },
    { id: 'R16-7', homeTeam: 'W13', awayTeam: 'W14', status: 'tbd' as const },
    { id: 'R16-8', homeTeam: 'W15', awayTeam: 'W16', status: 'tbd' as const },
  ],
};

// Qualification remaining matches
const qualificationBracket = [
  { id: 'PO-1', homeTeam: 'AFC 5th', awayTeam: 'CONCACAF 4th', status: 'tbd' as const, date: 'Mar 2026' },
  { id: 'PO-2', homeTeam: 'CONMEBOL 6th', awayTeam: 'OFC 1st', status: 'tbd' as const, date: 'Mar 2026' },
  { id: 'PO-3', homeTeam: 'CAF 5th', awayTeam: 'AFC Play-off', status: 'tbd' as const, date: 'Mar 2026' },
  { id: 'PO-4', homeTeam: 'UEFA Play-off', awayTeam: 'CONCACAF Play-off', status: 'tbd' as const, date: 'Mar 2026' },
];

// Compact match card for tree view
function TreeMatchCard({ match, size = 'normal' }: { match: BracketMatch; size?: 'small' | 'normal' | 'large' }) {
  const isTbd = match.status === 'tbd';
  
  const sizeClasses = {
    small: 'w-[90px] text-[8px]',
    normal: 'w-[110px] text-[9px]',
    large: 'w-[130px] text-[10px]',
  };
  
  return (
    <div className={cn(
      "rounded-md border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm",
      sizeClasses[size],
      match.status === 'live' && "border-accent ring-1 ring-accent/50"
    )}>
      <div className={cn(
        "flex items-center justify-between px-1.5 py-1 border-b border-border/30",
        isTbd ? "text-muted-foreground" : "text-foreground"
      )}>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {match.homeFlag ? (
            <img src={match.homeFlag} alt="" className="w-3 h-2 object-cover rounded-[2px]" />
          ) : (
            <div className="w-3 h-2 bg-muted rounded-[2px]" />
          )}
          <span className="truncate font-medium">{match.homeTeam}</span>
        </div>
        {match.homeScore !== null && match.homeScore !== undefined && (
          <span className="font-bold ml-1">{match.homeScore}</span>
        )}
      </div>
      <div className={cn(
        "flex items-center justify-between px-1.5 py-1",
        isTbd ? "text-muted-foreground" : "text-foreground"
      )}>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {match.awayFlag ? (
            <img src={match.awayFlag} alt="" className="w-3 h-2 object-cover rounded-[2px]" />
          ) : (
            <div className="w-3 h-2 bg-muted rounded-[2px]" />
          )}
          <span className="truncate font-medium">{match.awayTeam}</span>
        </div>
        {match.awayScore !== null && match.awayScore !== undefined && (
          <span className="font-bold ml-1">{match.awayScore}</span>
        )}
      </div>
    </div>
  );
}

// Connector line component
function Connector({ direction, height = 40 }: { direction: 'left' | 'right' | 'horizontal'; height?: number }) {
  if (direction === 'horizontal') {
    return (
      <div className="flex items-center">
        <div className="w-3 h-[2px] bg-primary/40" />
      </div>
    );
  }
  
  return (
    <svg 
      width="24" 
      height={height} 
      className="flex-shrink-0"
      style={{ minHeight: height }}
    >
      {direction === 'right' ? (
        <path 
          d={`M0,${height/2} L12,${height/2} L12,${height} L24,${height}`}
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2"
          strokeOpacity="0.4"
        />
      ) : (
        <path 
          d={`M24,${height/2} L12,${height/2} L12,0 L0,0`}
          fill="none" 
          stroke="hsl(var(--primary))" 
          strokeWidth="2"
          strokeOpacity="0.4"
        />
      )}
    </svg>
  );
}

// Bracket tree visualization
function BracketTree() {
  return (
    <div className="relative">
      {/* Finals Section with Trophy */}
      <div className="flex justify-center mb-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            <span className="text-xs font-bold">CHAMPION</span>
            <Trophy className="w-5 h-5" />
          </div>
          <TreeMatchCard match={treeBracket.final} size="large" />
        </div>
      </div>

      {/* Connecting lines from SF to Final */}
      <div className="flex justify-center mb-2">
        <svg width="200" height="30" className="mx-auto">
          <path 
            d="M50,30 L50,15 L100,15 L100,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          <path 
            d="M150,30 L150,15 L100,15 L100,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* Semi Finals */}
      <div className="flex justify-center gap-16 mb-2">
        {treeBracket.semiFinals.map((match) => (
          <div key={match.id} className="flex flex-col items-center">
            <div className="text-[9px] text-muted-foreground mb-1 font-medium">Semi Final</div>
            <TreeMatchCard match={match} size="normal" />
          </div>
        ))}
      </div>

      {/* Connecting lines from QF to SF */}
      <div className="flex justify-center mb-2">
        <svg width="320" height="30" className="mx-auto">
          {/* Left SF connections */}
          <path 
            d="M40,30 L40,15 L80,15 L80,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          <path 
            d="M120,30 L120,15 L80,15 L80,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          {/* Right SF connections */}
          <path 
            d="M200,30 L200,15 L240,15 L240,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
          <path 
            d="M280,30 L280,15 L240,15 L240,0" 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth="2"
            strokeOpacity="0.4"
          />
        </svg>
      </div>

      {/* Quarter Finals */}
      <div className="flex justify-center gap-4 mb-4">
        {treeBracket.quarterFinals.map((match, idx) => (
          <div key={match.id} className="flex flex-col items-center">
            <div className="text-[8px] text-muted-foreground mb-1">QF {idx + 1}</div>
            <TreeMatchCard match={match} size="small" />
          </div>
        ))}
      </div>

      {/* 3rd Place Match */}
      <div className="flex justify-center mt-6 pt-4 border-t border-border/30">
        <div className="flex flex-col items-center">
          <div className="text-[9px] text-muted-foreground mb-1 font-medium">3rd Place</div>
          <TreeMatchCard match={treeBracket.thirdPlace} size="normal" />
        </div>
      </div>
    </div>
  );
}

// Earlier rounds grid view
function EarlierRoundsView() {
  return (
    <div className="space-y-4">
      {/* Round of 16 */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-secondary/30 border-b border-border">
          <h4 className="text-xs font-semibold">Round of 16 <span className="text-muted-foreground font-normal">(8 matches)</span></h4>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {earlierRounds.roundOf16.map((match) => (
              <TreeMatchCard key={match.id} match={match} size="small" />
            ))}
          </div>
        </div>
      </div>

      {/* Round of 32 */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2 bg-secondary/30 border-b border-border">
          <h4 className="text-xs font-semibold">Round of 32 <span className="text-muted-foreground font-normal">(16 matches)</span></h4>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {earlierRounds.roundOf32.map((match) => (
              <TreeMatchCard key={match.id} match={match} size="small" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function KnockoutBracket() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-primary">Knockout Stage Bracket</h3>
        </div>
        <div className="p-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Bracket will be filled after group stage completes
          </p>
        </div>
      </div>

      {/* Visual Bracket Tree */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-2 bg-secondary/30 border-b border-border">
          <h4 className="text-xs font-semibold">Final Rounds</h4>
        </div>
        <ScrollArea className="w-full">
          <div className="p-4 min-w-[360px]">
            <BracketTree />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Earlier Rounds */}
      <EarlierRoundsView />
    </div>
  );
}

export function QualificationBracket() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2">
          <Flag className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-primary">Remaining Qualification</h3>
        </div>
        <div className="p-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Inter-confederation playoffs to determine final spots
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-2 bg-secondary/30 border-b border-border">
          <h4 className="text-xs font-semibold">Inter-confederation Playoffs</h4>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {qualificationBracket.map((match) => (
              <div key={match.id} className="flex flex-col items-center">
                <div className="text-[8px] text-muted-foreground mb-1">{match.date}</div>
                <TreeMatchCard match={match} size="normal" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Qualified Teams Summary */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-2 bg-secondary/30 border-b border-border">
          <h4 className="text-xs font-semibold">Qualification Status</h4>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Qualified Teams</span>
            <span className="font-bold text-accent">44 / 48</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-accent h-2 rounded-full transition-all" style={{ width: '91.6%' }} />
          </div>
          <div className="text-[10px] text-muted-foreground text-center mt-2">
            4 spots remaining via playoffs
          </div>
        </div>
      </div>
    </div>
  );
}
