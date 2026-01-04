-- Allow authenticated users to view all predictions for leaderboard calculations
DROP POLICY IF EXISTS "Users can view own predictions" ON public.predictions;

CREATE POLICY "Authenticated users can view all predictions" 
ON public.predictions 
FOR SELECT 
USING (true);

-- Enable realtime for matches
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;