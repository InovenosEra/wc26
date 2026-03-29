import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  MapPin,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Swords,
  Target,
  Users,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/football-api`;

interface FixtureDetail {
  fixture: {
    id: number;
    date: string;
    venue: { name: string; city: string };
    status: { short: string; long: string; elapsed: number | null };
  };
  league: { name: string; round: string; logo: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
  events?: Array<{
    time: { elapsed: number; extra: number | null };
    team: { id: number; name: string };
    player: { id: number; name: string };
    assist: { id: number | null; name: string | null };
    type: string;
    detail: string;
  }>;
  lineups?: Array<{
    team: { id: number; name: string; logo: string };
    formation: string;
    startXI: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
    substitutes: Array<{ player: { id: number; name: string; number: number; pos: string } }>;
  }>;
  statistics?: Array<{
    team: { id: number; name: string };
    statistics: Array<{ type: string; value: number | string | null }>;
  }>;
}

function mapStatus(short: string): 'scheduled' | 'live' | 'completed' {
  if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short)) return 'completed';
  return 'scheduled';
}

export default function QualifierMatchDetail() {
  const { fixtureId } = useParams();
  const navigate = useNavigate();

  const [fixture, setFixture] = useState<FixtureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('events');

  const fetchFixture = async () => {
    try {
      const [fixtureRes, statsRes] = await Promise.all([
        fetch(`${FUNCTION_URL}?action=fixture&fixtureId=${fixtureId}`),
        fetch(`${FUNCTION_URL}?action=statistics&fixtureId=${fixtureId}`),
      ]);

      if (fixtureRes.ok) {
        const fixtureData = await fixtureRes.json();
        const item = fixtureData.response?.[0];
        if (item) {
          // Merge statistics if available
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            item.statistics = statsData.response || [];
          }
          setFixture(item);
        }
      }
    } catch (error) {
      console.error('Error fetching qualifier match:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fixtureId) fetchFixture();
  }, [fixtureId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFixture();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Match not found</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const status = mapStatus(fixture.fixture.status.short);
  const isLive = status === 'live';
  const isCompleted = status === 'completed';
  const matchDate = new Date(fixture.fixture.date);

  const events = fixture.events || [];
  const homeTeamId = fixture.teams.home.id;

  // Parse statistics
  const stats: { type: string; home: string | number; away: string | number }[] = [];
  if (fixture.statistics && fixture.statistics.length === 2) {
    const homeStat = fixture.statistics.find(s => s.team.id === homeTeamId);
    const awayStat = fixture.statistics.find(s => s.team.id !== homeTeamId);
    if (homeStat && awayStat) {
      homeStat.statistics.forEach((s, i) => {
        stats.push({
          type: s.type,
          home: s.value ?? 0,
          away: awayStat.statistics[i]?.value ?? 0,
        });
      });
    }
  }

  // Parse lineups
  const homeLineup = fixture.lineups?.find(l => l.team.id === homeTeamId);
  const awayLineup = fixture.lineups?.find(l => l.team.id !== homeTeamId);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold">Qualifier Match</span>
            <span className="text-[10px] text-muted-foreground">{fixture.league.round}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("w-5 h-5", refreshing && "animate-spin")} />
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4">
        {/* League badge */}
        <div className="flex items-center justify-center gap-2 mt-4 mb-2">
          {fixture.league.logo && (
            <img src={fixture.league.logo} alt="" className="w-5 h-5" />
          )}
          <span className="text-xs text-muted-foreground font-medium">{fixture.league.name}</span>
        </div>

        {/* Match Header Card */}
        <div className="glass-card rounded-xl p-4 animate-fade-in">
          {/* Status & Date */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(matchDate, 'EEEE, MMMM d, yyyy • HH:mm')}</span>
            </div>
            {isLive && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-destructive/20 text-destructive animate-pulse">
                {fixture.fixture.status.elapsed ? `${fixture.fixture.status.elapsed}'` : 'LIVE'}
              </span>
            )}
            {isCompleted && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-accent/20 text-accent">
                {fixture.fixture.status.short === 'PEN' ? 'PENALTIES' : fixture.fixture.status.short === 'AET' ? 'AET' : 'FULL TIME'}
              </span>
            )}
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-between gap-4 py-4">
            <div className="flex-1 flex flex-col items-center gap-3">
              <img
                src={fixture.teams.home.logo}
                alt={fixture.teams.home.name}
                className="w-16 h-16 object-contain"
              />
              <span className="text-sm font-bold text-center">{fixture.teams.home.name}</span>
            </div>

            <div className="flex flex-col items-center">
              {isCompleted || isLive ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold">{fixture.goals.home ?? 0}</span>
                    <span className="text-xl text-muted-foreground">-</span>
                    <span className="text-4xl font-bold">{fixture.goals.away ?? 0}</span>
                  </div>
                  {/* Penalty score */}
                  {fixture.score.penalty.home !== null && (
                    <span className="text-xs text-muted-foreground mt-1">
                      (Pen: {fixture.score.penalty.home} - {fixture.score.penalty.away})
                    </span>
                  )}
                  {/* Half-time */}
                  {fixture.score.halftime.home !== null && (
                    <span className="text-[10px] text-muted-foreground mt-0.5">
                      HT: {fixture.score.halftime.home} - {fixture.score.halftime.away}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xl font-bold text-muted-foreground">VS</span>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center gap-3">
              <img
                src={fixture.teams.away.logo}
                alt={fixture.teams.away.name}
                className="w-16 h-16 object-contain"
              />
              <span className="text-sm font-bold text-center">{fixture.teams.away.name}</span>
            </div>
          </div>

          {/* Venue */}
          {fixture.fixture.venue.name && (
            <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-border text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              <span>{fixture.fixture.venue.name}{fixture.fixture.venue.city ? `, ${fixture.fixture.venue.city}` : ''}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="w-full bg-card border border-border">
            <TabsTrigger value="events" className="flex-1 text-xs">
              <Target className="w-3.5 h-3.5 mr-1.5" />
              Events
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex-1 text-xs">
              <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="lineups" className="flex-1 text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Lineups
            </TabsTrigger>
          </TabsList>

          {/* Events */}
          <TabsContent value="events" className="mt-4">
            {events.length > 0 ? (
              <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
                {events.map((event, idx) => {
                  const isHome = event.team.id === homeTeamId;
                  const icon = event.type === 'Goal' ? '⚽' : event.type === 'Card' ? (event.detail === 'Yellow Card' ? '🟨' : '🟥') : event.type === 'subst' ? '🔄' : '📋';
                  return (
                    <div key={idx} className={cn("flex items-center gap-3 p-3", isHome ? "flex-row" : "flex-row-reverse text-right")}>
                      <span className="text-xs font-bold text-muted-foreground w-8 shrink-0 text-center">
                        {event.time.elapsed}'{event.time.extra ? `+${event.time.extra}` : ''}
                      </span>
                      <span className="text-sm">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{event.player.name}</p>
                        {event.assist.name && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {event.type === 'subst' ? `↩ ${event.assist.name}` : `Assist: ${event.assist.name}`}
                          </p>
                        )}
                        {event.detail && event.type === 'Goal' && event.detail !== 'Normal Goal' && (
                          <p className="text-[10px] text-muted-foreground">{event.detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-2">
                <Target className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {status === 'scheduled' ? 'Events will appear once the match starts' : 'No events recorded'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Statistics */}
          <TabsContent value="stats" className="mt-4">
            {stats.length > 0 ? (
              <div className="glass-card rounded-xl divide-y divide-border overflow-hidden">
                {stats.map((stat, idx) => {
                  const hVal = typeof stat.home === 'string' ? parseInt(stat.home) || 0 : stat.home;
                  const aVal = typeof stat.away === 'string' ? parseInt(stat.away) || 0 : stat.away;
                  const total = (hVal + aVal) || 1;
                  const hPct = (hVal / total) * 100;
                  return (
                    <div key={idx} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{stat.home ?? 0}</span>
                        <span className="text-xs text-muted-foreground">{stat.type}</span>
                        <span className="text-sm font-semibold">{stat.away ?? 0}</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                        <div className="bg-primary transition-all" style={{ width: `${hPct}%` }} />
                        <div className="bg-accent transition-all" style={{ width: `${100 - hPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Statistics will be available during/after the match</p>
              </div>
            )}
          </TabsContent>

          {/* Lineups */}
          <TabsContent value="lineups" className="mt-4">
            {homeLineup && awayLineup ? (
              <div className="space-y-4">
                <div className="flex justify-between px-4 py-3 glass-card rounded-xl">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Formation</p>
                    <p className="text-lg font-bold text-primary">{homeLineup.formation}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Formation</p>
                    <p className="text-lg font-bold text-primary">{awayLineup.formation}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[homeLineup, awayLineup].map((lineup) => (
                    <div key={lineup.team.id} className="glass-card rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                        <img src={lineup.team.logo} alt="" className="w-5 h-5 object-contain" />
                        <span className="text-xs font-semibold truncate">{lineup.team.name}</span>
                      </div>
                      <div className="space-y-1.5">
                        {lineup.startXI.map((entry) => (
                          <div key={entry.player.id} className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-secondary text-[10px] font-bold flex items-center justify-center shrink-0">
                              {entry.player.number}
                            </span>
                            <span className="text-[11px] truncate">{entry.player.name}</span>
                          </div>
                        ))}
                      </div>
                      {lineup.substitutes.length > 0 && (
                        <>
                          <div className="text-[10px] text-muted-foreground mt-3 mb-1.5 font-medium">Substitutes</div>
                          <div className="space-y-1">
                            {lineup.substitutes.slice(0, 7).map((entry) => (
                              <div key={entry.player.id} className="flex items-center gap-2 opacity-70">
                                <span className="w-5 h-5 rounded bg-muted text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {entry.player.number}
                                </span>
                                <span className="text-[10px] truncate">{entry.player.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 flex flex-col items-center gap-2">
                <Users className="w-8 h-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Lineups will be available closer to kick-off</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
