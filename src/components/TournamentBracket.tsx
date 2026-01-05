import { cn } from '@/lib/utils';
import { Trophy, Flag } from 'lucide-react';

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

interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

// World Cup 2026 Knockout structure - 48 teams, top 2 from each group + 8 best 3rd places
const knockoutBracket: BracketRound[] = [
  {
    name: 'Round of 32',
    matches: [
      { id: 'R32-1', homeTeam: '1A', awayTeam: '2B', status: 'tbd' },
      { id: 'R32-2', homeTeam: '1C', awayTeam: '2D', status: 'tbd' },
      { id: 'R32-3', homeTeam: '1E', awayTeam: '2F', status: 'tbd' },
      { id: 'R32-4', homeTeam: '1G', awayTeam: '2H', status: 'tbd' },
      { id: 'R32-5', homeTeam: '1B', awayTeam: '2A', status: 'tbd' },
      { id: 'R32-6', homeTeam: '1D', awayTeam: '2C', status: 'tbd' },
      { id: 'R32-7', homeTeam: '1F', awayTeam: '2E', status: 'tbd' },
      { id: 'R32-8', homeTeam: '1H', awayTeam: '2G', status: 'tbd' },
      { id: 'R32-9', homeTeam: '1I', awayTeam: '2J', status: 'tbd' },
      { id: 'R32-10', homeTeam: '1K', awayTeam: '2L', status: 'tbd' },
      { id: 'R32-11', homeTeam: '1J', awayTeam: '2I', status: 'tbd' },
      { id: 'R32-12', homeTeam: '1L', awayTeam: '2K', status: 'tbd' },
      { id: 'R32-13', homeTeam: '3rd A/B/C', awayTeam: '3rd D/E/F', status: 'tbd' },
      { id: 'R32-14', homeTeam: '3rd G/H/I', awayTeam: '3rd J/K/L', status: 'tbd' },
      { id: 'R32-15', homeTeam: '3rd Best #1', awayTeam: '3rd Best #2', status: 'tbd' },
      { id: 'R32-16', homeTeam: '3rd Best #3', awayTeam: '3rd Best #4', status: 'tbd' },
    ]
  },
  {
    name: 'Round of 16',
    matches: [
      { id: 'R16-1', homeTeam: 'Winner R32-1', awayTeam: 'Winner R32-2', status: 'tbd' },
      { id: 'R16-2', homeTeam: 'Winner R32-3', awayTeam: 'Winner R32-4', status: 'tbd' },
      { id: 'R16-3', homeTeam: 'Winner R32-5', awayTeam: 'Winner R32-6', status: 'tbd' },
      { id: 'R16-4', homeTeam: 'Winner R32-7', awayTeam: 'Winner R32-8', status: 'tbd' },
      { id: 'R16-5', homeTeam: 'Winner R32-9', awayTeam: 'Winner R32-10', status: 'tbd' },
      { id: 'R16-6', homeTeam: 'Winner R32-11', awayTeam: 'Winner R32-12', status: 'tbd' },
      { id: 'R16-7', homeTeam: 'Winner R32-13', awayTeam: 'Winner R32-14', status: 'tbd' },
      { id: 'R16-8', homeTeam: 'Winner R32-15', awayTeam: 'Winner R32-16', status: 'tbd' },
    ]
  },
  {
    name: 'Quarter Finals',
    matches: [
      { id: 'QF-1', homeTeam: 'Winner R16-1', awayTeam: 'Winner R16-2', status: 'tbd' },
      { id: 'QF-2', homeTeam: 'Winner R16-3', awayTeam: 'Winner R16-4', status: 'tbd' },
      { id: 'QF-3', homeTeam: 'Winner R16-5', awayTeam: 'Winner R16-6', status: 'tbd' },
      { id: 'QF-4', homeTeam: 'Winner R16-7', awayTeam: 'Winner R16-8', status: 'tbd' },
    ]
  },
  {
    name: 'Semi Finals',
    matches: [
      { id: 'SF-1', homeTeam: 'Winner QF-1', awayTeam: 'Winner QF-2', status: 'tbd' },
      { id: 'SF-2', homeTeam: 'Winner QF-3', awayTeam: 'Winner QF-4', status: 'tbd' },
    ]
  },
  {
    name: 'Final',
    matches: [
      { id: 'F', homeTeam: 'Winner SF-1', awayTeam: 'Winner SF-2', status: 'tbd' },
    ]
  }
];

// Qualification remaining matches (confederation playoffs)
const qualificationBracket: BracketRound[] = [
  {
    name: 'Inter-confederation Playoffs',
    matches: [
      { id: 'PO-1', homeTeam: 'AFC 5th', awayTeam: 'CONCACAF 4th', status: 'tbd', date: 'Mar 2026' },
      { id: 'PO-2', homeTeam: 'CONMEBOL 6th', awayTeam: 'OFC 1st', status: 'tbd', date: 'Mar 2026' },
      { id: 'PO-3', homeTeam: 'CAF 5th', awayTeam: 'AFC Play-off', status: 'tbd', date: 'Mar 2026' },
      { id: 'PO-4', homeTeam: 'UEFA Play-off', awayTeam: 'CONCACAF Play-off', status: 'tbd', date: 'Mar 2026' },
    ]
  }
];

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const isTbd = match.status === 'tbd';
  
  return (
    <div className={cn(
      "glass-card rounded-lg p-2 border border-border/50 min-w-[140px]",
      match.status === 'live' && "border-accent animate-pulse"
    )}>
      {match.date && (
        <div className="text-[9px] text-muted-foreground mb-1 text-center">{match.date}</div>
      )}
      <div className="space-y-1">
        <div className={cn(
          "flex items-center justify-between gap-2 text-xs",
          isTbd && "text-muted-foreground"
        )}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {match.homeFlag ? (
              <img src={match.homeFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />
            ) : (
              <Flag className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="truncate text-[10px]">{match.homeTeam}</span>
          </div>
          {match.homeScore !== null && match.homeScore !== undefined && (
            <span className="font-bold text-foreground">{match.homeScore}</span>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-between gap-2 text-xs",
          isTbd && "text-muted-foreground"
        )}>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {match.awayFlag ? (
              <img src={match.awayFlag} alt="" className="w-4 h-3 object-cover rounded-sm" />
            ) : (
              <Flag className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="truncate text-[10px]">{match.awayTeam}</span>
          </div>
          {match.awayScore !== null && match.awayScore !== undefined && (
            <span className="font-bold text-foreground">{match.awayScore}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function KnockoutBracket() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-primary">Knockout Stage</h3>
        </div>
        <div className="p-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Bracket will be filled after group stage
          </p>
        </div>
      </div>

      {knockoutBracket.map((round, roundIndex) => (
        <div key={round.name} className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border">
            <h4 className="text-xs font-semibold flex items-center gap-2">
              {round.name === 'Final' && <Trophy className="w-3.5 h-3.5 text-primary" />}
              {round.name}
              <span className="text-muted-foreground font-normal">({round.matches.length} matches)</span>
            </h4>
          </div>
          <div className="p-3">
            <div className={cn(
              "grid gap-2",
              round.matches.length === 1 && "grid-cols-1 max-w-[200px] mx-auto",
              round.matches.length === 2 && "grid-cols-2",
              round.matches.length === 4 && "grid-cols-2",
              round.matches.length === 8 && "grid-cols-2 sm:grid-cols-4",
              round.matches.length === 16 && "grid-cols-2 sm:grid-cols-4"
            )}>
              {round.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>
      ))}
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

      {qualificationBracket.map((round) => (
        <div key={round.name} className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border">
            <h4 className="text-xs font-semibold">{round.name}</h4>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {round.matches.map((match) => (
                <BracketMatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>
        </div>
      ))}

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
