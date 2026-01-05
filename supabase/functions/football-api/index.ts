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
        // Get fixtures for World Cup 2026 season using filters
        endpoint = '/fixtures';
        params.append('include', 'participants;venue;state;scores');
        params.append('per_page', '100');
        params.append('filters', `fixtureSeasons:${WORLD_CUP_SEASON_ID}`);
        break;

      case 'qualifiers':
        // Get World Cup qualification fixtures (inter-confederation & UEFA playoffs)
        // UEFA World Cup Qualifiers Season ID and Inter-confederation playoff
        const qualSeasonId = url.searchParams.get('seasonId');
        endpoint = '/fixtures';
        params.append('include', 'participants;venue;state;scores;round;stage');
        params.append('per_page', '50');
        if (qualSeasonId) {
          params.append('filters', `fixtureSeasons:${qualSeasonId}`);
        } else {
          // Default: search by date range for March 2026 playoffs
          params.append('filters', 'fixtureStartingAtFrom:2026-03-20;fixtureStartingAtTo:2026-04-05');
        }
        break;

      case 'qualification-seasons':
        // Get World Cup qualification leagues/seasons
        endpoint = '/leagues';
        params.append('include', 'currentSeason');
        // Search for World Cup qualifiers
        params.append('filters', 'name:World Cup');
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

      case 'topassists':
        // Get top assists - SportMonks uses 'assistscorers' endpoint
        endpoint = `/assistscorers/seasons/${WORLD_CUP_SEASON_ID}`;
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
        break;

      case 'player':
        // Get player details by ID
        const playerId = url.searchParams.get('playerId');
        if (!playerId) {
          return new Response(
            JSON.stringify({ error: 'playerId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/players/${playerId}`;
        params.append('include', 'position;nationality;teams.team');
        break;

      case 'playersearch':
        // Search for player by name
        const playerName = url.searchParams.get('name');
        if (!playerName) {
          return new Response(
            JSON.stringify({ error: 'name required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endpoint = `/players/search/${encodeURIComponent(playerName)}`;
        params.append('include', 'position;nationality;teams.team');
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: fixtures, qualifiers, qualification-seasons, live, standings, topscorers, topassists, teams, fixture, statistics, leagues, player, playersearch' }),
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

      // Some SportMonks endpoints (especially for future tournaments) may legitimately not exist yet.
      // For these optional actions, return an empty payload with 200 so the UI can gracefully fall back.
      const allowEmptyOnNotFound =
        action === 'topassists' ||
        action === 'fixtures' ||
        endpoint.startsWith('/assistscorers');

      if (response.status === 404 && allowEmptyOnNotFound) {
        return new Response(
          JSON.stringify({ data: [], pagination: { count: 0, per_page: 0, current_page: 1, has_more: false } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
