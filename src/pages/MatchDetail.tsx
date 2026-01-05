import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Match, Team } from '@/types';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Users, 
  BarChart3, 
  Loader2,
  Target,
  AlertCircle,
  RefreshCw,
  Swords
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchFact } from '@/components/MatchFact';
import { HeadToHead } from '@/components/HeadToHead';
import { cn } from '@/lib/utils';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/football-api`;

interface MatchStatistic {
  type: string;
  home: number | string;
  away: number | string;
}

interface Player {
  id: number;
  name: string;
  number: number;
  position: string;
  image: string;
}

interface Lineup {
  home: Player[];
  away: Player[];
  homeFormation: string;
  awayFormation: string;
}

interface MatchEvent {
  id: number;
  minute: number;
  type: string;
  team: 'home' | 'away';
  player: string;
  related?: string;
  detail?: string;
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState<Match | null>(null);
  const [statistics, setStatistics] = useState<MatchStatistic[]>([]);
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('h2h');

  useEffect(() => {
    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  const fetchMatchDetails = async () => {
    try {
      // Fetch match from database
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_score,
          away_score,
          match_date,
          stadium,
          city,
          stage,
          status,
          home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, group_name)
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;
      
      if (matchData) {
        setMatch({
          id: matchData.id,
          home_team: matchData.home_team as Team,
          away_team: matchData.away_team as Team,
          home_score: matchData.home_score,
          away_score: matchData.away_score,
          match_date: matchData.match_date,
          stadium: matchData.stadium,
          city: matchData.city,
          stage: matchData.stage,
          status: matchData.status,
        });
      }

      // Try to fetch external stats (will work when tournament is live)
      await fetchExternalStats();
      
    } catch (error) {
      console.error('Error fetching match details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalStats = async () => {
    try {
      // This would fetch from SportMonks when we have an external fixture ID
      // For now, we'll show mock/placeholder data
      
      // Mock statistics for demo
      setStatistics([
        { type: 'Possession', home: '52%', away: '48%' },
        { type: 'Shots', home: 14, away: 11 },
        { type: 'Shots on Target', home: 6, away: 4 },
        { type: 'Corners', home: 7, away: 5 },
        { type: 'Fouls', home: 12, away: 14 },
        { type: 'Yellow Cards', home: 2, away: 1 },
        { type: 'Offsides', home: 3, away: 2 },
        { type: 'Passes', home: 487, away: 452 },
        { type: 'Pass Accuracy', home: '85%', away: '82%' },
      ]);

      // Mock lineup
      setLineup({
        homeFormation: '4-3-3',
        awayFormation: '4-4-2',
        home: [
          { id: 1, name: 'Goalkeeper', number: 1, position: 'GK', image: '' },
          { id: 2, name: 'Right Back', number: 2, position: 'RB', image: '' },
          { id: 3, name: 'Center Back', number: 4, position: 'CB', image: '' },
          { id: 4, name: 'Center Back', number: 5, position: 'CB', image: '' },
          { id: 5, name: 'Left Back', number: 3, position: 'LB', image: '' },
          { id: 6, name: 'Midfielder', number: 6, position: 'CM', image: '' },
          { id: 7, name: 'Midfielder', number: 8, position: 'CM', image: '' },
          { id: 8, name: 'Midfielder', number: 10, position: 'CAM', image: '' },
          { id: 9, name: 'Right Wing', number: 7, position: 'RW', image: '' },
          { id: 10, name: 'Striker', number: 9, position: 'ST', image: '' },
          { id: 11, name: 'Left Wing', number: 11, position: 'LW', image: '' },
        ],
        away: [
          { id: 12, name: 'Goalkeeper', number: 1, position: 'GK', image: '' },
          { id: 13, name: 'Right Back', number: 2, position: 'RB', image: '' },
          { id: 14, name: 'Center Back', number: 4, position: 'CB', image: '' },
          { id: 15, name: 'Center Back', number: 5, position: 'CB', image: '' },
          { id: 16, name: 'Left Back', number: 3, position: 'LB', image: '' },
          { id: 17, name: 'Right Mid', number: 7, position: 'RM', image: '' },
          { id: 18, name: 'Center Mid', number: 6, position: 'CM', image: '' },
          { id: 19, name: 'Center Mid', number: 8, position: 'CM', image: '' },
          { id: 20, name: 'Left Mid', number: 11, position: 'LM', image: '' },
          { id: 21, name: 'Striker', number: 9, position: 'ST', image: '' },
          { id: 22, name: 'Striker', number: 10, position: 'ST', image: '' },
        ],
      });

      // Mock events
      if (match?.status === 'completed') {
        setEvents([
          { id: 1, minute: 23, type: 'goal', team: 'home', player: 'Player A', detail: 'Left foot shot' },
          { id: 2, minute: 34, type: 'yellow', team: 'away', player: 'Player B' },
          { id: 3, minute: 67, type: 'goal', team: 'home', player: 'Player C', related: 'Player A' },
          { id: 4, minute: 78, type: 'goal', team: 'away', player: 'Player D', detail: 'Penalty' },
        ]);
      }
    } catch (error) {
      console.error('Error fetching external stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMatchDetails();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Match not found</p>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>
      </div>
    );
  }

  const matchDate = new Date(match.match_date);
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="text-sm font-semibold">Match Details</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {/* AI Generated Match Fact */}
        <div className="mt-4">
          <MatchFact
            homeTeam={match.home_team.name}
            awayTeam={match.away_team.name}
            stadium={match.stadium}
            city={match.city}
            stage={match.stage}
          />
        </div>

        {/* Match Header Card */}
        <div className="glass-card rounded-xl p-4 mt-4 animate-fade-in">
          {/* Status & Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(matchDate, 'EEEE, MMMM d, yyyy • HH:mm')}</span>
            </div>
            {isLive && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive animate-pulse">
                LIVE
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent">
                FULL TIME
              </span>
            )}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-between gap-4 py-4">
            {/* Home Team */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <img 
                src={match.home_team.flag_url || ''} 
                alt={match.home_team.name}
                className="w-16 h-10 object-cover rounded-lg shadow-md"
              />
              <span className="text-sm font-bold text-center">
                {match.home_team.name}
              </span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center">
              {isCompleted || isLive ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">{match.home_score ?? 0}</span>
                  <span className="text-xl text-muted-foreground">-</span>
                  <span className="text-4xl font-bold">{match.away_score ?? 0}</span>
                </div>
              ) : (
                <span className="text-xl font-bold text-muted-foreground">VS</span>
              )}
              {isLive && (
                <span className="mt-2 text-xs text-destructive font-semibold">45'+2</span>
              )}
            </div>

            {/* Away Team */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <img 
                src={match.away_team.flag_url || ''} 
                alt={match.away_team.name}
                className="w-16 h-10 object-cover rounded-lg shadow-md"
              />
              <span className="text-sm font-bold text-center">
                {match.away_team.name}
              </span>
            </div>
          </div>

          {/* Venue */}
          <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-border text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{match.stadium}, {match.city}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="h2h" className="flex-1 text-xs">
              <Swords className="w-3.5 h-3.5 mr-1.5" />
              H2H
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="lineups" className="flex-1 text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Lineups
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-xs">
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Events
            </TabsTrigger>
          </TabsList>

          {/* Head to Head Tab */}
          <TabsContent value="h2h" className="mt-4">
            <HeadToHead 
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              currentMatchId={match.id}
            />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="mt-4">
            {statistics.length > 0 ? (
              <div className="glass-card rounded-xl divide-y divide-border overflow-hidden">
                {statistics.map((stat, index) => (
                  <StatRow key={index} stat={stat} />
                ))}
              </div>
            ) : (
              <EmptyState icon={BarChart3} message="Statistics will be available during/after the match" />
            )}
          </TabsContent>

          {/* Lineups Tab */}
          <TabsContent value="lineups" className="mt-4">
            {lineup ? (
              <div className="space-y-4">
                {/* Formations */}
                <div className="flex justify-between px-4 py-3 glass-card rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Formation</p>
                    <p className="text-lg font-bold text-primary">{lineup.homeFormation}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Formation</p>
                    <p className="text-lg font-bold text-primary">{lineup.awayFormation}</p>
                  </div>
                </div>

                {/* Starting XI */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <img 
                        src={match.home_team.flag_url || ''} 
                        alt=""
                        className="w-6 h-4 object-cover rounded"
                      />
                      <span className="text-xs font-semibold">{match.home_team.code}</span>
                    </div>
                    <div className="space-y-2">
                      {lineup.home.map((player) => (
                        <div key={player.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-secondary text-[10px] font-bold flex items-center justify-center">
                            {player.number}
                          </span>
                          <span className="text-xs truncate">{player.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                      <img 
                        src={match.away_team.flag_url || ''} 
                        alt=""
                        className="w-6 h-4 object-cover rounded"
                      />
                      <span className="text-xs font-semibold">{match.away_team.code}</span>
                    </div>
                    <div className="space-y-2">
                      {lineup.away.map((player) => (
                        <div key={player.id} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-secondary text-[10px] font-bold flex items-center justify-center">
                            {player.number}
                          </span>
                          <span className="text-xs truncate">{player.position}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Users} message="Lineups will be available 1 hour before kick-off" />
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-4">
            {events.length > 0 ? (
              <div className="glass-card rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} match={match} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon={Target} message="Match events will appear here during the game" />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// Stat Row Component
function StatRow({ stat }: { stat: MatchStatistic }) {
  const homeValue = typeof stat.home === 'string' ? parseInt(stat.home) || 0 : stat.home;
  const awayValue = typeof stat.away === 'string' ? parseInt(stat.away) || 0 : stat.away;
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{stat.home}</span>
        <span className="text-xs text-muted-foreground">{stat.type}</span>
        <span className="text-sm font-semibold">{stat.away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
        <div 
          className="bg-primary transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div 
          className="bg-accent transition-all duration-500"
          style={{ width: `${100 - homePercent}%` }}
        />
      </div>
    </div>
  );
}

// Event Row Component
function EventRow({ event, match }: { event: MatchEvent; match: Match }) {
  const isHome = event.team === 'home';
  
  const getEventIcon = () => {
    switch (event.type) {
      case 'goal':
        return '⚽';
      case 'yellow':
        return '🟨';
      case 'red':
        return '🟥';
      case 'sub':
        return '🔄';
      default:
        return '📌';
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3",
      isHome ? "flex-row" : "flex-row-reverse"
    )}>
      <div className={cn(
        "flex-1",
        isHome ? "text-left" : "text-right"
      )}>
        <p className="text-sm font-medium">{event.player}</p>
        {event.related && (
          <p className="text-xs text-muted-foreground">Assist: {event.related}</p>
        )}
        {event.detail && (
          <p className="text-xs text-muted-foreground">{event.detail}</p>
        )}
      </div>
      
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-lg">{getEventIcon()}</span>
        <span className="text-[10px] font-bold text-primary">{event.minute}'</span>
      </div>
      
      <div className="flex-1" />
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, message }: { icon: React.ComponentType<{ className?: string }>; message: string }) {
  return (
    <div className="glass-card rounded-xl p-8 text-center">
      <Icon className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
