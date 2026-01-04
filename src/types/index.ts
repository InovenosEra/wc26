export interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  group_name: string | null;
}

export interface Match {
  id: string;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  stadium: string | null;
  city: string | null;
  stage: string;
  status: string;
}

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  total_points: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_home_score: number;
  predicted_away_score: number;
  points_earned: number;
  match?: Match;
}

export interface League {
  id: string;
  name: string;
  code: string | null;
  is_global: boolean;
  owner_id: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  profile: Profile;
  total_points: number;
}
