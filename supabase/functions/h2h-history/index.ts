import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { homeTeam, awayTeam, homeTeamId, awayTeamId } = await req.json();

    if (!homeTeam || !awayTeam) {
      throw new Error('Both teams are required');
    }

    const apiKey = Deno.env.get('SPORTMONKS_API_KEY');
    if (!apiKey) {
      throw new Error('SPORTMONKS_API_KEY is not configured');
    }

    console.log(`Fetching H2H history for: ${homeTeam} vs ${awayTeam}`);

    // First, we need to find the team IDs if not provided
    let team1Id = homeTeamId;
    let team2Id = awayTeamId;

    if (!team1Id || !team2Id) {
      // Search for teams by name
      const searchTeams = async (teamName: string) => {
        const searchUrl = `${SPORTMONKS_BASE}/teams/search/${encodeURIComponent(teamName)}?api_token=${apiKey}`;
        console.log(`Searching for team: ${teamName}`);
        const response = await fetch(searchUrl);
        if (!response.ok) {
          console.error(`Team search failed for ${teamName}: ${response.status}`);
          return null;
        }
        const data = await response.json();
        // Return the first matching team (likely the national team)
        return data.data?.[0]?.id || null;
      };

      if (!team1Id) {
        team1Id = await searchTeams(homeTeam);
      }
      if (!team2Id) {
        team2Id = await searchTeams(awayTeam);
      }

      console.log(`Team IDs found: ${homeTeam}=${team1Id}, ${awayTeam}=${team2Id}`);
    }

    if (!team1Id || !team2Id) {
      console.log('Could not find team IDs, returning empty history');
      return new Response(JSON.stringify({ 
        history: {
          totalMatches: 0,
          team1Wins: 0,
          team2Wins: 0,
          draws: 0,
          matches: [],
          notableStats: `No head-to-head data available for ${homeTeam} vs ${awayTeam}`
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch head-to-head data from SportMonks
    const h2hUrl = `${SPORTMONKS_BASE}/fixtures/head-to-head/${team1Id}/${team2Id}?api_token=${apiKey}&include=participants;venue;league;scores;state&per_page=50`;
    console.log(`Fetching H2H from SportMonks`);

    const h2hResponse = await fetch(h2hUrl);
    
    if (!h2hResponse.ok) {
      const errorText = await h2hResponse.text();
      console.error('SportMonks H2H error:', h2hResponse.status, errorText);
      throw new Error(`SportMonks API error: ${h2hResponse.status}`);
    }

    const h2hData = await h2hResponse.json();
    const matches = h2hData.data || [];

    console.log(`Found ${matches.length} H2H matches`);

    // Filter for World Cup matches only
    const worldCupMatches = matches.filter((match: any) => {
      const leagueName = match.league?.name?.toLowerCase() || '';
      return leagueName.includes('world cup') || leagueName.includes('fifa world');
    });

    console.log(`Found ${worldCupMatches.length} World Cup H2H matches`);

    // Calculate stats
    let team1Wins = 0;
    let team2Wins = 0;
    let draws = 0;

    const formattedMatches = worldCupMatches.map((match: any) => {
      const homeParticipant = match.participants?.find((p: any) => p.meta?.location === 'home');
      const awayParticipant = match.participants?.find((p: any) => p.meta?.location === 'away');
      
      const homeScore = match.scores?.find((s: any) => s.participant_id === homeParticipant?.id)?.score?.goals ?? 0;
      const awayScore = match.scores?.find((s: any) => s.participant_id === awayParticipant?.id)?.score?.goals ?? 0;

      // Determine winner relative to our team1/team2
      const isTeam1Home = homeParticipant?.id === team1Id;
      const team1Score = isTeam1Home ? homeScore : awayScore;
      const team2Score = isTeam1Home ? awayScore : homeScore;

      let winner = 'Draw';
      if (team1Score > team2Score) {
        team1Wins++;
        winner = homeTeam;
      } else if (team2Score > team1Score) {
        team2Wins++;
        winner = awayTeam;
      } else {
        draws++;
      }

      // Extract year from date
      const matchDate = match.starting_at || '';
      const year = matchDate ? new Date(matchDate).getFullYear() : 0;

      // Get stage/round info
      const stageName = match.round?.name || match.stage?.name || 'Group Stage';

      return {
        year,
        tournament: match.league?.name || 'World Cup',
        stage: stageName,
        team1Score,
        team2Score,
        venue: match.venue?.city_name ? `${match.venue.city_name}, ${match.venue?.country_name || ''}` : 'Unknown',
        winner,
        date: matchDate
      };
    });

    // Sort by year, most recent first
    formattedMatches.sort((a: any, b: any) => b.year - a.year);

    // Generate notable stats
    let notableStats = '';
    if (formattedMatches.length === 0) {
      notableStats = `${homeTeam} and ${awayTeam} have never met in a FIFA World Cup match.`;
    } else if (team1Wins > team2Wins) {
      notableStats = `${homeTeam} leads the World Cup head-to-head with ${team1Wins} wins from ${formattedMatches.length} matches.`;
    } else if (team2Wins > team1Wins) {
      notableStats = `${awayTeam} leads the World Cup head-to-head with ${team2Wins} wins from ${formattedMatches.length} matches.`;
    } else {
      notableStats = `The World Cup head-to-head is even with ${draws} draws and ${team1Wins} wins each from ${formattedMatches.length} matches.`;
    }

    const history = {
      totalMatches: formattedMatches.length,
      team1Wins,
      team2Wins,
      draws,
      matches: formattedMatches,
      notableStats
    };

    console.log('Returning H2H history:', JSON.stringify(history));

    return new Response(JSON.stringify({ history }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in h2h-history function:', errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage,
      history: null
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
