-- First, let's add more teams needed for the official FIFA schedule
INSERT INTO public.teams (id, name, code, flag_url, group_name)
VALUES
  -- Group A teams (updating)
  (gen_random_uuid(), 'South Africa', 'RSA', 'https://flagcdn.com/w80/za.png', 'A'),
  (gen_random_uuid(), 'Czechia', 'CZE', 'https://flagcdn.com/w80/cz.png', 'A'),
  
  -- Group B teams (adding remaining)
  (gen_random_uuid(), 'Qatar', 'QAT', 'https://flagcdn.com/w80/qa.png', 'B'),
  (gen_random_uuid(), 'Bosnia Herzegovina', 'BIH', 'https://flagcdn.com/w80/ba.png', 'B'),
  
  -- Group C teams
  (gen_random_uuid(), 'Brazil', 'BRA', 'https://flagcdn.com/w80/br.png', 'C'),
  (gen_random_uuid(), 'Morocco', 'MAR', 'https://flagcdn.com/w80/ma.png', 'C'),
  (gen_random_uuid(), 'Scotland', 'SCO', 'https://flagcdn.com/w80/gb-sct.png', 'C'),
  (gen_random_uuid(), 'Haiti', 'HAI', 'https://flagcdn.com/w80/ht.png', 'C'),
  
  -- Group D teams  
  (gen_random_uuid(), 'USA', 'USA', 'https://flagcdn.com/w80/us.png', 'D'),
  (gen_random_uuid(), 'Paraguay', 'PAR', 'https://flagcdn.com/w80/py.png', 'D'),
  (gen_random_uuid(), 'Australia', 'AUS', 'https://flagcdn.com/w80/au.png', 'D'),
  (gen_random_uuid(), 'Turkey', 'TUR', 'https://flagcdn.com/w80/tr.png', 'D'),
  
  -- Group E teams
  (gen_random_uuid(), 'Germany', 'GER', 'https://flagcdn.com/w80/de.png', 'E'),
  (gen_random_uuid(), 'Ivory Coast', 'CIV', 'https://flagcdn.com/w80/ci.png', 'E'),
  (gen_random_uuid(), 'Ecuador', 'ECU', 'https://flagcdn.com/w80/ec.png', 'E'),
  (gen_random_uuid(), 'Curacao', 'CUW', 'https://flagcdn.com/w80/cw.png', 'E'),
  
  -- Group F teams
  (gen_random_uuid(), 'Netherlands', 'NED', 'https://flagcdn.com/w80/nl.png', 'F'),
  (gen_random_uuid(), 'Japan', 'JPN', 'https://flagcdn.com/w80/jp.png', 'F'),
  (gen_random_uuid(), 'Poland', 'POL', 'https://flagcdn.com/w80/pl.png', 'F'),
  (gen_random_uuid(), 'Tunisia', 'TUN', 'https://flagcdn.com/w80/tn.png', 'F'),
  
  -- Group G teams
  (gen_random_uuid(), 'Belgium', 'BEL', 'https://flagcdn.com/w80/be.png', 'G'),
  (gen_random_uuid(), 'Egypt', 'EGY', 'https://flagcdn.com/w80/eg.png', 'G'),
  (gen_random_uuid(), 'Iran', 'IRN', 'https://flagcdn.com/w80/ir.png', 'G'),
  (gen_random_uuid(), 'New Zealand', 'NZL', 'https://flagcdn.com/w80/nz.png', 'G'),
  
  -- Group H teams
  (gen_random_uuid(), 'Spain', 'ESP', 'https://flagcdn.com/w80/es.png', 'H'),
  (gen_random_uuid(), 'Uruguay', 'URU', 'https://flagcdn.com/w80/uy.png', 'H'),
  (gen_random_uuid(), 'Saudi Arabia', 'KSA', 'https://flagcdn.com/w80/sa.png', 'H'),
  (gen_random_uuid(), 'Cape Verde', 'CPV', 'https://flagcdn.com/w80/cv.png', 'H'),
  
  -- Group I teams
  (gen_random_uuid(), 'France', 'FRA', 'https://flagcdn.com/w80/fr.png', 'I'),
  (gen_random_uuid(), 'Senegal', 'SEN', 'https://flagcdn.com/w80/sn.png', 'I'),
  (gen_random_uuid(), 'Norway', 'NOR', 'https://flagcdn.com/w80/no.png', 'I'),
  (gen_random_uuid(), 'Bolivia', 'BOL', 'https://flagcdn.com/w80/bo.png', 'I'),
  
  -- Group J teams
  (gen_random_uuid(), 'Argentina', 'ARG', 'https://flagcdn.com/w80/ar.png', 'J'),
  (gen_random_uuid(), 'Algeria', 'ALG', 'https://flagcdn.com/w80/dz.png', 'J'),
  (gen_random_uuid(), 'Austria', 'AUT', 'https://flagcdn.com/w80/at.png', 'J'),
  (gen_random_uuid(), 'Jordan', 'JOR', 'https://flagcdn.com/w80/jo.png', 'J'),
  
  -- Group K teams
  (gen_random_uuid(), 'Portugal', 'POR', 'https://flagcdn.com/w80/pt.png', 'K'),
  (gen_random_uuid(), 'Colombia', 'COL', 'https://flagcdn.com/w80/co.png', 'K'),
  (gen_random_uuid(), 'Uzbekistan', 'UZB', 'https://flagcdn.com/w80/uz.png', 'K'),
  (gen_random_uuid(), 'Jamaica', 'JAM', 'https://flagcdn.com/w80/jm.png', 'K'),
  
  -- Group L teams
  (gen_random_uuid(), 'England', 'ENG', 'https://flagcdn.com/w80/gb-eng.png', 'L'),
  (gen_random_uuid(), 'Croatia', 'CRO', 'https://flagcdn.com/w80/hr.png', 'L'),
  (gen_random_uuid(), 'Ghana', 'GHA', 'https://flagcdn.com/w80/gh.png', 'L'),
  (gen_random_uuid(), 'Panama', 'PAN', 'https://flagcdn.com/w80/pa.png', 'L')
ON CONFLICT (code) DO UPDATE SET 
  group_name = EXCLUDED.group_name,
  name = EXCLUDED.name,
  flag_url = EXCLUDED.flag_url;