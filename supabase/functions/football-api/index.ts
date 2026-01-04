import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';

// FIFA World Cup 2026 - Season ID from SportMonks
const WORLD_CUP_SEASON_ID = 26618;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SPORTMONKS_API_KEY');
    if (!apiKey) {
      console.error('SPORTMONKS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log(`SportMonks API request: action=${action}`);

    let endpoint = '';
    const params = new URLSearchParams();
    params.append('api_token', apiKey);

    switch (action) {
      case 'fixtures':
        // Get fixtures for World Cup 2026 season
        endpoint = `/fixtures/seasons/${WORLD_CUP_SEASON_ID}`;
        params.append('include', 'participants;venue;state;scores');
        params.append('per_page', '100');
        break;

      case 'live':
        // Get live/inplay fixtures
        endpoint = '/livescores/inplay';
        params.append('include', 'participants;venue;state;scores;periods');
        break;

      case 'standings':
        // Get standings by season
        endpoint = `/standings/seasons/${WORLD_CUP_SEASON_ID}`;
        params.append('include', 'participant;group');
        break;

      case 'topscorers':
        // Get top scorers
        endpoint = `/topscorers/seasons/${WORLD_CUP_SEASON_ID}`;
        params.append('include', 'player;participant');
        params.append('per_page', '20');
        break;

      case 'teams':
        // Get teams in league
        endpoint = `/teams/seasons/${WORLD_CUP_SEASON_ID}`;
        params.append('include', 'country');
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
        endpoint = `/fixtures/${fixtureId}`;
        params.append('include', 'participants;venue;state;scores;statistics;lineups');
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
        endpoint = `/fixtures/${statsFixtureId}`;
        params.append('include', 'statistics.type');
        break;

      case 'leagues':
        // Get available leagues (useful for finding World Cup ID)
        endpoint = '/leagues';
        params.append('include', 'currentSeason');
        params.append('filters', 'name:World Cup');
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: fixtures, live, standings, topscorers, teams, fixture, statistics, leagues' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const apiUrl = `${SPORTMONKS_BASE}${endpoint}?${params.toString()}`;
    console.log(`Calling SportMonks: ${endpoint}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SportMonks error: ${response.status} ${response.statusText}`, errorText);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`SportMonks response received, data count: ${data.data?.length || 0}`);

    // Check for API errors
    if (data.message && data.message.includes('error')) {
      console.error('SportMonks returned error:', data.message);
      return new Response(
        JSON.stringify({ error: data.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sportmonks-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
