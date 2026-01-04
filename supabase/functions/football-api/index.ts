import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';

// World Cup 2026 league ID (use 1 for World Cup, we'll adjust when the real tournament ID is available)
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FOOTBALL_API_KEY');
    if (!apiKey) {
      console.error('FOOTBALL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log(`Football API request: action=${action}`);

    let endpoint = '';
    const params = new URLSearchParams();

    switch (action) {
      case 'fixtures':
        // Get World Cup fixtures
        endpoint = '/fixtures';
        params.append('league', WORLD_CUP_LEAGUE_ID.toString());
        params.append('season', WORLD_CUP_SEASON.toString());
        break;

      case 'live':
        // Get live matches
        endpoint = '/fixtures';
        params.append('live', 'all');
        params.append('league', WORLD_CUP_LEAGUE_ID.toString());
        break;

      case 'standings':
        // Get group standings
        endpoint = '/standings';
        params.append('league', WORLD_CUP_LEAGUE_ID.toString());
        params.append('season', WORLD_CUP_SEASON.toString());
        break;

      case 'topscorers':
        // Get top scorers
        endpoint = '/players/topscorers';
        params.append('league', WORLD_CUP_LEAGUE_ID.toString());
        params.append('season', WORLD_CUP_SEASON.toString());
        break;

      case 'teams':
        // Get all teams in World Cup
        endpoint = '/teams';
        params.append('league', WORLD_CUP_LEAGUE_ID.toString());
        params.append('season', WORLD_CUP_SEASON.toString());
        break;

      case 'fixture':
        // Get specific fixture details
        const fixtureId = url.searchParams.get('fixtureId');
        if (!fixtureId) {
          return new Response(
            JSON.stringify({ error: 'fixtureId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/fixtures';
        params.append('id', fixtureId);
        break;

      case 'statistics':
        // Get fixture statistics
        const statsFixtureId = url.searchParams.get('fixtureId');
        if (!statsFixtureId) {
          return new Response(
            JSON.stringify({ error: 'fixtureId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = '/fixtures/statistics';
        params.append('fixture', statsFixtureId);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: fixtures, live, standings, topscorers, teams, fixture, statistics' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const apiUrl = `${API_FOOTBALL_BASE}${endpoint}?${params.toString()}`;
    console.log(`Calling API-Football: ${endpoint}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`API-Football error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`API-Football response: ${data.results} results, errors: ${JSON.stringify(data.errors)}`);

    // Check for API errors
    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error('API-Football returned errors:', data.errors);
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
