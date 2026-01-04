-- Allow users to delete their own predictions
CREATE POLICY "Users can delete own predictions" 
ON public.predictions 
FOR DELETE 
USING (auth.uid() = user_id);