import { Team } from '@/types';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GroupStandingsProps {
  teams: Team[];
}

interface TeamStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  pts: number;
}

export function GroupStandings({ teams }: GroupStandingsProps) {
  // Fetch matches and calculate standings
  const { data: standings, isLoading } = useQuery({
    queryKey: ['group-standings'],
    queryFn: async () => {
      const { data: matches, error } = await supabase
        .from('matches')
        .select('home_team_id, away_team_id, home_score, away_score, status')
        .in('status', ['finished', 'FT', 'AET', 'PEN']);

      if (error) throw error;

      // Calculate standings from match results
      const teamStats: Record<string, TeamStats> = {};

      // Initialize all teams with zero stats
      teams.forEach(team => {
        teamStats[team.id] = {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          pts: 0
        };
      });

      // Process each finished match
      matches?.forEach(match => {
        if (match.home_score === null || match.away_score === null) return;

        const homeId = match.home_team_id;
        const awayId = match.away_team_id;
        const homeScore = match.home_score;
        const awayScore = match.away_score;

        if (!homeId || !awayId) return;

        // Initialize if not exists
        if (!teamStats[homeId]) {
          teamStats[homeId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
        }
        if (!teamStats[awayId]) {
          teamStats[awayId] = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 };
        }

        // Update stats for home team
        teamStats[homeId].played++;
        teamStats[homeId].gf += homeScore;
        teamStats[homeId].ga += awayScore;

        // Update stats for away team
        teamStats[awayId].played++;
        teamStats[awayId].gf += awayScore;
        teamStats[awayId].ga += homeScore;

        // Determine result
        if (homeScore > awayScore) {
          teamStats[homeId].won++;
          teamStats[homeId].pts += 3;
          teamStats[awayId].lost++;
        } else if (homeScore < awayScore) {
          teamStats[awayId].won++;
          teamStats[awayId].pts += 3;
          teamStats[homeId].lost++;
        } else {
          teamStats[homeId].drawn++;
          teamStats[homeId].pts += 1;
          teamStats[awayId].drawn++;
          teamStats[awayId].pts += 1;
        }
      });

      return teamStats;
    },
    staleTime: 60000, // 1 minute
  });

  // Group teams by their group_name and sort by standings
  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.group_name || 'Unknown';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  // Sort teams within each group by points, then goal difference, then goals scored
  const sortedGroupedTeams = Object.entries(groupedTeams).reduce((acc, [group, groupTeams]) => {
    acc[group] = [...groupTeams].sort((a, b) => {
      const statsA = standings?.[a.id] || { pts: 0, gf: 0, ga: 0 };
      const statsB = standings?.[b.id] || { pts: 0, gf: 0, ga: 0 };
      
      // Sort by points
      if (statsB.pts !== statsA.pts) return statsB.pts - statsA.pts;
      
      // Then by goal difference
      const gdA = statsA.gf - statsA.ga;
      const gdB = statsB.gf - statsB.ga;
      if (gdB !== gdA) return gdB - gdA;
      
      // Then by goals scored
      return statsB.gf - statsA.gf;
    });
    return acc;
  }, {} as Record<string, Team[]>);

  const groups = Object.keys(sortedGroupedTeams).sort();

  // Get qualification indicator for position
  const getQualificationIndicator = (position: number) => {
    if (position <= 2) {
      return { color: 'bg-accent', label: 'Qualified' };
    } else if (position === 3) {
      return { color: 'bg-primary', label: 'Possible' };
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
          <span className="text-[10px] text-muted-foreground">Auto qualify (1st-2nd)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">May qualify (3rd)</span>
        </div>
      </div>

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
                {sortedGroupedTeams[groupName].map((team, index) => {
                  const stats = standings?.[team.id] || {
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    gf: 0,
                    ga: 0,
                    pts: 0
                  };
                  const gd = stats.gf - stats.ga;
                  const position = index + 1;
                  const qualifier = getQualificationIndicator(position);

                  return (
                    <tr 
                      key={team.id}
                      className={cn(
                        "border-b border-border/50 last:border-0",
                        position <= 2 && "bg-accent/5",
                        position === 3 && "bg-primary/5"
                      )}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative w-4 shrink-0 flex items-center justify-center">
                            <span className="text-muted-foreground">{position}</span>
                            {qualifier && (
                              <div className={cn(
                                "absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full",
                                qualifier.color
                              )} />
                            )}
                          </div>
                          <img 
                            src={team.flag_url || ''} 
                            alt={team.name}
                            className="w-6 h-4 object-cover rounded shadow-sm shrink-0"
                          />
                          <span className="font-medium truncate">{team.name}</span>
                        </div>
                      </td>
                      <td className="text-center py-2.5 px-2 text-muted-foreground">{stats.played}</td>
                      <td className="text-center py-2.5 px-2 text-muted-foreground">{stats.won}</td>
                      <td className="text-center py-2.5 px-2 text-muted-foreground">{stats.drawn}</td>
                      <td className="text-center py-2.5 px-2 text-muted-foreground">{stats.lost}</td>
                      <td className={cn(
                        "text-center py-2.5 px-2",
                        gd > 0 && "text-accent",
                        gd < 0 && "text-destructive",
                        gd === 0 && "text-muted-foreground"
                      )}>
                        {gd > 0 ? `+${gd}` : gd}
                      </td>
                      <td className="text-center py-2.5 px-3 font-bold text-primary">{stats.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
