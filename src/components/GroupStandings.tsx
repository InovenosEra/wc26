import { Team } from '@/types';
import { cn } from '@/lib/utils';

interface GroupStandingsProps {
  teams: Team[];
}

// Mock standings data - in production this would come from the API
const mockStandings: Record<string, { played: number; won: number; drawn: number; lost: number; gf: number; ga: number; pts: number }> = {};

export function GroupStandings({ teams }: GroupStandingsProps) {
  // Group teams by their group_name
  const groupedTeams = teams.reduce((acc, team) => {
    const group = team.group_name || 'Unknown';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(team);
    return acc;
  }, {} as Record<string, Team[]>);

  const groups = Object.keys(groupedTeams).sort();

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
                {groupedTeams[groupName].map((team, index) => {
                  const stats = mockStandings[team.id] || {
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    gf: 0,
                    ga: 0,
                    pts: 0
                  };
                  const gd = stats.gf - stats.ga;

                  return (
                    <tr 
                      key={team.id}
                      className={cn(
                        "border-b border-border/50 last:border-0",
                        index < 2 && "bg-accent/5"
                      )}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{index + 1}</span>
                          <img 
                            src={team.flag_url || ''} 
                            alt={team.name}
                            className="w-6 h-4 object-cover rounded shadow-sm"
                          />
                          <span className="font-medium">{team.code}</span>
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
