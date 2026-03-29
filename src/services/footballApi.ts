const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/football-api`;

// ── Formatted types (unchanged public API) ──────────────────────────

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

export interface QualificationFixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number | null;
  awayScore: number | null;
  date: string;
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'tbd';
  round: string;
  stage: string;
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

// ── Helpers ──────────────────────────────────────────────────────────

async function callApi(action: string, params?: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams({ action, ...params });

  const response = await fetch(`${FUNCTION_URL}?${searchParams.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  return response.json();
}

function mapStatus(short: string): 'scheduled' | 'live' | 'completed' {
  if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO', 'CANC', 'PST', 'SUSP'].includes(short)) return 'completed';
  return 'scheduled';
}

// ── API-Football response → FormattedFixture ────────────────────────

function formatFixtures(fixtures: any[]): FormattedFixture[] {
  return fixtures.map((item) => {
    const statusShort = item.fixture?.status?.short || 'NS';
    return {
      externalId: item.fixture?.id ?? 0,
      homeTeamName: item.teams?.home?.name || 'TBD',
      awayTeamName: item.teams?.away?.name || 'TBD',
      homeTeamLogo: item.teams?.home?.logo || '',
      awayTeamLogo: item.teams?.away?.logo || '',
      homeScore: item.goals?.home ?? null,
      awayScore: item.goals?.away ?? null,
      matchDate: item.fixture?.date || '',
      stadium: item.fixture?.venue?.name || '',
      city: item.fixture?.venue?.city || '',
      status: mapStatus(statusShort),
      statusShort,
      elapsed: item.fixture?.status?.elapsed ?? null,
      round: item.league?.round || '',
    };
  });
}

// ── Public functions ─────────────────────────────────────────────────

export async function fetchLiveFixtures(): Promise<FormattedFixture[]> {
  try {
    const data = await callApi('live');
    return formatFixtures(data.response || []);
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return [];
  }
}

export async function fetchAllFixtures(): Promise<FormattedFixture[]> {
  try {
    const data = await callApi('fixtures');
    return formatFixtures(data.response || []);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return [];
  }
}

export async function fetchStandings(): Promise<Record<string, FormattedStanding[]>> {
  try {
    const data = await callApi('standings');
    const leagueStandings = data.response?.[0]?.league?.standings || [];
    const groupedStandings: Record<string, FormattedStanding[]> = {};

    // API-Football returns standings as array of groups, each group is an array of team standings
    for (const group of leagueStandings) {
      if (!Array.isArray(group)) continue;
      for (const entry of group) {
        const groupName = (entry.group || 'A').replace('Group ', '').trim();
        if (!groupedStandings[groupName]) groupedStandings[groupName] = [];

        groupedStandings[groupName].push({
          rank: entry.rank ?? 0,
          teamName: entry.team?.name || 'Unknown',
          teamCode: entry.team?.name?.substring(0, 3).toUpperCase() || 'UNK',
          teamLogo: entry.team?.logo || '',
          played: entry.all?.played ?? 0,
          won: entry.all?.win ?? 0,
          drawn: entry.all?.draw ?? 0,
          lost: entry.all?.lose ?? 0,
          goalsFor: entry.all?.goals?.for ?? 0,
          goalsAgainst: entry.all?.goals?.against ?? 0,
          goalsDiff: entry.goalsDiff ?? 0,
          points: entry.points ?? 0,
          group: groupName,
        });
      }
    }

    Object.values(groupedStandings).forEach(g => g.sort((a, b) => a.rank - b.rank));
    return groupedStandings;
  } catch (error) {
    console.error('Error fetching standings:', error);
    return {};
  }
}

export async function fetchTopScorers(): Promise<FormattedTopScorer[]> {
  try {
    const data = await callApi('topscorers');
    return (data.response || []).slice(0, 10).map((item: any) => ({
      playerName: item.player?.name || 'Unknown',
      playerPhoto: item.player?.photo || '',
      teamName: item.statistics?.[0]?.team?.name || 'Unknown',
      teamLogo: item.statistics?.[0]?.team?.logo || '',
      goals: item.statistics?.[0]?.goals?.total || 0,
    }));
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }
}

export async function fetchTopAssists(): Promise<FormattedAssist[]> {
  try {
    const data = await callApi('topassists');
    return (data.response || []).slice(0, 10).map((item: any) => ({
      playerName: item.player?.name || 'Unknown',
      playerPhoto: item.player?.photo || '',
      teamName: item.statistics?.[0]?.team?.name || 'Unknown',
      teamLogo: item.statistics?.[0]?.team?.logo || '',
      assists: item.statistics?.[0]?.goals?.assists || 0,
    }));
  } catch (error) {
    console.error('Error fetching top assists:', error);
    return [];
  }
}

export async function fetchQualificationFixtures(): Promise<QualificationFixture[]> {
  try {
    const data = await callApi('qualifiers');
    const fixtures = data.response || [];

    return fixtures.map((item: any) => {
      const statusShort = item.fixture?.status?.short || 'NS';
      return {
        id: item.fixture?.id ?? 0,
        homeTeam: item.teams?.home?.name || 'TBD',
        awayTeam: item.teams?.away?.name || 'TBD',
        homeFlag: item.teams?.home?.logo || '',
        awayFlag: item.teams?.away?.logo || '',
        homeScore: item.goals?.home ?? null,
        awayScore: item.goals?.away ?? null,
        date: item.fixture?.date || '',
        venue: item.fixture?.venue?.city || item.fixture?.venue?.name || '',
        status: mapStatus(statusShort) as 'scheduled' | 'live' | 'completed' | 'tbd',
        round: item.league?.round || '',
        stage: item.league?.name || '',
      };
    });
  } catch (error) {
    console.error('Error fetching qualification fixtures:', error);
    return [];
  }
}

export async function fetchPlayerProfile(playerName: string): Promise<PlayerProfile | null> {
  try {
    const data = await callApi('playersearch', { name: playerName });
    const players = data.response || [];

    if (players.length === 0) {
      console.log(`No player found for: ${playerName}`);
      return null;
    }

    const p = players[0];
    const dob = p.player?.birth?.date ? new Date(p.player.birth.date) : null;
    const age = dob
      ? Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : p.player?.age ?? 0;

    const stat = p.statistics?.[0];

    return {
      id: p.player?.id ?? 0,
      name: p.player?.name || p.player?.firstname || '',
      displayName: `${p.player?.firstname || ''} ${p.player?.lastname || ''}`.trim(),
      image: p.player?.photo || '',
      position: stat?.games?.position || 'Unknown',
      dateOfBirth: p.player?.birth?.date || '',
      age,
      nationality: p.player?.nationality || '',
      nationalityFlag: '',
      height: parseInt(p.player?.height || '0', 10),
      weight: parseInt(p.player?.weight || '0', 10),
      currentTeam: stat?.team
        ? { name: stat.team.name || '', logo: stat.team.logo || '' }
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
}

export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCTION_URL}?action=live`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return false;

    const data = await response.json();
    return !data.error;
  } catch {
    return false;
  }
}
