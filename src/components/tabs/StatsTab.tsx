import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchStandings, 
  fetchTopScorers, 
  checkApiConnection,
  FormattedStanding,
  FormattedTopScorer 
} from '@/services/footballApi';
import { Team } from '@/types';
import { GroupStandings } from '@/components/GroupStandings';
import { Loader2, BarChart3, Users, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewType = 'standings' | 'scorers';

export function StatsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [apiStandings, setApiStandings] = useState<Record<string, FormattedStanding[]>>({});
  const [topScorers, setTopScorers] = useState<FormattedTopScorer[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('standings');
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Check API connection
    const connected = await checkApiConnection();
    setApiConnected(connected);

    // Fetch teams from database (fallback)
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('group_name', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTeams((data || []) as Team[]);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }

    // If API is connected, fetch live data
    if (connected) {
      try {
        const [standings, scorers] = await Promise.all([
          fetchStandings(),
          fetchTopScorers()
        ]);
        setApiStandings(standings);
        setTopScorers(scorers);
      } catch (error) {
        console.error('Error fetching API data:', error);
      }
    }

    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const hasApiStandings = Object.keys(apiStandings).length > 0;
  const hasApiScorers = topScorers.length > 0;

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Stats & Standings</h2>
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
            disabled={refreshing}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('standings')}
          className={cn(
            "h-8 px-3 text-xs flex-1",
            view === 'standings' 
              ? "bg-primary/10 text-primary border border-primary/30" 
              : "text-muted-foreground"
          )}
        >
          <Users className="w-3.5 h-3.5 mr-1.5" />
          Group Standings
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView('scorers')}
          className={cn(
            "h-8 px-3 text-xs flex-1",
            view === 'scorers' 
              ? "bg-primary/10 text-primary border border-primary/30" 
              : "text-muted-foreground"
          )}
        >
          ⚽ Top Scorers
        </Button>
      </div>

      {/* Content */}
      {view === 'standings' ? (
        hasApiStandings ? (
          <ApiGroupStandings standings={apiStandings} />
        ) : (
          <GroupStandings teams={teams} />
        )
      ) : (
        <TopScorersSection scorers={topScorers} apiConnected={apiConnected || false} />
      )}
    </div>
  );
}

// API-powered group standings
function ApiGroupStandings({ standings }: { standings: Record<string, FormattedStanding[]> }) {
  const groups = Object.keys(standings).sort();

  return (
    <div className="space-y-6">
      {groups.map((groupName) => (
        <div key={groupName} className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-bold text-primary">Group {groupName}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-3 font-medium">Team</th>
                  <th className="text-center py-2 px-2 font-medium w-8">P</th>
                  <th className="text-center py-2 px-2 font-medium w-8">W</th>
                  <th className="text-center py-2 px-2 font-medium w-8">D</th>
                  <th className="text-center py-2 px-2 font-medium w-8">L</th>
                  <th className="text-center py-2 px-2 font-medium w-10">GD</th>
                  <th className="text-center py-2 px-3 font-medium w-10 text-primary">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings[groupName].map((team, index) => (
                  <tr 
                    key={team.teamName}
                    className={cn(
                      "border-b border-border/50 last:border-0",
                      index < 2 && "bg-accent/5"
                    )}
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground w-4">{team.rank}</span>
                        <img 
                          src={team.teamLogo} 
                          alt={team.teamName}
                          className="w-6 h-6 object-contain"
                        />
                        <span className="font-medium truncate max-w-[80px]">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{team.played}</td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{team.won}</td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{team.drawn}</td>
                    <td className="text-center py-2.5 px-2 text-muted-foreground">{team.lost}</td>
                    <td className={cn(
                      "text-center py-2.5 px-2",
                      team.goalsDiff > 0 && "text-accent",
                      team.goalsDiff < 0 && "text-destructive",
                      team.goalsDiff === 0 && "text-muted-foreground"
                    )}>
                      {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                    </td>
                    <td className="text-center py-2.5 px-3 font-bold text-primary">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// Top scorers section
function TopScorersSection({ scorers, apiConnected }: { scorers: FormattedTopScorer[]; apiConnected: boolean }) {
  // Mock data for when API is not connected
  const mockScorers = [
    { playerName: 'Kylian Mbappé', teamName: 'France', teamLogo: 'https://flagcdn.com/w80/fr.png', playerPhoto: '', goals: 0 },
    { playerName: 'Erling Haaland', teamName: 'Norway', teamLogo: 'https://flagcdn.com/w80/no.png', playerPhoto: '', goals: 0 },
    { playerName: 'Lionel Messi', teamName: 'Argentina', teamLogo: 'https://flagcdn.com/w80/ar.png', playerPhoto: '', goals: 0 },
    { playerName: 'Harry Kane', teamName: 'England', teamLogo: 'https://flagcdn.com/w80/gb-eng.png', playerPhoto: '', goals: 0 },
    { playerName: 'Vinícius Jr.', teamName: 'Brazil', teamLogo: 'https://flagcdn.com/w80/br.png', playerPhoto: '', goals: 0 },
  ];

  const displayScorers = scorers.length > 0 ? scorers : mockScorers;

  return (
    <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
      <div className="px-4 py-3 bg-secondary/50 border-b border-border">
        <h3 className="text-sm font-bold text-primary">Top Scorers</h3>
      </div>
      
      <div className="divide-y divide-border">
        {displayScorers.map((scorer, index) => (
          <div key={index} className="flex items-center gap-3 p-3">
            <span className={cn(
              "w-6 text-center text-sm font-bold",
              index === 0 && "text-primary",
              index === 1 && "text-gray-400",
              index === 2 && "text-amber-600"
            )}>
              {index + 1}
            </span>
            
            {scorer.playerPhoto ? (
              <img 
                src={scorer.playerPhoto} 
                alt={scorer.playerName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <img 
                src={scorer.teamLogo} 
                alt={scorer.teamName}
                className="w-6 h-4 object-cover rounded shadow-sm"
              />
            )}
            
            <div className="flex-1">
              <p className="text-sm font-medium">{scorer.playerName}</p>
              <p className="text-[10px] text-muted-foreground">{scorer.teamName}</p>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{scorer.goals}</p>
              <p className="text-[10px] text-muted-foreground">goals</p>
            </div>
          </div>
        ))}
      </div>
      
      {!apiConnected && (
        <div className="p-3 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            Stats will update when tournament begins
          </p>
        </div>
      )}
    </div>
  );
}
