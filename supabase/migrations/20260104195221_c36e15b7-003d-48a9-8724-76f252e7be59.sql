-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Teams table for World Cup teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  flag_url TEXT,
  group_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  home_score INTEGER,
  away_score INTEGER,
  match_date TIMESTAMPTZ NOT NULL,
  stadium TEXT,
  city TEXT,
  stage TEXT DEFAULT 'group',
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

-- Leagues (communities)
CREATE TABLE public.leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  is_global BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- League members
CREATE TABLE public.league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- Predictions
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, match_id)
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Teams policies (public read)
CREATE POLICY "Teams are viewable by everyone" ON public.teams FOR SELECT USING (true);

-- Matches policies (public read)
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Leagues policies
CREATE POLICY "Leagues are viewable by members" ON public.leagues FOR SELECT USING (
  is_global = true OR 
  owner_id = auth.uid() OR 
  id IN (SELECT league_id FROM public.league_members WHERE user_id = auth.uid())
);
CREATE POLICY "Users can create leagues" ON public.leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their leagues" ON public.leagues FOR UPDATE USING (auth.uid() = owner_id);

-- League members policies
CREATE POLICY "Members can view league members" ON public.league_members FOR SELECT USING (
  league_id IN (SELECT id FROM public.leagues WHERE is_global = true) OR
  user_id = auth.uid() OR
  league_id IN (SELECT league_id FROM public.league_members lm WHERE lm.user_id = auth.uid())
);
CREATE POLICY "Users can join leagues" ON public.league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave leagues" ON public.league_members FOR DELETE USING (auth.uid() = user_id);

-- Predictions policies
CREATE POLICY "Users can view own predictions" ON public.predictions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);

-- Function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'username');
  
  -- Add user to global league
  INSERT INTO public.league_members (league_id, user_id)
  SELECT id, new.id FROM public.leagues WHERE is_global = true;
  
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at
  BEFORE UPDATE ON public.predictions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert Global League
INSERT INTO public.leagues (name, is_global, code) VALUES ('Global Community', true, 'GLOBAL2026');

-- Insert 2026 World Cup Teams (Groups A-H)
INSERT INTO public.teams (name, code, flag_url, group_name) VALUES
-- Group A
('USA', 'USA', 'https://flagcdn.com/w80/us.png', 'A'),
('Mexico', 'MEX', 'https://flagcdn.com/w80/mx.png', 'A'),
('Canada', 'CAN', 'https://flagcdn.com/w80/ca.png', 'A'),
('Morocco', 'MAR', 'https://flagcdn.com/w80/ma.png', 'A'),
-- Group B
('Brazil', 'BRA', 'https://flagcdn.com/w80/br.png', 'B'),
('Argentina', 'ARG', 'https://flagcdn.com/w80/ar.png', 'B'),
('France', 'FRA', 'https://flagcdn.com/w80/fr.png', 'B'),
('Germany', 'GER', 'https://flagcdn.com/w80/de.png', 'B'),
-- Group C
('England', 'ENG', 'https://flagcdn.com/w80/gb-eng.png', 'C'),
('Spain', 'ESP', 'https://flagcdn.com/w80/es.png', 'C'),
('Netherlands', 'NED', 'https://flagcdn.com/w80/nl.png', 'C'),
('Portugal', 'POR', 'https://flagcdn.com/w80/pt.png', 'C'),
-- Group D
('Italy', 'ITA', 'https://flagcdn.com/w80/it.png', 'D'),
('Belgium', 'BEL', 'https://flagcdn.com/w80/be.png', 'D'),
('Croatia', 'CRO', 'https://flagcdn.com/w80/hr.png', 'D'),
('Uruguay', 'URU', 'https://flagcdn.com/w80/uy.png', 'D'),
-- Group E
('Japan', 'JPN', 'https://flagcdn.com/w80/jp.png', 'E'),
('South Korea', 'KOR', 'https://flagcdn.com/w80/kr.png', 'E'),
('Australia', 'AUS', 'https://flagcdn.com/w80/au.png', 'E'),
('Saudi Arabia', 'KSA', 'https://flagcdn.com/w80/sa.png', 'E'),
-- Group F
('Senegal', 'SEN', 'https://flagcdn.com/w80/sn.png', 'F'),
('Nigeria', 'NGA', 'https://flagcdn.com/w80/ng.png', 'F'),
('Ecuador', 'ECU', 'https://flagcdn.com/w80/ec.png', 'F'),
('Poland', 'POL', 'https://flagcdn.com/w80/pl.png', 'F'),
-- Group G
('Denmark', 'DEN', 'https://flagcdn.com/w80/dk.png', 'G'),
('Switzerland', 'SUI', 'https://flagcdn.com/w80/ch.png', 'G'),
('Serbia', 'SRB', 'https://flagcdn.com/w80/rs.png', 'G'),
('Colombia', 'COL', 'https://flagcdn.com/w80/co.png', 'G'),
-- Group H
('Wales', 'WAL', 'https://flagcdn.com/w80/gb-wls.png', 'H'),
('Iran', 'IRN', 'https://flagcdn.com/w80/ir.png', 'H'),
('Qatar', 'QAT', 'https://flagcdn.com/w80/qa.png', 'H'),
('Ghana', 'GHA', 'https://flagcdn.com/w80/gh.png', 'H');