import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Trophy, Flag, Calendar, MapPin, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { fetchQualificationFixtures, QualificationFixture, checkApiConnection } from '@/services/footballApi';
import { MatchOdds } from '@/components/MatchOdds';

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
  venue?: string;
}

interface PlayoffPath {
  name: string;
  semifinal1: BracketMatch;
  semifinal2?: BracketMatch;
  final: BracketMatch;
}

// UEFA European Playoffs - 4 paths, 4 qualifiers
const uefaPlayoffs: PlayoffPath[] = [
  {
    name: 'Path A',
    semifinal1: { 
      id: 'UEFA-A-SF1', 
      homeTeam: 'Wales', 
      awayTeam: 'Bosnia-Herzegovina', 
      homeFlag: 'https://flagcdn.com/w80/gb-wls.png',
      awayFlag: 'https://flagcdn.com/w80/ba.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    semifinal2: { 
      id: 'UEFA-A-SF2', 
      homeTeam: 'Italy', 
      awayTeam: 'Northern Ireland', 
      homeFlag: 'https://flagcdn.com/w80/it.png',
      awayFlag: 'https://flagcdn.com/w80/gb-nir.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    final: { 
      id: 'UEFA-A-F', 
      homeTeam: 'Winner SF1', 
      awayTeam: 'Winner SF2', 
      status: 'tbd', 
      date: 'Mar 31, 2026' 
    },
  },
  {
    name: 'Path B',
    semifinal1: { 
      id: 'UEFA-B-SF1', 
      homeTeam: 'Ukraine', 
      awayTeam: 'Sweden', 
      homeFlag: 'https://flagcdn.com/w80/ua.png',
      awayFlag: 'https://flagcdn.com/w80/se.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    semifinal2: { 
      id: 'UEFA-B-SF2', 
      homeTeam: 'Poland', 
      awayTeam: 'Albania', 
      homeFlag: 'https://flagcdn.com/w80/pl.png',
      awayFlag: 'https://flagcdn.com/w80/al.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    final: { 
      id: 'UEFA-B-F', 
      homeTeam: 'Winner SF1', 
      awayTeam: 'Winner SF2', 
      status: 'tbd', 
      date: 'Mar 31, 2026' 
    },
  },
  {
    name: 'Path C',
    semifinal1: { 
      id: 'UEFA-C-SF1', 
      homeTeam: 'Slovakia', 
      awayTeam: 'Kosovo', 
      homeFlag: 'https://flagcdn.com/w80/sk.png',
      awayFlag: 'https://flagcdn.com/w80/xk.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    semifinal2: { 
      id: 'UEFA-C-SF2', 
      homeTeam: 'Turkey', 
      awayTeam: 'Romania', 
      homeFlag: 'https://flagcdn.com/w80/tr.png',
      awayFlag: 'https://flagcdn.com/w80/ro.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    final: { 
      id: 'UEFA-C-F', 
      homeTeam: 'Winner SF1', 
      awayTeam: 'Winner SF2', 
      status: 'tbd', 
      date: 'Mar 31, 2026' 
    },
  },
  {
    name: 'Path D',
    semifinal1: { 
      id: 'UEFA-D-SF1', 
      homeTeam: 'Czechia', 
      awayTeam: 'Ireland', 
      homeFlag: 'https://flagcdn.com/w80/cz.png',
      awayFlag: 'https://flagcdn.com/w80/ie.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    semifinal2: { 
      id: 'UEFA-D-SF2', 
      homeTeam: 'Denmark', 
      awayTeam: 'North Macedonia', 
      homeFlag: 'https://flagcdn.com/w80/dk.png',
      awayFlag: 'https://flagcdn.com/w80/mk.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026' 
    },
    final: { 
      id: 'UEFA-D-F', 
      homeTeam: 'Winner SF1', 
      awayTeam: 'Winner SF2', 
      status: 'tbd', 
      date: 'Mar 31, 2026' 
    },
  },
];

// Intercontinental Playoffs - 2 paths, 2 qualifiers
const intercontinentalPlayoffs: PlayoffPath[] = [
  {
    name: 'Pathway 1',
    semifinal1: { 
      id: 'IC-1-SF', 
      homeTeam: 'New Caledonia', 
      awayTeam: 'Jamaica', 
      homeFlag: 'https://flagcdn.com/w80/nc.png',
      awayFlag: 'https://flagcdn.com/w80/jm.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026',
      venue: 'Monterrey, Mexico'
    },
    final: { 
      id: 'IC-1-F', 
      homeTeam: 'DR Congo', 
      awayTeam: 'Winner SF', 
      homeFlag: 'https://flagcdn.com/w80/cd.png',
      status: 'tbd', 
      date: 'Mar 31, 2026',
      venue: 'Guadalajara, Mexico'
    },
  },
  {
    name: 'Pathway 2',
    semifinal1: { 
      id: 'IC-2-SF', 
      homeTeam: 'Bolivia', 
      awayTeam: 'Suriname', 
      homeFlag: 'https://flagcdn.com/w80/bo.png',
      awayFlag: 'https://flagcdn.com/w80/sr.png',
      status: 'scheduled', 
      date: 'Mar 26, 2026',
      venue: 'Monterrey, Mexico'
    },
    final: { 
      id: 'IC-2-F', 
      homeTeam: 'Iraq', 
      awayTeam: 'Winner SF', 
      homeFlag: 'https://flagcdn.com/w80/iq.png',
      status: 'tbd', 
      date: 'Mar 31, 2026',
      venue: 'Guadalajara, Mexico'
    },
  },
];

// Simplified bracket for knockout tree view (QF onwards)
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

// Match card for qualifiers (larger, more detailed)
function QualifierMatchCard({ match, showOdds = false }: { match: BracketMatch; showOdds?: boolean }) {
  const navigate = useNavigate();
  const isTbd = match.status === 'tbd';
  const canShowOdds = showOdds && !isTbd && 
    !match.homeTeam.includes('Winner') && 
    !match.homeTeam.includes('TBD') &&
    !match.awayTeam.includes('Winner') &&
    !match.awayTeam.includes('TBD');

  const isClickable = !isTbd && match.id && !match.id.startsWith('UEFA-') && !match.id.startsWith('IC-');

  const handleClick = () => {
    if (isClickable) {
      navigate(`/qualifier/${match.id}`);
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className={cn(
        "glass-card rounded-lg border border-border/50 overflow-hidden",
        match.status === 'live' && "border-accent ring-1 ring-accent/50",
        match.status === 'scheduled' && "border-primary/30",
        isClickable && "cursor-pointer hover:bg-card/90 transition-colors"
      )}
    >
      {(match.date || match.venue) && (
        <div className="px-2 py-1 bg-secondary/30 border-b border-border/30 flex items-center justify-between">
          {match.date && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {match.date}
            </div>
          )}
          {match.venue && (
            <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {match.venue}
            </div>
          )}
        </div>
      )}
      <div className="p-2 space-y-1.5">
        <div className={cn(
          "flex items-center justify-between gap-2",
          isTbd ? "text-muted-foreground" : "text-foreground"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.homeFlag ? (
              <img src={match.homeFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
            ) : (
              <div className="w-5 h-3.5 bg-muted rounded-sm" />
            )}
            <span className="truncate text-xs font-medium">{match.homeTeam}</span>
          </div>
          {match.homeScore !== null && match.homeScore !== undefined && (
            <span className="font-bold text-sm">{match.homeScore}</span>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-between gap-2",
          isTbd ? "text-muted-foreground" : "text-foreground"
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {match.awayFlag ? (
              <img src={match.awayFlag} alt="" className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
            ) : (
              <div className="w-5 h-3.5 bg-muted rounded-sm" />
            )}
            <span className="truncate text-xs font-medium">{match.awayTeam}</span>
          </div>
          {match.awayScore !== null && match.awayScore !== undefined && (
            <span className="font-bold text-sm">{match.awayScore}</span>
          )}
        </div>
      </div>
      
      {/* Odds/Predictions Section */}
      {canShowOdds && (
        <MatchOdds homeTeam={match.homeTeam} awayTeam={match.awayTeam} compact />
      )}
    </div>
  );
}

// Playoff path component with bracket lines
function PlayoffPathBracket({ path }: { path: PlayoffPath }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
      <div className="px-3 py-2 bg-secondary/30 border-b border-border">
        <h4 className="text-xs font-semibold">{path.name}</h4>
      </div>
      <ScrollArea className="w-full">
        <div className="p-3 min-w-[500px]">
          <div className="flex items-center gap-2">
            {/* Semi-finals column */}
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <div className="text-[8px] text-muted-foreground text-center mb-1">Semi-final</div>
              <QualifierMatchCard match={path.semifinal1} showOdds />
              {path.semifinal2 && <QualifierMatchCard match={path.semifinal2} showOdds />}
            </div>
            
            {/* Connector */}
            <div className="flex flex-col items-center justify-center flex-shrink-0">
              <svg width="20" height={path.semifinal2 ? "80" : "40"} className="text-primary/40">
                {path.semifinal2 ? (
                  <>
                    <path d="M0,20 L10,20 L10,40 L20,40" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M0,60 L10,60 L10,40 L20,40" fill="none" stroke="currentColor" strokeWidth="2" />
                  </>
                ) : (
                  <path d="M0,20 L20,20" fill="none" stroke="currentColor" strokeWidth="2" />
                )}
              </svg>
            </div>
            
            {/* Final column */}
            <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
              <div className="text-[8px] text-muted-foreground text-center mb-1">Final</div>
              <QualifierMatchCard match={path.final} />
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
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
  const [liveFixtures, setLiveFixtures] = useState<QualificationFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const connected = await checkApiConnection();
    setApiConnected(connected);
    
    if (connected) {
      const fixtures = await fetchQualificationFixtures();
      setLiveFixtures(fixtures);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds for live updates
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Normalize team names for matching (API vs static data differences)
  const normalizeTeamName = (name: string): string => {
    const aliases: Record<string, string> = {
      'bosnia-herzegovina': 'bosnia',
      'bosnia & herzegovina': 'bosnia',
      'turkey': 'turkiye',
      'türkiye': 'turkiye',
      'czechia': 'czech republic',
      'czech republic': 'czech republic',
      'ireland': 'ireland',
      'rep. of ireland': 'ireland',
      'north macedonia': 'fyr macedonia',
      'fyr macedonia': 'fyr macedonia',
      'dr congo': 'congo dr',
      'congo dr': 'congo dr',
      'northern ireland': 'northern ireland',
    };
    const lower = name.toLowerCase().trim();
    return aliases[lower] || lower;
  };

  // Merge live data with static fallback data
  const mergeWithLiveData = (staticMatch: BracketMatch): BracketMatch => {
    const normHome = normalizeTeamName(staticMatch.homeTeam);
    const normAway = normalizeTeamName(staticMatch.awayTeam);

    // Try to find a matching fixture from live data
    const liveMatch = liveFixtures.find(f => {
      const liveHome = normalizeTeamName(f.homeTeam);
      const liveAway = normalizeTeamName(f.awayTeam);
      return (
        (liveHome === normHome || liveHome.includes(normHome) || normHome.includes(liveHome)) &&
        (liveAway === normAway || liveAway.includes(normAway) || normAway.includes(liveAway))
      );
    });

    if (liveMatch) {
      return {
        ...staticMatch,
        homeTeam: liveMatch.homeTeam,
        awayTeam: liveMatch.awayTeam,
        homeFlag: liveMatch.homeFlag || staticMatch.homeFlag,
        awayFlag: liveMatch.awayFlag || staticMatch.awayFlag,
        homeScore: liveMatch.homeScore,
        awayScore: liveMatch.awayScore,
        status: liveMatch.status,
        venue: liveMatch.venue || staticMatch.venue,
      };
    }
    return staticMatch;
  };

  // Apply live data to playoff paths, resolving winners for finals
  const getLivePlayoffPath = (path: PlayoffPath): PlayoffPath => {
    const sf1 = mergeWithLiveData(path.semifinal1);
    const sf2 = path.semifinal2 ? mergeWithLiveData(path.semifinal2) : undefined;
    let final = mergeWithLiveData(path.final);

    // If semifinals are completed, resolve "Winner SF" placeholders for finals
    const getWinner = (match: BracketMatch): { name: string; flag?: string } | null => {
      if (match.status !== 'completed' || match.homeScore === null || match.awayScore === null) return null;
      if (match.homeScore > match.awayScore) return { name: match.homeTeam, flag: match.homeFlag };
      if (match.awayScore > match.homeScore) return { name: match.awayTeam, flag: match.awayFlag };
      // Penalty shootout - check if the status was PEN (penalties); 
      // API returns the winner even in draws via the team name order convention
      // For now, if it's a draw, we can't determine the winner without extra data
      return null;
    };

    const winner1 = getWinner(sf1);
    const winner2 = sf2 ? getWinner(sf2) : null;

    // Check if the final hasn't been matched to live data yet (still has placeholder names)
    if (final.homeTeam.includes('Winner') || final.awayTeam.includes('Winner')) {
      // Try to find the final match from live data by looking for matches with winner teams
      if (winner1 || winner2) {
        const possibleFinal = liveFixtures.find(f => {
          if (f.round !== 'Final') return false;
          const fHome = normalizeTeamName(f.homeTeam);
          const fAway = normalizeTeamName(f.awayTeam);
          const w1Norm = winner1 ? normalizeTeamName(winner1.name) : '';
          const w2Norm = winner2 ? normalizeTeamName(winner2.name) : '';
          return (
            (w1Norm && (fHome === w1Norm || fAway === w1Norm)) ||
            (w2Norm && (fHome === w2Norm || fAway === w2Norm))
          );
        });

        if (possibleFinal) {
          final = {
            ...final,
            homeTeam: possibleFinal.homeTeam,
            awayTeam: possibleFinal.awayTeam,
            homeFlag: possibleFinal.homeFlag || final.homeFlag,
            awayFlag: possibleFinal.awayFlag || final.awayFlag,
            homeScore: possibleFinal.homeScore,
            awayScore: possibleFinal.awayScore,
            status: possibleFinal.status,
            venue: possibleFinal.venue || final.venue,
          };
        } else {
          // Manually resolve from winners
          if (winner1 && final.homeTeam.includes('Winner')) {
            final = { ...final, homeTeam: winner1.name, homeFlag: winner1.flag };
          }
          if (winner2 && final.awayTeam.includes('Winner')) {
            final = { ...final, awayTeam: winner2.name, awayFlag: winner2.flag };
          }
          // For single semifinal paths (intercontinental)
          if (!sf2 && winner1 && final.awayTeam.includes('Winner')) {
            final = { ...final, awayTeam: winner1.name, awayFlag: winner1.flag };
          }
        }
      }
    }

    return { ...path, semifinal1: sf1, semifinal2: sf2, final };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-primary">Remaining Qualification</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* API Status */}
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
              apiConnected ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"
            )}>
              {apiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {apiConnected ? 'Live' : 'Offline'}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="h-7 w-7"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", (refreshing || loading) && "animate-spin")} />
            </Button>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Qualified Teams</span>
            <span className="font-bold text-accent">42 / 48</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-accent h-2 rounded-full transition-all" style={{ width: '87.5%' }} />
          </div>
          <div className="text-[10px] text-muted-foreground text-center">
            6 spots remaining via playoffs (4 UEFA + 2 Intercontinental)
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Live Fixtures from API (if any) */}
          {liveFixtures.length > 0 && (
            <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
              <div className="px-4 py-3 bg-accent/20 border-b border-accent/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-accent">Live Qualification Matches</h3>
                  <span className="text-xs text-accent font-medium animate-pulse">● LIVE</span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {liveFixtures.filter(f => f.status === 'live').map((fixture) => (
                  <QualifierMatchCard 
                    key={fixture.id} 
                    match={{
                      id: String(fixture.id),
                      homeTeam: fixture.homeTeam,
                      awayTeam: fixture.awayTeam,
                      homeFlag: fixture.homeFlag,
                      awayFlag: fixture.awayFlag,
                      homeScore: fixture.homeScore,
                      awayScore: fixture.awayScore,
                      status: fixture.status,
                      date: new Date(fixture.date).toLocaleDateString(),
                      venue: fixture.venue,
                    }} 
                  />
                ))}
                {liveFixtures.filter(f => f.status === 'live').length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No live matches at the moment
                  </p>
                )}
              </div>
            </div>
          )}

          {/* UEFA European Playoffs */}
          <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">UEFA European Playoffs</h3>
                <span className="text-xs text-primary font-medium">4 qualifiers</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                16 teams competing for 4 World Cup spots
              </p>
            </div>
          </div>

          {uefaPlayoffs.map((path) => (
            <PlayoffPathBracket key={path.name} path={getLivePlayoffPath(path)} />
          ))}

          {/* Intercontinental Playoffs */}
          <div className="glass-card rounded-xl overflow-hidden animate-slide-up mt-6">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold">Intercontinental Playoffs</h3>
                <span className="text-xs text-primary font-medium">2 qualifiers</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Hosted in Mexico (Monterrey & Guadalajara)
              </p>
            </div>
          </div>

          {intercontinentalPlayoffs.map((path) => (
            <PlayoffPathBracket key={path.name} path={getLivePlayoffPath(path)} />
          ))}
        </>
      )}
    </div>
  );
}
