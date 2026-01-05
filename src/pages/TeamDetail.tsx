import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trophy, Target, Users, Calendar, MapPin, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TeamData {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  group_name: string | null;
}

interface MatchData {
  id: string;
  match_date: string;
  stadium: string | null;
  city: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home_team: TeamData | null;
  away_team: TeamData | null;
}

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team's matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          stadium,
          city,
          status,
          home_score,
          away_score,
          home_team:home_team_id(id, name, code, flag_url, group_name),
          away_team:away_team_id(id, name, code, flag_url, group_name)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;
      
      // Type assertion for the joined data
      const typedMatches = (matchesData || []).map((match: any) => ({
        ...match,
        home_team: match.home_team as TeamData | null,
        away_team: match.away_team as TeamData | null,
      }));
      
      setMatches(typedMatches);
    } catch (error) {
      console.error('Error fetching team data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate team stats from matches
  const stats = matches.reduce(
    (acc, match) => {
      if (match.status !== 'completed') return acc;
      
      const isHome = match.home_team?.id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      if (teamScore === null || opponentScore === null) return acc;

      acc.played++;
      acc.goalsFor += teamScore;
      acc.goalsAgainst += opponentScore;

      if (teamScore > opponentScore) {
        acc.won++;
        acc.points += 3;
      } else if (teamScore === opponentScore) {
        acc.drawn++;
        acc.points += 1;
      } else {
        acc.lost++;
      }

      return acc;
    },
    { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Team not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  const upcomingMatches = matches.filter(m => m.status === 'scheduled');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {team.flag_url ? (
              <img 
                src={team.flag_url} 
                alt={team.name}
                className="w-10 h-7 object-cover rounded shadow-md"
              />
            ) : (
              <div className="w-10 h-7 bg-muted rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold truncate">{team.name}</h1>
              <p className="text-xs text-muted-foreground">Group {team.group_name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Team Stats Card */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Tournament Statistics
            </h2>
          </div>
          
          <div className="p-4">
            {stats.played > 0 ? (
              <div className="grid grid-cols-4 gap-4 text-center">
                <StatItem label="Played" value={stats.played} />
                <StatItem label="Won" value={stats.won} highlight="accent" />
                <StatItem label="Drawn" value={stats.drawn} />
                <StatItem label="Lost" value={stats.lost} highlight="destructive" />
                <StatItem label="GF" value={stats.goalsFor} />
                <StatItem label="GA" value={stats.goalsAgainst} />
                <StatItem label="GD" value={stats.goalsFor - stats.goalsAgainst} showSign />
                <StatItem label="Points" value={stats.points} highlight="primary" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Stats will update when tournament begins
              </p>
            )}
          </div>
        </div>

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Matches ({upcomingMatches.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {upcomingMatches.map((match) => (
                <MatchRow 
                  key={match.id} 
                  match={match} 
                  teamId={teamId!}
                  onClick={() => navigate(`/match/${match.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Matches */}
        {completedMatches.length > 0 && (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <Target className="w-4 h-4" />
                Results ({completedMatches.length})
              </h2>
            </div>
            <div className="divide-y divide-border">
              {completedMatches.map((match) => (
                <MatchRow 
                  key={match.id} 
                  match={match} 
                  teamId={teamId!}
                  onClick={() => navigate(`/match/${match.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Group Info */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-secondary/50 border-b border-border">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2">
              <Users className="w-4 h-4" />
              Group {team.group_name} Opponents
            </h2>
          </div>
          <div className="p-4 text-center text-sm text-muted-foreground">
            <p>View all group matches and standings in the Stats tab</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatItem({ 
  label, 
  value, 
  highlight,
  showSign = false 
}: { 
  label: string; 
  value: number; 
  highlight?: 'primary' | 'accent' | 'destructive';
  showSign?: boolean;
}) {
  const displayValue = showSign && value > 0 ? `+${value}` : value;
  
  return (
    <div className="flex flex-col items-center">
      <span className={cn(
        "text-xl font-bold",
        highlight === 'primary' && "text-primary",
        highlight === 'accent' && "text-accent",
        highlight === 'destructive' && "text-destructive",
        !highlight && "text-foreground"
      )}>
        {displayValue}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

function MatchRow({ 
  match, 
  teamId,
  onClick 
}: { 
  match: MatchData; 
  teamId: string;
  onClick: () => void;
}) {
  const isHome = match.home_team?.id === teamId;
  const opponent = isHome ? match.away_team : match.home_team;
  const teamScore = isHome ? match.home_score : match.away_score;
  const opponentScore = isHome ? match.away_score : match.home_score;
  
  const matchDate = new Date(match.match_date);
  const isCompleted = match.status === 'completed';
  
  // Determine result
  let result: 'W' | 'D' | 'L' | null = null;
  if (isCompleted && teamScore !== null && opponentScore !== null) {
    if (teamScore > opponentScore) result = 'W';
    else if (teamScore < opponentScore) result = 'L';
    else result = 'D';
  }

  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-secondary/30 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Result indicator */}
      {result && (
        <span className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
          result === 'W' && "bg-accent/20 text-accent",
          result === 'D' && "bg-muted text-muted-foreground",
          result === 'L' && "bg-destructive/20 text-destructive"
        )}>
          {result}
        </span>
      )}
      
      {/* Opponent */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {opponent?.flag_url && (
          <img 
            src={opponent.flag_url} 
            alt={opponent.name}
            className="w-6 h-4 object-cover rounded shadow-sm shrink-0"
          />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">
            {isHome ? 'vs' : '@'} {opponent?.name || 'TBD'}
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5" />
            {match.city || match.stadium}
          </p>
        </div>
      </div>
      
      {/* Score or Date */}
      <div className="text-right shrink-0">
        {isCompleted ? (
          <p className="text-lg font-bold">
            {teamScore} - {opponentScore}
          </p>
        ) : (
          <div>
            <p className="text-xs font-medium">
              {matchDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
