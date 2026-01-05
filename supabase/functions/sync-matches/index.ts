import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPORTMONKS_BASE = 'https://api.sportmonks.com/v3/football';
const WORLD_CUP_SEASON_ID = 26618;

interface SportMonksFixture {
  id: number;
  starting_at: string;
  name: string;
  state_id: number;
  venue_id: number;
  venue?: {
    id: number;
    name: string;
    city_name: string;
  };
  state?: {
    id: number;
    state: string;
    short_name: string;
  };
  participants?: Array<{
    id: number;
    name: string;
    short_code: string;
    image_path: string;
    meta: {
      location: 'home' | 'away';
    };
  }>;
  scores?: Array<{
    participant_id: number;
    score: {
      goals: number;
    };
    description: string;
  }>;
  stage?: {
    id: number;
    name: string;
  };
  round?: {
    id: number;
    name: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SPORTMONKS_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'SportMonks API key not configured' }),
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

    console.log('Fetching fixtures from SportMonks...');

    // Fetch all fixtures for World Cup 2026 season - fetch all pages
    let allFixtures: SportMonksFixture[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= 20) { // Safety limit of 20 pages
      const params = new URLSearchParams();
      params.append('api_token', apiKey);
      params.append('include', 'participants;venue;state;scores;stage;round');
      params.append('per_page', '100');
      params.append('page', currentPage.toString());

      const apiUrl = `${SPORTMONKS_BASE}/fixtures/seasons/${WORLD_CUP_SEASON_ID}?${params.toString()}`;
      
      console.log(`Fetching page ${currentPage}...`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SportMonks API error:', response.status, errorText);
        
        // If 404, try alternative endpoint
        if (response.status === 404 && currentPage === 1) {
          console.log('Trying alternative fixtures endpoint...');
          const altParams = new URLSearchParams();
          altParams.append('api_token', apiKey);
          altParams.append('include', 'participants;venue;state;scores;stage;round');
          altParams.append('per_page', '100');
          altParams.append('filters', `fixtureSeasons:${WORLD_CUP_SEASON_ID}`);
          
          const altUrl = `${SPORTMONKS_BASE}/fixtures?${altParams.toString()}`;
          const altResponse = await fetch(altUrl);
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            allFixtures = altData.data || [];
            hasMore = altData.pagination?.has_more || false;
            
            // Fetch remaining pages from alt endpoint
            while (hasMore && currentPage < 20) {
              currentPage++;
              altParams.set('page', currentPage.toString());
              const pageResponse = await fetch(`${SPORTMONKS_BASE}/fixtures?${altParams.toString()}`);
              if (pageResponse.ok) {
                const pageData = await pageResponse.json();
                allFixtures = allFixtures.concat(pageData.data || []);
                hasMore = pageData.pagination?.has_more || false;
                console.log(`Alt page ${currentPage}: ${pageData.data?.length || 0} fixtures`);
              } else {
                hasMore = false;
              }
            }
            break;
          }
        }
        
        return new Response(
          JSON.stringify({ error: `API error: ${response.status}`, details: errorText }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const pageFixtures = data.data || [];
      allFixtures = allFixtures.concat(pageFixtures);
      
      console.log(`Page ${currentPage}: ${pageFixtures.length} fixtures`);
      
      hasMore = data.pagination?.has_more || false;
      currentPage++;
    }

    const fixtures = allFixtures;
    console.log(`Total fixtures fetched: ${fixtures.length}`);

    if (fixtures.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No fixtures found in SportMonks API', 
          synced: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch existing teams from database
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

    // Create maps for team lookup
    const teamByName = new Map(teams.map(t => [t.name.toLowerCase(), t.id]));
    const teamByCode = new Map(teams.map(t => [t.code.toLowerCase(), t.id]));

    // Name mapping for differences between SportMonks and our database
    const nameMapping: Record<string, string> = {
      'united states': 'usa',
      'korea republic': 'south korea',
      'republic of korea': 'south korea',
      'côte d\'ivoire': 'ivory coast',
      'cote d\'ivoire': 'ivory coast',
      'ir iran': 'iran',
      'czech republic': 'czechia',
      'bosnia and herzegovina': 'bosnia herzegovina',
    };

    const findTeamId = (participant: { name: string; short_code: string }): string | null => {
      const normalizedName = participant.name.toLowerCase();
      const normalizedCode = participant.short_code?.toLowerCase();

      if (teamByName.has(normalizedName)) {
        return teamByName.get(normalizedName)!;
      }

      const mappedName = nameMapping[normalizedName];
      if (mappedName && teamByName.has(mappedName)) {
        return teamByName.get(mappedName)!;
      }

      if (normalizedCode && teamByCode.has(normalizedCode)) {
        return teamByCode.get(normalizedCode)!;
      }

      return null;
    };

    // Process fixtures
    const matchesToSync = [];
    const unmatchedTeams: string[] = [];

    for (const fixture of fixtures) {
      const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
      const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');

      if (!homeTeam || !awayTeam) {
        console.log(`Fixture ${fixture.id} (${fixture.name}) missing participants`);
        continue;
      }

      const homeTeamId = findTeamId(homeTeam);
      const awayTeamId = findTeamId(awayTeam);

      if (!homeTeamId) {
        unmatchedTeams.push(`${homeTeam.name} (${homeTeam.short_code})`);
        continue;
      }
      if (!awayTeamId) {
        unmatchedTeams.push(`${awayTeam.name} (${awayTeam.short_code})`);
        continue;
      }

      // Determine match status
      let status = 'scheduled';
      const stateShort = fixture.state?.short_name || 'NS';
      if (['LIVE', '1H', '2H', 'HT', 'ET', 'PEN_LIVE', 'BT'].includes(stateShort)) {
        status = 'live';
      } else if (['FT', 'AET', 'FT_PEN'].includes(stateShort)) {
        status = 'completed';
      }

      // Get scores
      const homeScore = fixture.scores?.find(s => 
        s.participant_id === homeTeam.id && s.description === 'CURRENT'
      )?.score?.goals ?? null;
      
      const awayScore = fixture.scores?.find(s => 
        s.participant_id === awayTeam.id && s.description === 'CURRENT'
      )?.score?.goals ?? null;

      // Determine stage
      let stage = 'group';
      const stageName = (fixture.stage?.name || fixture.round?.name || '').toLowerCase();
      if (stageName.includes('round of 32') || stageName.includes('knockout')) {
        stage = 'round_of_32';
      } else if (stageName.includes('round of 16')) {
        stage = 'round_of_16';
      } else if (stageName.includes('quarter')) {
        stage = 'quarter_final';
      } else if (stageName.includes('semi')) {
        stage = 'semi_final';
      } else if (stageName.includes('3rd') || stageName.includes('third')) {
        stage = 'third_place';
      } else if (stageName.includes('final') && !stageName.includes('semi') && !stageName.includes('quarter')) {
        stage = 'final';
      }

      matchesToSync.push({
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        match_date: fixture.starting_at,
        stadium: fixture.venue?.name || null,
        city: fixture.venue?.city_name || null,
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

    // Clear existing data and insert new matches
    await supabase.from('predictions').delete().gte('id', '00000000-0000-0000-0000-000000000000');
    
    const { error: deleteMatchesError } = await supabase
      .from('matches')
      .delete()
      .gte('id', '00000000-0000-0000-0000-000000000000');

    if (deleteMatchesError) {
      console.error('Error deleting matches:', deleteMatchesError);
      return new Response(
        JSON.stringify({ error: 'Failed to clear existing matches' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: insertedMatches, error: insertError } = await supabase
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
        message: `Synced ${insertedMatches?.length || 0} matches from SportMonks API`,
        synced: insertedMatches?.length || 0,
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
