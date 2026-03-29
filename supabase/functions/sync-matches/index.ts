import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_FOOTBALL_BASE = 'https://v3.football.api-sports.io';
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API_FOOTBALL_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Fetching World Cup 2026 fixtures from API-Football...');

    // Fetch fixtures
    const params = new URLSearchParams({
      league: String(WORLD_CUP_LEAGUE_ID),
      season: String(WORLD_CUP_SEASON),
    });

    const response = await fetch(`${API_FOOTBALL_BASE}/fixtures?${params.toString()}`, {
      headers: {
        'x-apisports-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API-Football error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiData = await response.json();

    if (apiData.errors && Object.keys(apiData.errors).length > 0) {
      console.error('API-Football errors:', JSON.stringify(apiData.errors));
      return new Response(
        JSON.stringify({ error: 'API returned errors', details: apiData.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fixtures = apiData.response || [];
    console.log(`Total fixtures fetched: ${fixtures.length}`);

    if (fixtures.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No fixtures found', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, code');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch teams from database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${teams.length} teams in database`);

    const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t.id]));
    const teamByCode = new Map(teams.map(t => [t.code.toLowerCase(), t.id]));

    const nameMapping: Record<string, string> = {
      'united states': 'usa',
      'usa': 'usa',
      'korea republic': 'south korea',
      'republic of korea': 'south korea',
      "côte d'ivoire": 'ivory coast',
      "cote d'ivoire": 'ivory coast',
      'ivory coast': 'ivory coast',
      'ir iran': 'iran',
      'czech republic': 'czechia',
      'bosnia and herzegovina': 'bosnia herzegovina',
      'cape verde islands': 'cape verde',
      'curacao': 'curacao',
      'curaçao': 'curacao',
    };

    const findTeamId = (teamName: string, teamCode?: string): string | null => {
      const normalized = teamName.toLowerCase().trim();

      if (teamByName.has(normalized)) return teamByName.get(normalized)!;

      const mapped = nameMapping[normalized];
      if (mapped && teamByName.has(mapped)) return teamByName.get(mapped)!;

      if (teamCode) {
        const code = teamCode.toLowerCase().trim();
        if (teamByCode.has(code)) return teamByCode.get(code)!;
      }

      return null;
    };

    // Process fixtures – API-Football response format
    const matchesToSync = [];
    const unmatchedTeams: string[] = [];

    for (const fixture of fixtures) {
      const homeTeamName = fixture.teams?.home?.name;
      const awayTeamName = fixture.teams?.away?.name;

      if (!homeTeamName || !awayTeamName) {
        console.log(`Fixture ${fixture.fixture?.id} missing teams`);
        continue;
      }

      const homeTeamId = findTeamId(homeTeamName);
      const awayTeamId = findTeamId(awayTeamName);

      if (!homeTeamId) { unmatchedTeams.push(homeTeamName); continue; }
      if (!awayTeamId) { unmatchedTeams.push(awayTeamName); continue; }

      // Determine status from fixture.fixture.status.short
      let status = 'scheduled';
      const statusShort = fixture.fixture?.status?.short || 'NS';
      if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(statusShort)) {
        status = 'live';
      } else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(statusShort)) {
        status = 'completed';
      }

      // Get scores
      const homeScore = fixture.goals?.home ?? null;
      const awayScore = fixture.goals?.away ?? null;

      // Determine stage from league.round
      let stage = 'group';
      const round = (fixture.league?.round || '').toLowerCase();
      if (round.includes('round of 32')) stage = 'round_of_32';
      else if (round.includes('round of 16')) stage = 'round_of_16';
      else if (round.includes('quarter')) stage = 'quarter_final';
      else if (round.includes('semi')) stage = 'semi_final';
      else if (round.includes('3rd') || round.includes('third')) stage = 'third_place';
      else if (round.includes('final') && !round.includes('semi') && !round.includes('quarter')) stage = 'final';

      matchesToSync.push({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: fixture.fixture?.date || fixture.fixture?.timestamp
          ? new Date((fixture.fixture.timestamp || 0) * 1000).toISOString()
          : null,
        stadium: fixture.fixture?.venue?.name || null,
        city: fixture.fixture?.venue?.city || null,
        stage,
        status,
        home_score: homeScore,
        away_score: awayScore,
      });
    }

    console.log(`Prepared ${matchesToSync.length} matches for sync`);
    if (unmatchedTeams.length > 0) {
      console.log(`Unmatched teams: ${[...new Set(unmatchedTeams)].join(', ')}`);
    }

    if (matchesToSync.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No matches could be synced - team mapping issues',
          unmatchedTeams: [...new Set(unmatchedTeams)],
          totalFixtures: fixtures.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear existing data and insert new
    await supabase.from('predictions').delete().gte('id', '00000000-0000-0000-0000-000000000000');

    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('Error deleting matches:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing matches' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('matches')
      .insert(matchesToSync)
      .select();

    if (insertError) {
      console.error('Error inserting matches:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert matches', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${inserted?.length || 0} matches from API-Football`,
        synced: inserted?.length || 0,
        unmatchedTeams: [...new Set(unmatchedTeams)],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
