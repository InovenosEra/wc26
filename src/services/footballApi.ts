const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/football-api`;

// SportMonks API response types
interface SportMonksFixture {
  id: number;
  starting_at: string;
  state: {
    id: number;
    state: string; // NS, LIVE, FT, HT, etc.
    short_name: string;
  };
  venue?: {
    id: number;
    name: string;
    city_name: string;
  };
  participants: Array<{
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
  }>;
  periods?: Array<{
    minutes: number;
    type_id: number;
  }>;
  league?: {
    name: string;
  };
  round?: {
    name: string;
  };
}

interface SportMonksStanding {
  participant_id: number;
  position: number;
  points: number;
  participant: {
    id: number;
    name: string;
    short_code: string;
    image_path: string;
  };
  group?: {
    name: string;
  };
  details: Array<{
    type_id: number;
    value: number;
  }>;
}

interface SportMonksTopScorer {
  player_id: number;
  participant_id: number;
  total: number;
  player: {
    id: number;
    display_name: string;
    image_path: string;
  };
  participant: {
    id: number;
    name: string;
    image_path: string;
  };
}

export interface FormattedFixture {
  externalId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  homeScore: number | null;
  awayScore: number | null;
  matchDate: string;
  stadium: string;
  city: string;
  status: 'scheduled' | 'live' | 'completed';
  statusShort: string;
  elapsed: number | null;
  round: string;
}

export interface FormattedStanding {
  rank: number;
  teamName: string;
  teamCode: string;
  teamLogo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalsDiff: number;
  points: number;
  group: string;
}

export interface FormattedTopScorer {
  playerName: string;
  playerPhoto: string;
  teamName: string;
  teamLogo: string;
  goals: number;
}

export interface FormattedAssist {
  playerName: string;
  playerPhoto: string;
  teamName: string;
  teamLogo: string;
  assists: number;
}

export interface PlayerProfile {
  id: number;
  name: string;
  displayName: string;
  image: string;
  position: string;
  dateOfBirth: string;
  age: number;
  nationality: string;
  nationalityFlag: string;
  height: number;
  weight: number;
  currentTeam?: {
    name: string;
    logo: string;
  };
}

async function callSportMonksApi(action: string, params?: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams({ action, ...params });
  
  const response = await fetch(`${FUNCTION_URL}?${searchParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchLiveFixtures(): Promise<FormattedFixture[]> {
  try {
    const data = await callSportMonksApi('live');
    return formatFixtures(data.data || []);
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return [];
  }
}

export async function fetchAllFixtures(): Promise<FormattedFixture[]> {
  try {
    const data = await callSportMonksApi('fixtures');
    return formatFixtures(data.data || []);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return [];
  }
}

export async function fetchStandings(): Promise<Record<string, FormattedStanding[]>> {
  try {
    const data = await callSportMonksApi('standings');
    const standings = data.data || [];
    
    const groupedStandings: Record<string, FormattedStanding[]> = {};
    
    standings.forEach((standing: SportMonksStanding) => {
      const groupName = standing.group?.name?.replace('Group ', '') || 'A';
      
      if (!groupedStandings[groupName]) {
        groupedStandings[groupName] = [];
      }
      
      // Extract stats from details array
      // Type IDs: 129=played, 130=won, 131=draw, 132=lost, 133=goals_for, 134=goals_against
      const getDetailValue = (typeId: number) => 
        standing.details?.find(d => d.type_id === typeId)?.value || 0;
      
      groupedStandings[groupName].push({
        rank: standing.position,
        teamName: standing.participant?.name || 'Unknown',
        teamCode: standing.participant?.short_code || standing.participant?.name?.substring(0, 3).toUpperCase() || 'UNK',
        teamLogo: standing.participant?.image_path || '',
        played: getDetailValue(129),
        won: getDetailValue(130),
        drawn: getDetailValue(131),
        lost: getDetailValue(132),
        goalsFor: getDetailValue(133),
        goalsAgainst: getDetailValue(134),
        goalsDiff: getDetailValue(133) - getDetailValue(134),
        points: standing.points,
        group: groupName,
      });
    });
    
    // Sort each group by position
    Object.keys(groupedStandings).forEach(group => {
      groupedStandings[group].sort((a, b) => a.rank - b.rank);
    });
    
    return groupedStandings;
  } catch (error) {
    console.error('Error fetching standings:', error);
    return {};
  }
}

export async function fetchTopScorers(): Promise<FormattedTopScorer[]> {
  try {
    const data = await callSportMonksApi('topscorers');
    return (data.data || []).slice(0, 10).map((item: SportMonksTopScorer) => ({
      playerName: item.player?.display_name || 'Unknown',
      playerPhoto: item.player?.image_path || '',
      teamName: item.participant?.name || 'Unknown',
      teamLogo: item.participant?.image_path || '',
      goals: item.total || 0,
    }));
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }
}

export async function fetchTopAssists(): Promise<FormattedAssist[]> {
  try {
    const data = await callSportMonksApi('topassists');
    return (data.data || []).slice(0, 10).map((item: SportMonksTopScorer) => ({
      playerName: item.player?.display_name || 'Unknown',
      playerPhoto: item.player?.image_path || '',
      teamName: item.participant?.name || 'Unknown',
      teamLogo: item.participant?.image_path || '',
      assists: item.total || 0,
    }));
  } catch (error) {
    console.error('Error fetching top assists:', error);
    return [];
  }
}

export async function fetchPlayerProfile(playerName: string): Promise<PlayerProfile | null> {
  try {
    const data = await callSportMonksApi('playersearch', { name: playerName });
    const players = data.data || [];
    
    if (players.length === 0) {
      console.log(`No player found for: ${playerName}`);
      return null;
    }

    const player = players[0];
    
    // Calculate age from date of birth
    const dob = player.date_of_birth ? new Date(player.date_of_birth) : null;
    const age = dob ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    // Get current team from teams array
    const currentTeam = player.teams?.find((t: any) => !t.end)?.team;

    return {
      id: player.id,
      name: player.name || player.display_name,
      displayName: player.display_name || player.name,
      image: player.image_path || '',
      position: player.position?.name || 'Unknown',
      dateOfBirth: player.date_of_birth || '',
      age,
      nationality: player.nationality?.name || '',
      nationalityFlag: player.nationality?.image_path || '',
      height: player.height || 0,
      weight: player.weight || 0,
      currentTeam: currentTeam ? {
        name: currentTeam.name || '',
        logo: currentTeam.image_path || '',
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

function formatFixtures(fixtures: SportMonksFixture[]): FormattedFixture[] {
  return fixtures.map((fixture) => {
    // Determine status from state
    let status: 'scheduled' | 'live' | 'completed' = 'scheduled';
    const stateShort = fixture.state?.short_name || 'NS';
    
    // Live states
    if (['LIVE', '1H', '2H', 'HT', 'ET', 'PEN_LIVE', 'BT'].includes(stateShort)) {
      status = 'live';
    }
    // Completed states
    else if (['FT', 'AET', 'FT_PEN', 'CANCL', 'POSTP', 'SUSP', 'AWD', 'WO'].includes(stateShort)) {
      status = 'completed';
    }

    // Get home and away teams
    const homeTeam = fixture.participants?.find(p => p.meta.location === 'home');
    const awayTeam = fixture.participants?.find(p => p.meta.location === 'away');

    // Get scores
    const homeScore = fixture.scores?.find(s => s.participant_id === homeTeam?.id)?.score?.goals ?? null;
    const awayScore = fixture.scores?.find(s => s.participant_id === awayTeam?.id)?.score?.goals ?? null;

    // Get elapsed time from periods
    const currentPeriod = fixture.periods?.find(p => p.type_id === 1 || p.type_id === 2);
    const elapsed = currentPeriod?.minutes ?? null;

    return {
      externalId: fixture.id,
      homeTeamName: homeTeam?.name || 'TBD',
      awayTeamName: awayTeam?.name || 'TBD',
      homeTeamLogo: homeTeam?.image_path || '',
      awayTeamLogo: awayTeam?.image_path || '',
      homeScore,
      awayScore,
      matchDate: fixture.starting_at,
      stadium: fixture.venue?.name || '',
      city: fixture.venue?.city_name || '',
      status,
      statusShort: stateShort,
      elapsed,
      round: fixture.round?.name || fixture.league?.name || '',
    };
  });
}

// Check if API is configured and working
export async function checkApiConnection(): Promise<boolean> {
  try {
    // Use the live endpoint to check connection - simplest and most reliable
    const response = await fetch(`${FUNCTION_URL}?action=live`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    // If we get data (even empty), the API is working
    return !data.error;
  } catch {
    return false;
  }
}
