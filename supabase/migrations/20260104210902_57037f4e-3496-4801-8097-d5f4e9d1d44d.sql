-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Leagues are viewable by members" ON public.leagues;

-- Create a security definer function to check league membership without recursion
CREATE OR REPLACE FUNCTION public.is_league_member(_user_id uuid, _league_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.league_members 
    WHERE user_id = _user_id AND league_id = _league_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Leagues are viewable by members" 
ON public.leagues 
FOR SELECT 
USING (
  is_global = true 
  OR owner_id = auth.uid() 
  OR public.is_league_member(auth.uid(), id)
);