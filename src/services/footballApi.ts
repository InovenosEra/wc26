import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/football-api`;

interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      short: string;
      long: string;
      elapsed: number | null;
    };
    venue: {
      name: string;
      city: string;
    };
  };
  league: {
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
}

interface ApiFootballStanding {
  league: {
    standings: Array<Array<{
      rank: number;
      team: {
        id: number;
        name: string;
        logo: string;
      };
      points: number;
      goalsDiff: number;
      all: {
        played: number;
        win: number;
        draw: number;
        lose: number;
        goals: {
          for: number;
          against: number;
        };
      };
      group: string;
    }>>;
  };
}

interface ApiFootballTopScorer {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: Array<{
    team: {
      id: number;
      name: string;
      logo: string;
    };
    goals: {
      total: number;
    };
  }>;
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

async function callFootballApi(action: string, params?: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams({ action, ...params });
  
  const { data, error } = await supabase.functions.invoke('football-api', {
    body: null,
    headers: {},
  });

  // Use fetch directly since we need query params
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
    const data = await callFootballApi('live');
    return formatFixtures(data.response || []);
  } catch (error) {
    console.error('Error fetching live fixtures:', error);
    return [];
  }
}

export async function fetchAllFixtures(): Promise<FormattedFixture[]> {
  try {
    const data = await callFootballApi('fixtures');
    return formatFixtures(data.response || []);
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return [];
  }
}

export async function fetchStandings(): Promise<Record<string, FormattedStanding[]>> {
  try {
    const data = await callFootballApi('standings');
    const standings = data.response?.[0]?.league?.standings || [];
    
    const groupedStandings: Record<string, FormattedStanding[]> = {};
    
    standings.forEach((group: any[]) => {
      if (group.length > 0) {
        const groupName = group[0].group?.replace('Group ', '') || 'Unknown';
        groupedStandings[groupName] = group.map((team: any) => ({
          rank: team.rank,
          teamName: team.team.name,
          teamLogo: team.team.logo,
          played: team.all.played,
          won: team.all.win,
          drawn: team.all.draw,
          lost: team.all.lose,
          goalsFor: team.all.goals.for,
          goalsAgainst: team.all.goals.against,
          goalsDiff: team.goalsDiff,
          points: team.points,
          group: groupName,
        }));
      }
    });
    
    return groupedStandings;
  } catch (error) {
    console.error('Error fetching standings:', error);
    return {};
  }
}

export async function fetchTopScorers(): Promise<FormattedTopScorer[]> {
  try {
    const data = await callFootballApi('topscorers');
    return (data.response || []).slice(0, 10).map((item: ApiFootballTopScorer) => ({
      playerName: item.player.name,
      playerPhoto: item.player.photo,
      teamName: item.statistics[0]?.team.name || 'Unknown',
      teamLogo: item.statistics[0]?.team.logo || '',
      goals: item.statistics[0]?.goals.total || 0,
    }));
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    return [];
  }
}

function formatFixtures(fixtures: ApiFootballFixture[]): FormattedFixture[] {
  return fixtures.map((fixture) => {
    let status: 'scheduled' | 'live' | 'completed' = 'scheduled';
    
    const statusShort = fixture.fixture.status.short;
    if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(statusShort)) {
      status = 'live';
    } else if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(statusShort)) {
      status = 'completed';
    }
    
    return {
      externalId: fixture.fixture.id,
      homeTeamName: fixture.teams.home.name,
      awayTeamName: fixture.teams.away.name,
      homeTeamLogo: fixture.teams.home.logo,
      awayTeamLogo: fixture.teams.away.logo,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      matchDate: fixture.fixture.date,
      stadium: fixture.fixture.venue?.name || '',
      city: fixture.fixture.venue?.city || '',
      status,
      statusShort,
      elapsed: fixture.fixture.status.elapsed,
      round: fixture.league.round,
    };
  });
}

// Check if API is configured
export async function checkApiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${FUNCTION_URL}?action=teams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
