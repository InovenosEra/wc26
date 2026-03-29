import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// FIFA World Cup 2026 league ID in API-Football
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

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
        const startDate = '2026-03-20';
        const endDate = '2026-04-05';
        endpoint = '/fixtures';
        params = { from: startDate, to: endDate };
        break;
      }

      case 'live':
        endpoint = '/fixtures';
        params = { live: 'all' };
        break;

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

      case 'leagues':
        endpoint = '/leagues';
        params = { search: 'World Cup' };
        break;

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
