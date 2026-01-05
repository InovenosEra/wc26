import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Team } from '@/types';
import { format } from 'date-fns';
import { Loader2, Trophy, Minus, Globe, Calendar } from 'lucide-react';

interface HeadToHeadMatch {
  id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  stadium: string | null;
  stage: string | null;
  home_team: Team;
  away_team: Team;
}

interface HistoricalMatch {
  year: number;
  tournament: string;
  stage: string;
  team1Score: number;
  team2Score: number;
  venue: string;
  winner: string;
}

interface HistoricalData {
  totalMatches: number;
  team1Wins: number;
  team2Wins: number;
  draws: number;
  matches: HistoricalMatch[];
  notableStats: string;
}

interface HeadToHeadProps {
  homeTeam: Team;
  awayTeam: Team;
  currentMatchId: string;
}

interface HeadToHeadStats {
  homeWins: number;
  awayWins: number;
  draws: number;
  homeGoals: number;
  awayGoals: number;
}

export function HeadToHead({ homeTeam, awayTeam, currentMatchId }: HeadToHeadProps) {
  const [matches, setMatches] = useState<HeadToHeadMatch[]>([]);
  const [stats, setStats] = useState<HeadToHeadStats | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchHeadToHead();
    fetchHistoricalData();
  }, [homeTeam.id, awayTeam.id]);

  const fetchHeadToHead = async () => {
    try {
      setLoadingDb(true);

      // Fetch matches where these two teams played against each other
      const { data, error } = await supabase
        .from('matches')
        .select(`
          id,
          home_score,
          away_score,
          match_date,
          stadium,
          stage,
          home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, group_name),
          away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, group_name)
        `)
        .neq('id', currentMatchId)
        .or(`and(home_team_id.eq.${homeTeam.id},away_team_id.eq.${awayTeam.id}),and(home_team_id.eq.${awayTeam.id},away_team_id.eq.${homeTeam.id})`)
        .not('home_score', 'is', null)
        .order('match_date', { ascending: false });

      if (error) throw error;

      const h2hMatches = (data || []).map(m => ({
        id: m.id,
        home_score: m.home_score,
        away_score: m.away_score,
        match_date: m.match_date,
        stadium: m.stadium,
        stage: m.stage,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
      }));

      setMatches(h2hMatches);

      // Calculate stats
      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      let homeGoals = 0;
      let awayGoals = 0;

      h2hMatches.forEach(match => {
        const homeScore = match.home_score ?? 0;
        const awayScore = match.away_score ?? 0;

        // Determine if current homeTeam was home or away in this match
        const isHomeTeamHome = match.home_team.id === homeTeam.id;

        if (isHomeTeamHome) {
          homeGoals += homeScore;
          awayGoals += awayScore;
          if (homeScore > awayScore) homeWins++;
          else if (homeScore < awayScore) awayWins++;
          else draws++;
        } else {
          homeGoals += awayScore;
          awayGoals += homeScore;
          if (awayScore > homeScore) homeWins++;
          else if (awayScore < homeScore) awayWins++;
          else draws++;
        }
      });

      setStats({ homeWins, awayWins, draws, homeGoals, awayGoals });
    } catch (error) {
      console.error('Error fetching head-to-head:', error);
    } finally {
      setLoadingDb(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      setLoadingHistory(true);
      
      const { data, error } = await supabase.functions.invoke('h2h-history', {
        body: {
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
        },
      });

      if (error) throw error;
      
      if (data?.history) {
        setHistoricalData(data.history);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loading = loadingDb && loadingHistory;

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasDbMatches = matches.length > 0;
  const hasHistoricalMatches = historicalData && historicalData.totalMatches > 0;

  if (!hasDbMatches && !hasHistoricalMatches && !loadingHistory) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No previous World Cup meetings between {homeTeam.name} and {awayTeam.name}
        </p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          This will be their first World Cup encounter!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Historical World Cup Data */}
      {loadingHistory ? (
        <div className="glass-card rounded-xl p-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading World Cup history...</span>
        </div>
      ) : historicalData && historicalData.totalMatches > 0 ? (
        <div className="space-y-4">
          {/* Historical Summary */}
          <div className="glass-card rounded-xl p-4 border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-primary">World Cup History</h3>
            </div>
            
            <div className="flex items-center justify-between gap-2 mb-4">
              {/* Home Team Wins */}
              <div className="flex-1 text-center">
                <img 
                  src={homeTeam.flag_url || ''} 
                  alt={homeTeam.name}
                  className="w-10 h-6 object-cover rounded mx-auto mb-2"
                />
                <span className="text-xs font-medium block mb-1">{homeTeam.code}</span>
                <span className="text-2xl font-bold text-primary">{historicalData.team1Wins}</span>
                <span className="text-xs text-muted-foreground block">Wins</span>
              </div>

              {/* Draws */}
              <div className="flex-1 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Minus className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="text-2xl font-bold">{historicalData.draws}</span>
                <span className="text-xs text-muted-foreground block">Draws</span>
              </div>

              {/* Away Team Wins */}
              <div className="flex-1 text-center">
                <img 
                  src={awayTeam.flag_url || ''} 
                  alt={awayTeam.name}
                  className="w-10 h-6 object-cover rounded mx-auto mb-2"
                />
                <span className="text-xs font-medium block mb-1">{awayTeam.code}</span>
                <span className="text-2xl font-bold text-accent">{historicalData.team2Wins}</span>
                <span className="text-xs text-muted-foreground block">Wins</span>
              </div>
            </div>

            {/* Notable Stats */}
            {historicalData.notableStats && (
              <p className="text-xs text-muted-foreground text-center pt-3 border-t border-border italic">
                {historicalData.notableStats}
              </p>
            )}
          </div>

          {/* Historical Matches List */}
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
            <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                {historicalData.totalMatches} World Cup {historicalData.totalMatches === 1 ? 'Match' : 'Matches'}
              </span>
            </div>
            {historicalData.matches.map((match, index) => (
              <HistoricalMatchRow 
                key={index} 
                match={match} 
                homeTeam={homeTeam}
                awayTeam={awayTeam}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Current Tournament Matches from DB */}
      {hasDbMatches && (
        <>
          {/* Summary Stats from DB */}
          {stats && (
            <div className="glass-card rounded-xl p-4">
              <h3 className="text-xs font-semibold text-muted-foreground text-center mb-4">
                World Cup 2026 Matches
              </h3>
              
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-center">
                  <span className="text-xs font-medium block mb-1">{homeTeam.code}</span>
                  <span className="text-2xl font-bold text-primary">{stats.homeWins}</span>
                  <span className="text-xs text-muted-foreground block">Wins</span>
                </div>

                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold">{stats.draws}</span>
                  <span className="text-xs text-muted-foreground block">Draws</span>
                </div>

                <div className="flex-1 text-center">
                  <span className="text-xs font-medium block mb-1">{awayTeam.code}</span>
                  <span className="text-2xl font-bold text-accent">{stats.awayWins}</span>
                  <span className="text-xs text-muted-foreground block">Wins</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <span className="text-lg font-bold">{stats.homeGoals}</span>
                  <span className="text-xs text-muted-foreground ml-1">Goals</span>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="text-center">
                  <span className="text-lg font-bold">{stats.awayGoals}</span>
                  <span className="text-xs text-muted-foreground ml-1">Goals</span>
                </div>
              </div>
            </div>
          )}

          {/* DB Match History */}
          <div className="glass-card rounded-xl overflow-hidden divide-y divide-border">
            <div className="px-4 py-2 bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground">This Tournament</span>
            </div>
            {matches.map((match) => (
              <MatchHistoryRow key={match.id} match={match} homeTeam={homeTeam} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function HistoricalMatchRow({ 
  match, 
  homeTeam, 
  awayTeam 
}: { 
  match: HistoricalMatch; 
  homeTeam: Team; 
  awayTeam: Team;
}) {
  const homeWon = match.team1Score > match.team2Score;
  const awayWon = match.team2Score > match.team1Score;

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground font-medium">
          {match.tournament}
        </span>
        <span className="text-[10px] text-muted-foreground capitalize">
          {match.stage}
        </span>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <img 
            src={homeTeam.flag_url || ''} 
            alt={homeTeam.name}
            className="w-6 h-4 object-cover rounded"
          />
          <span className={`text-xs font-medium ${homeWon ? 'text-primary' : ''}`}>
            {homeTeam.code}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
          <span className={`text-sm font-bold ${homeWon ? 'text-primary' : ''}`}>
            {match.team1Score}
          </span>
          <span className="text-xs text-muted-foreground">-</span>
          <span className={`text-sm font-bold ${awayWon ? 'text-accent' : ''}`}>
            {match.team2Score}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`text-xs font-medium ${awayWon ? 'text-accent' : ''}`}>
            {awayTeam.code}
          </span>
          <img 
            src={awayTeam.flag_url || ''} 
            alt={awayTeam.name}
            className="w-6 h-4 object-cover rounded"
          />
        </div>
      </div>
      
      {match.venue && (
        <div className="text-[10px] text-muted-foreground/70 mt-1 text-center">
          {match.venue}
        </div>
      )}
    </div>
  );
}

function MatchHistoryRow({ match, homeTeam }: { match: HeadToHeadMatch; homeTeam: Team }) {
  const matchDate = new Date(match.match_date);
  const isHomeTeamHome = match.home_team.id === homeTeam.id;
  
  const displayHomeTeam = isHomeTeamHome ? match.home_team : match.away_team;
  const displayAwayTeam = isHomeTeamHome ? match.away_team : match.home_team;
  const displayHomeScore = isHomeTeamHome ? match.home_score : match.away_score;
  const displayAwayScore = isHomeTeamHome ? match.away_score : match.home_score;

  const homeWon = (displayHomeScore ?? 0) > (displayAwayScore ?? 0);
  const awayWon = (displayAwayScore ?? 0) > (displayHomeScore ?? 0);

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">
          {format(matchDate, 'MMM d, yyyy')}
        </span>
        {match.stage && (
          <span className="text-[10px] text-muted-foreground capitalize">
            {match.stage}
          </span>
        )}
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <img 
            src={displayHomeTeam.flag_url || ''} 
            alt={displayHomeTeam.name}
            className="w-6 h-4 object-cover rounded"
          />
          <span className={`text-xs font-medium ${homeWon ? 'text-primary' : ''}`}>
            {displayHomeTeam.code}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/50">
          <span className={`text-sm font-bold ${homeWon ? 'text-primary' : ''}`}>
            {displayHomeScore ?? 0}
          </span>
          <span className="text-xs text-muted-foreground">-</span>
          <span className={`text-sm font-bold ${awayWon ? 'text-accent' : ''}`}>
            {displayAwayScore ?? 0}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className={`text-xs font-medium ${awayWon ? 'text-accent' : ''}`}>
            {displayAwayTeam.code}
          </span>
          <img 
            src={displayAwayTeam.flag_url || ''} 
            alt={displayAwayTeam.name}
            className="w-6 h-4 object-cover rounded"
          />
        </div>
      </div>
    </div>
  );
}
