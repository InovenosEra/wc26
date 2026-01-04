import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types';
import { GroupStandings } from '@/components/GroupStandings';
import { Loader2, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewType = 'standings' | 'scorers';

// Mock top scorers data
const mockScorers = [
  { name: 'Kylian Mbappé', team: 'FRA', goals: 0, flag: 'https://flagcdn.com/w80/fr.png' },
  { name: 'Erling Haaland', team: 'NOR', goals: 0, flag: 'https://flagcdn.com/w80/no.png' },
  { name: 'Lionel Messi', team: 'ARG', goals: 0, flag: 'https://flagcdn.com/w80/ar.png' },
  { name: 'Harry Kane', team: 'ENG', goals: 0, flag: 'https://flagcdn.com/w80/gb-eng.png' },
  { name: 'Vinícius Jr.', team: 'BRA', goals: 0, flag: 'https://flagcdn.com/w80/br.png' },
];

export function StatsTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewType>('standings');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Stats & Standings</h2>
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
        <GroupStandings teams={teams} />
      ) : (
        <div className="glass-card rounded-xl overflow-hidden animate-slide-up">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h3 className="text-sm font-bold text-primary">Top Scorers</h3>
          </div>
          
          <div className="divide-y divide-border">
            {mockScorers.map((scorer, index) => (
              <div key={index} className="flex items-center gap-3 p-3">
                <span className={cn(
                  "w-6 text-center text-sm font-bold",
                  index === 0 && "text-primary",
                  index === 1 && "text-gray-400",
                  index === 2 && "text-amber-600"
                )}>
                  {index + 1}
                </span>
                
                <img 
                  src={scorer.flag} 
                  alt={scorer.team}
                  className="w-6 h-4 object-cover rounded shadow-sm"
                />
                
                <div className="flex-1">
                  <p className="text-sm font-medium">{scorer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{scorer.team}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{scorer.goals}</p>
                  <p className="text-[10px] text-muted-foreground">goals</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-3 bg-muted/30 text-center">
            <p className="text-xs text-muted-foreground">
              Stats will update when tournament begins
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
