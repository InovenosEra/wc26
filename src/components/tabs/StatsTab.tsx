import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchStandings, 
  fetchTopScorers,
  fetchTopAssists,
  checkApiConnection,
  FormattedStanding,
  FormattedTopScorer,
  FormattedAssist
} from '@/services/footballApi';
import { Team } from '@/types';
import { GroupStandings } from '@/components/GroupStandings';
import { PlayerDetailCard, PlayerStats } from '@/components/PlayerDetailCard';
import { Loader2, BarChart3, Users, Wifi, WifiOff, RefreshCw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewType = 'standings' | 'scorers';

export function StatsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [apiStandings, setApiStandings] = useState<Record<string, FormattedStanding[]>>({});
  const [topScorers, setTopScorers] = useState<FormattedTopScorer[]>([]);
  const [topAssists, setTopAssists] = useState<FormattedAssist[]>([]);
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
        const [standings, scorers, assists] = await Promise.all([
          fetchStandings(),
          fetchTopScorers(),
          fetchTopAssists()
        ]);
        setApiStandings(standings);
        setTopScorers(scorers);
        setTopAssists(assists);
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
          👤 Personal Stats
        </Button>
      </div>

      {/* Content */}
      {view === 'standings' ? (
        hasApiStandings ? (
          <ApiGroupStandings standings={apiStandings} teams={teams} />
        ) : (
          <GroupStandings teams={teams} />
        )
      ) : (
        <TopScorersSection scorers={topScorers} assists={topAssists} apiConnected={apiConnected || false} />
      )}
    </div>
  );
}

// API-powered group standings
function ApiGroupStandings({ standings, teams }: { standings: Record<string, FormattedStanding[]>; teams: Team[] }) {
  const navigate = useNavigate();
  const groups = Object.keys(standings).sort();

  const handleTeamClick = (teamName: string) => {
    // Find team ID from teams list by matching name
    const team = teams.find(t => 
      t.name.toLowerCase() === teamName.toLowerCase() ||
      t.code.toLowerCase() === teamName.toLowerCase()
    );
    if (team) {
      navigate(`/team/${team.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {groups.map((groupName) => (
        <div key={groupName} className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-bold text-primary">Group {groupName}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs table-fixed">
              <colgroup>
                <col className="w-auto" />
                <col className="w-8" />
                <col className="w-12" />
                <col className="w-9" />
                <col className="w-9" />
              </colgroup>
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-2 px-2 font-medium">Team</th>
                  <th className="text-center py-2 px-0.5 font-medium">P</th>
                  <th className="text-center py-2 px-0.5 font-medium">F:A</th>
                  <th className="text-center py-2 px-0.5 font-medium">GD</th>
                  <th className="text-center py-2 px-0.5 font-medium text-primary">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings[groupName].map((team, index) => (
                  <tr 
                    key={team.teamName}
                    onClick={() => handleTeamClick(team.teamName)}
                    className={cn(
                      "border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/30 transition-colors",
                      index < 2 && "bg-accent/5"
                    )}
                  >
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-muted-foreground w-3 shrink-0 text-center text-[10px]">{team.rank}</span>
                        <img 
                          src={team.teamLogo} 
                          alt={team.teamName}
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span className="font-medium truncate">{team.teamName}</span>
                      </div>
                    </td>
                    <td className="text-center py-2.5 px-0.5 text-muted-foreground">{team.played}</td>
                    <td className="text-center py-2.5 px-0.5 text-muted-foreground text-[10px]">{team.goalsFor}:{team.goalsAgainst}</td>
                    <td className={cn(
                      "text-center py-2.5 px-0.5 text-[10px]",
                      team.goalsDiff > 0 && "text-accent",
                      team.goalsDiff < 0 && "text-destructive",
                      team.goalsDiff === 0 && "text-muted-foreground"
                    )}>
                      {team.goalsDiff > 0 ? `+${team.goalsDiff}` : team.goalsDiff}
                    </td>
                    <td className="text-center py-2.5 px-0.5 font-bold text-primary">{team.points}</td>
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

// Personal statistics section with goals, xG, and assists
function TopScorersSection({ 
  scorers, 
  assists,
  apiConnected 
}: { 
  scorers: FormattedTopScorer[]; 
  assists: FormattedAssist[];
  apiConnected: boolean 
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);

  // Mock data for when API is not connected - using SportMonks CDN for player images
  const mockScorers = [
    { playerName: 'Kylian Mbappé', teamName: 'France', teamLogo: 'https://flagcdn.com/w80/fr.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/31/85095807.png', goals: 0 },
    { playerName: 'Erling Haaland', teamName: 'Norway', teamLogo: 'https://flagcdn.com/w80/no.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/3/1719299.png', goals: 0 },
    { playerName: 'Lionel Messi', teamName: 'Argentina', teamLogo: 'https://flagcdn.com/w80/ar.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/14/50000782.png', goals: 0 },
    { playerName: 'Harry Kane', teamName: 'England', teamLogo: 'https://flagcdn.com/w80/gb-eng.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/18/986.png', goals: 0 },
    { playerName: 'Vinícius Jr.', teamName: 'Brazil', teamLogo: 'https://flagcdn.com/w80/br.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/10/37036938.png', goals: 0 },
  ];

  const mockXgLeaders = [
    { playerName: 'Erling Haaland', teamName: 'Norway', teamLogo: 'https://flagcdn.com/w80/no.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/3/1719299.png', value: 0 },
    { playerName: 'Kylian Mbappé', teamName: 'France', teamLogo: 'https://flagcdn.com/w80/fr.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/31/85095807.png', value: 0 },
    { playerName: 'Harry Kane', teamName: 'England', teamLogo: 'https://flagcdn.com/w80/gb-eng.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/18/986.png', value: 0 },
    { playerName: 'Lautaro Martínez', teamName: 'Argentina', teamLogo: 'https://flagcdn.com/w80/ar.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/9/37058825.png', value: 0 },
    { playerName: 'Vinícius Jr.', teamName: 'Brazil', teamLogo: 'https://flagcdn.com/w80/br.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/10/37036938.png', value: 0 },
  ];

  const mockAssists = [
    { playerName: 'Kevin De Bruyne', teamName: 'Belgium', teamLogo: 'https://flagcdn.com/w80/be.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/6/3430.png', assists: 0 },
    { playerName: 'Lionel Messi', teamName: 'Argentina', teamLogo: 'https://flagcdn.com/w80/ar.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/14/50000782.png', assists: 0 },
    { playerName: 'Bruno Fernandes', teamName: 'Portugal', teamLogo: 'https://flagcdn.com/w80/pt.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/9/37028361.png', assists: 0 },
    { playerName: 'Florian Wirtz', teamName: 'Germany', teamLogo: 'https://flagcdn.com/w80/de.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/25/37061401.png', assists: 0 },
    { playerName: 'Bukayo Saka', teamName: 'England', teamLogo: 'https://flagcdn.com/w80/gb-eng.png', playerPhoto: 'https://cdn.sportmonks.com/images/soccer/players/6/37055750.png', assists: 0 },
  ];

  // Create a map of player photos from mock data for fallback
  const mockPhotoMap: Record<string, string> = {};
  [...mockScorers, ...mockXgLeaders, ...mockAssists].forEach(p => {
    if (p.playerPhoto) mockPhotoMap[p.playerName] = p.playerPhoto;
  });

  // Merge API data with mock photos if missing
  const displayScorers = scorers.length > 0 
    ? scorers.map(s => ({ ...s, playerPhoto: s.playerPhoto || mockPhotoMap[s.playerName] || '' }))
    : mockScorers;
  const displayAssists = assists.length > 0 
    ? assists.map(a => ({ ...a, playerPhoto: a.playerPhoto || mockPhotoMap[a.playerName] || '' }))
    : mockAssists;

  const handlePlayerClick = (player: {
    playerName: string;
    playerPhoto?: string;
    teamName: string;
    teamLogo: string;
    goals?: number;
    assists?: number;
  }) => {
    setSelectedPlayer({
      playerName: player.playerName,
      playerPhoto: player.playerPhoto,
      teamName: player.teamName,
      teamLogo: player.teamLogo,
      goals: player.goals,
      assists: player.assists,
    });
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-bold text-primary">Personal Statistics</h3>
          </div>
          
          {!apiConnected && (
            <div className="p-3 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                Stats will update when tournament begins
              </p>
            </div>
          )}
        </div>

        {/* Top Scorers */}
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border flex items-center gap-2">
            <span>⚽</span>
            <h4 className="text-xs font-semibold">Top Scorers</h4>
          </div>
          <div className="divide-y divide-border">
            {displayScorers.slice(0, 5).map((scorer, index) => (
              <PlayerStatRow 
                key={index}
                rank={index + 1}
                playerName={scorer.playerName}
                teamName={scorer.teamName}
                teamLogo={scorer.teamLogo}
                playerPhoto={scorer.playerPhoto}
                value={scorer.goals}
                label="goals"
                onClick={() => handlePlayerClick({ ...scorer, goals: scorer.goals })}
              />
            ))}
          </div>
        </div>

        {/* Expected Goals (xG) */}
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border flex items-center gap-2">
            <span>📊</span>
            <h4 className="text-xs font-semibold">Expected Goals (xG)</h4>
          </div>
          <div className="divide-y divide-border">
            {mockXgLeaders.map((player, index) => (
              <PlayerStatRow 
                key={index}
                rank={index + 1}
                playerName={player.playerName}
                teamName={player.teamName}
                teamLogo={player.teamLogo}
                playerPhoto={player.playerPhoto}
                value={player.value}
                label="xG"
                decimals
                onClick={() => handlePlayerClick({ 
                  playerName: player.playerName,
                  playerPhoto: player.playerPhoto,
                  teamName: player.teamName,
                  teamLogo: player.teamLogo,
                })}
              />
            ))}
          </div>
        </div>

        {/* Top Assists */}
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-2 bg-secondary/30 border-b border-border flex items-center gap-2">
            <span>🎯</span>
            <h4 className="text-xs font-semibold">Top Assists</h4>
          </div>
          <div className="divide-y divide-border">
            {displayAssists.slice(0, 5).map((player, index) => (
              <PlayerStatRow 
                key={index}
                rank={index + 1}
                playerName={player.playerName}
                teamName={player.teamName}
                teamLogo={player.teamLogo}
                playerPhoto={player.playerPhoto}
                value={player.assists}
                label="assists"
                onClick={() => handlePlayerClick({ ...player, assists: player.assists })}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerDetailCard 
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}

// Reusable player stat row component
function PlayerStatRow({ 
  rank, 
  playerName, 
  teamName, 
  teamLogo, 
  playerPhoto, 
  value, 
  label,
  decimals = false,
  onClick
}: { 
  rank: number;
  playerName: string;
  teamName: string;
  teamLogo: string;
  playerPhoto?: string;
  value: number;
  label: string;
  decimals?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-3 transition-colors",
        onClick && "cursor-pointer hover:bg-secondary/30 active:bg-secondary/50"
      )}
      onClick={onClick}
    >
      <span className={cn(
        "w-5 text-center text-sm font-bold",
        rank === 1 && "text-primary",
        rank === 2 && "text-gray-400",
        rank === 3 && "text-amber-600"
      )}>
        {rank}
      </span>
      
      <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {playerPhoto ? (
          <img 
            src={playerPhoto} 
            alt={playerName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<img src="${teamLogo}" alt="${teamName}" class="w-5 h-4 object-contain" />`;
            }}
          />
        ) : (
          <img 
            src={teamLogo} 
            alt={teamName}
            className="w-5 h-4 object-contain"
          />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{playerName}</p>
        <p className="text-[10px] text-muted-foreground">{teamName}</p>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-bold text-primary">
          {decimals ? value.toFixed(1) : value}
        </p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>

      {onClick && (
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
}
