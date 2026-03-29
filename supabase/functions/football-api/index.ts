import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// FIFA World Cup 2026 league ID in API-Football
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

// Known qualifier / playoff league IDs in API-Football
// NOTE: Each confederation uses a different "season" value in the API
const QUALIFIER_LEAGUES = [
  { id: 32, season: 2024, name: 'WC Qualification Europe' },
  { id: 34, season: 2026, name: 'WC Qualification South America' },
  { id: 29, season: 2023, name: 'WC Qualification Africa' },
  { id: 30, season: 2026, name: 'WC Qualification Asia' },
  { id: 31, season: 2026, name: 'WC Qualification CONCACAF' },
  { id: 33, season: 2026, name: 'WC Qualification Oceania' },
  { id: 37, season: 2026, name: 'WC Qualification Intercontinental Play-offs' },
];

async function callApiFootball(endpoint: string, params: Record<string, string>, apiKey: string): Promise<Response> {
  const searchParams = new URLSearchParams(params);
  const url = `${API_FOOTBALL_BASE}${endpoint}?${searchParams.toString()}`;

  console.log(`Calling API-Football: ${endpoint}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-apisports-key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!apiKey) {
      console.error('API_FOOTBALL_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    console.log(`API-Football request: action=${action}`);

    let endpoint = '';
    let params: Record<string, string> = {};

    switch (action) {
      case 'fixtures':
        endpoint = '/fixtures';
        params = { league: String(WORLD_CUP_LEAGUE_ID), season: String(WORLD_CUP_SEASON) };
        break;

      case 'qualifiers': {
        // Fetch from all qualifier leagues in parallel and merge results
        const allQualFixtures: any[] = [];
        
        for (const league of QUALIFIER_LEAGUES) {
          try {
            const qParams = new URLSearchParams({
              league: String(league.id),
              season: String(league.season),
            });
            const qUrl = `${API_FOOTBALL_BASE}/fixtures?${qParams.toString()}`;
            const qResp = await fetch(qUrl, {
              headers: { 'x-apisports-key': apiKey, 'Content-Type': 'application/json' },
            });
            if (qResp.ok) {
              const qData = await qResp.json();
              if (qData.response && Array.isArray(qData.response)) {
                allQualFixtures.push(...qData.response);
              }
            }
            console.log(`Qualifier league ${league.id} (${league.name}): ${qResp.ok ? 'ok' : qResp.status}`);
          } catch (e) {
            console.warn(`Failed to fetch qualifier league ${league.id}:`, e);
          }
        }

        console.log(`Total qualifier fixtures fetched: ${allQualFixtures.length}`);
        return new Response(
          JSON.stringify({ response: allQualFixtures, results: allQualFixtures.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'live': {
        // Only fetch live matches for WC and qualifier leagues
        const allLeagueIds = [WORLD_CUP_LEAGUE_ID, ...QUALIFIER_LEAGUES.map(l => l.id)];
        const liveResults: any[] = [];

        for (const leagueId of allLeagueIds) {
          try {
            const lResp = await fetch(`${API_FOOTBALL_BASE}/fixtures?live=all&league=${leagueId}`, {
              headers: { 'x-apisports-key': apiKey, 'Content-Type': 'application/json' },
            });
            if (lResp.ok) {
              const lData = await lResp.json();
              if (lData.response && Array.isArray(lData.response)) {
                liveResults.push(...lData.response);
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch live for league ${leagueId}:`, e);
          }
        }

        console.log(`Total WC-related live fixtures: ${liveResults.length}`);
        return new Response(
          JSON.stringify({ response: liveResults, results: liveResults.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'standings':
        endpoint = '/standings';
        params = { league: String(WORLD_CUP_LEAGUE_ID), season: String(WORLD_CUP_SEASON) };
        break;

      case 'topscorers':
        endpoint = '/players/topscorers';
        params = { league: String(WORLD_CUP_LEAGUE_ID), season: String(WORLD_CUP_SEASON) };
        break;

      case 'topassists':
        endpoint = '/players/topassists';
        params = { league: String(WORLD_CUP_LEAGUE_ID), season: String(WORLD_CUP_SEASON) };
        break;

      case 'teams':
        endpoint = '/teams';
        params = { league: String(WORLD_CUP_LEAGUE_ID), season: String(WORLD_CUP_SEASON) };
        break;

      case 'rankings':
        // API-Football doesn't have a direct FIFA ranking endpoint.
        // We return empty to let the client handle gracefully.
        return new Response(
          JSON.stringify({ data: [], message: 'Rankings not available via API-Football' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'fixture': {
        const fixtureId = url.searchParams.get('fixtureId');
        if (!fixtureId) {
          return new Response(
            JSON.stringify({ error: 'fixtureId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/fixtures';
        params = { id: fixtureId };
        break;
      }

      case 'statistics': {
        const statsFixtureId = url.searchParams.get('fixtureId');
        if (!statsFixtureId) {
          return new Response(
            JSON.stringify({ error: 'fixtureId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/fixtures/statistics';
        params = { fixture: statsFixtureId };
        break;
      }

      case 'leagues': {
        endpoint = '/leagues';
        const leagueSearch = url.searchParams.get('search') || 'World Cup';
        params = { search: leagueSearch };
        break;
      }

      case 'player': {
        const playerId = url.searchParams.get('playerId');
        if (!playerId) {
          return new Response(
            JSON.stringify({ error: 'playerId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/players';
        params = { id: playerId, season: String(WORLD_CUP_SEASON) };
        break;
      }

      case 'playersearch': {
        const playerName = url.searchParams.get('name');
        if (!playerName) {
          return new Response(
            JSON.stringify({ error: 'name required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/players';
        params = { search: playerName, season: String(WORLD_CUP_SEASON) };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: fixtures, qualifiers, live, standings, topscorers, topassists, teams, fixture, statistics, leagues, player, playersearch, rankings' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const response = await callApiFootball(endpoint, params, apiKey);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API-Football error: ${response.status} ${response.statusText}`, errorText);

      if (action === 'qualifiers') {
        console.warn('Falling back to empty qualifiers payload because API-Football rejected the request');
        return new Response(
          JSON.stringify({ response: [], results: 0, message: 'Qualifier live data unavailable for the current API-Football query' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`API-Football response received, results: ${data.results ?? 0}`);

    // Check for API-level errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football returned errors:', JSON.stringify(data.errors));

      if (action === 'qualifiers') {
        console.warn('Falling back to empty qualifiers payload because API-Football returned validation errors');
        return new Response(
          JSON.stringify({ response: [], results: 0, message: 'Qualifier live data unavailable for the current API-Football query' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'API returned errors', details: data.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in football-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
