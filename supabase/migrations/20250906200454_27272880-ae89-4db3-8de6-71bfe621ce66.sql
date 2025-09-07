-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_id UUID NOT NULL,
  category TEXT NOT NULL,
  prize INTEGER NOT NULL DEFAULT 0,
  is_official BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_habits table
CREATE TABLE public.challenge_habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('good', 'bad', 'both')),
  goal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_dailies table  
CREATE TABLE public.challenge_dailies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_todos table
CREATE TABLE public.challenge_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge_rewards table
CREATE TABLE public.challenge_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cost INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_challenges junction table
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable Row Level Security
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_dailies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Create policies for challenges (public read, authenticated users can create)
CREATE POLICY "Anyone can view challenges" 
ON public.challenges 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create challenges" 
ON public.challenges 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own challenges" 
ON public.challenges 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own challenges" 
ON public.challenges 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create policies for challenge_habits (public read, creators can modify)
CREATE POLICY "Anyone can view challenge habits" 
ON public.challenge_habits 
FOR SELECT 
USING (true);

CREATE POLICY "Challenge creators can manage habits" 
ON public.challenge_habits 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_habits.challenge_id 
    AND challenges.creator_id = auth.uid()
  )
);

-- Create policies for challenge_dailies (public read, creators can modify)
CREATE POLICY "Anyone can view challenge dailies" 
ON public.challenge_dailies 
FOR SELECT 
USING (true);

CREATE POLICY "Challenge creators can manage dailies" 
ON public.challenge_dailies 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_dailies.challenge_id 
    AND challenges.creator_id = auth.uid()
  )
);

-- Create policies for challenge_todos (public read, creators can modify)
CREATE POLICY "Anyone can view challenge todos" 
ON public.challenge_todos 
FOR SELECT 
USING (true);

CREATE POLICY "Challenge creators can manage todos" 
ON public.challenge_todos 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_todos.challenge_id 
    AND challenges.creator_id = auth.uid()
  )
);

-- Create policies for challenge_rewards (public read, creators can modify)
CREATE POLICY "Anyone can view challenge rewards" 
ON public.challenge_rewards 
FOR SELECT 
USING (true);

CREATE POLICY "Challenge creators can manage rewards" 
ON public.challenge_rewards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE challenges.id = challenge_rewards.challenge_id 
    AND challenges.creator_id = auth.uid()
  )
);

-- Create policies for user_challenges
CREATE POLICY "Users can view their own challenge memberships" 
ON public.user_challenges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges" 
ON public.user_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" 
ON public.user_challenges 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_challenges_creator_id ON public.challenges(creator_id);
CREATE INDEX idx_challenges_category ON public.challenges(category);
CREATE INDEX idx_challenge_habits_challenge_id ON public.challenge_habits(challenge_id);
CREATE INDEX idx_challenge_dailies_challenge_id ON public.challenge_dailies(challenge_id);
CREATE INDEX idx_challenge_todos_challenge_id ON public.challenge_todos(challenge_id);
CREATE INDEX idx_challenge_rewards_challenge_id ON public.challenge_rewards(challenge_id);
CREATE INDEX idx_user_challenges_user_id ON public.user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges(challenge_id);
