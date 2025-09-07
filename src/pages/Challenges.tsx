import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Navigate, Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProfilePopover } from '@/components/ProfilePopover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Target, 
  Calendar,
  CheckSquare,
  Gift,
  Users,
  Crown,
  BookOpen,
  Heart,
  Palette,
  GamepadIcon,
  DollarSign,
  Brain,
  MapPin,
  Clock,
  TrendingUp,
  X
} from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string;
  creator: string;
  prize: number;
  participants: number;
  tags: string[];
  stats: {
    habits: number;
    daily: number;
    todo: number;
    rewards: number;
  };
  category: string;
  isOfficial: boolean;
  habits: Array<{
    title: string;
    type: 'good' | 'bad' | 'both';
    goal?: number;
  }>;
  dailies: Array<{
    title: string;
    notes?: string;
  }>;
  todos: Array<{
    title: string;
    notes?: string;
  }>;
  rewards: Array<{
    title: string;
    cost: number;
  }>;
}

const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Official Back-to-School Preparation Challenge (2025)',
    description: 'Getting ready for the new school year? Check out this Challenge for help getting prepared and a fun motivation boost! Plus, there\'s a chance to win gems and subscription prizes!',
    creator: 'beffymaroo',
    prize: 25,
    participants: 4977,
    tags: ['Official', 'Academics', 'Getting Organized', 'Time-Management + Accountability'],
    stats: { habits: 4, daily: 0, todo: 6, rewards: 0 },
    category: 'Academics',
    isOfficial: true,
    habits: [
      { title: 'Pack school bag the night before', type: 'good', goal: 1 },
      { title: 'Review class notes', type: 'good', goal: 1 },
      { title: 'Procrastinate on homework', type: 'bad' },
      { title: 'Organize study space', type: 'good', goal: 1 }
    ],
    dailies: [],
    todos: [
      { title: 'Buy school supplies', notes: 'Make a list first' },
      { title: 'Set up study schedule', notes: 'Include breaks' },
      { title: 'Register for classes' },
      { title: 'Update contact info at school' },
      { title: 'Join study groups' },
      { title: 'Meet with academic advisor' }
    ],
    rewards: []
  },
  {
    id: '2',
    title: 'Feed Me, Seymour! (TAKE THIS Challenge - August 2025)',
    description: 'Good nutrition is important for our overall wellness. This TakeThis.org challenge invites us to change some of our eating habits for the better!',
    creator: 'Kalista',
    prize: 10,
    participants: 4977,
    tags: ['Health + Fitness', 'Official'],
    stats: { habits: 3, daily: 2, todo: 4, rewards: 0 },
    category: 'Health + Fitness',
    isOfficial: true,
    habits: [
      { title: 'Drink 8 glasses of water', type: 'good', goal: 8 },
      { title: 'Eat a healthy snack', type: 'good', goal: 2 },
      { title: 'Skip meals', type: 'bad' }
    ],
    dailies: [
      { title: 'Take vitamins', notes: 'Morning routine' },
      { title: 'Prepare healthy meal', notes: 'Plan ahead' }
    ],
    todos: [
      { title: 'Stock healthy snacks', notes: 'Fruits, nuts, yogurt' },
      { title: 'Plan weekly meals' },
      { title: 'Remove junk food from house' },
      { title: 'Find healthy recipes' }
    ],
    rewards: []
  },
  {
    id: '3',
    title: 'Official New Year\'s Resolution Challenge: August - Count Your Treasures!',
    description: 'Make 2025 the best year ever! Join this Challenge for help and a motivation boost as we help you choose and stick to your New Year\'s Resolution all year long!',
    creator: 'beffymaroo',
    prize: 25,
    participants: 3679,
    tags: ['Official'],
    stats: { habits: 2, daily: 0, todo: 3, rewards: 0 },
    category: 'Self-Improvement',
    isOfficial: true,
    habits: [
      { title: 'Practice gratitude', type: 'good', goal: 1 },
      { title: 'Work on personal goal', type: 'good', goal: 1 }
    ],
    dailies: [],
    todos: [
      { title: 'Set 3 main goals for the year' },
      { title: 'Create action plan' },
      { title: 'Track monthly progress' }
    ],
    rewards: []
  },
  {
    id: '4',
    title: 'Weekend Warrior (September)',
    description: 'This one is especially for those who can\'t make their thesis their full-time (or even part-time) job.',
    creator: 'Erillu',
    prize: 1,
    participants: 0,
    tags: ['Academics', 'Getting Organized', 'Time-Management + Accountability'],
    stats: { habits: 1, daily: 2, todo: 2, rewards: 0 },
    category: 'Academics',
    isOfficial: false,
    habits: [
      { title: 'Work on thesis/project', type: 'good', goal: 2 }
    ],
    dailies: [
      { title: 'Review progress', notes: 'Weekend only' },
      { title: 'Plan next week\'s tasks' }
    ],
    todos: [
      { title: 'Set weekend study schedule' },
      { title: 'Create distraction-free workspace' }
    ],
    rewards: []
  }
];

const categories = [
  { name: 'Academics', icon: BookOpen, count: 8 },
  { name: 'Advocacy + Causes', icon: Users, count: 3 },
  { name: 'Creativity', icon: Palette, count: 15 },
  { name: 'Entertainment', icon: GamepadIcon, count: 7 },
  { name: 'Finance', icon: DollarSign, count: 4 },
  { name: 'Health + Fitness', icon: Heart, count: 22 },
  { name: 'Hobbies + Occupations', icon: Target, count: 18 },
  { name: 'Location-based', icon: MapPin, count: 6 },
  { name: 'Mental Health + Self Care', icon: Brain, count: 11 },
  { name: 'Getting Organized', icon: CheckSquare, count: 9 },
  { name: 'Recovery + Support Groups', icon: Users, count: 5 },
  { name: 'Self-Improvement', icon: TrendingUp, count: 14 },
  { name: 'Spirituality', icon: Heart, count: 8 },
  { name: 'Time-Management + Accountability', icon: Clock, count: 13 }
];

const Challenges = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>(mockChallenges);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Create Challenge Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: '',
    prize: 0,
    tags: [] as string[],
    habits: [] as Array<{ title: string; type: 'good' | 'bad' | 'both'; goal?: number }>,
    dailies: [] as Array<{ title: string; notes?: string }>,
    todos: [] as Array<{ title: string; notes?: string }>,
    rewards: [] as Array<{ title: string; cost: number }>
  });

  // Mock player data - in real app this would come from your habit tracking state
  const mockPlayer = {
    level: 1,
    xp: 8,
    hp: 50,
    gold: 0
  };

  // Load challenges from Supabase
  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data: challengesData, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_habits(*),
          challenge_dailies(*),
          challenge_todos(*),
          challenge_rewards(*)
        `);

      if (error) throw error;

      const formattedChallenges: Challenge[] = challengesData?.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        creator: 'User', // You can join with profiles table to get username
        prize: challenge.prize,
        participants: 0, // You can count from user_challenges table
        tags: challenge.tags || [],
        stats: {
          habits: challenge.challenge_habits?.length || 0,
          daily: challenge.challenge_dailies?.length || 0,
          todo: challenge.challenge_todos?.length || 0,
          rewards: challenge.challenge_rewards?.length || 0,
        },
        category: challenge.category,
        isOfficial: challenge.is_official,
        habits: challenge.challenge_habits?.map((h: any) => ({
          title: h.title,
          type: h.type,
          goal: h.goal
        })) || [],
        dailies: challenge.challenge_dailies?.map((d: any) => ({
          title: d.title,
          notes: d.notes
        })) || [],
        todos: challenge.challenge_todos?.map((t: any) => ({
          title: t.title,
          notes: t.notes
        })) || [],
        rewards: challenge.challenge_rewards?.map((r: any) => ({
          title: r.title,
          cost: r.cost
        })) || []
      })) || [];

      setChallenges([...mockChallenges, ...formattedChallenges]);
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  const handleCreateChallenge = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create the main challenge
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: createForm.title,
          description: createForm.description,
          category: createForm.category,
          prize: createForm.prize,
          tags: createForm.tags,
          creator_id: user.id
        })
        .select()
        .single();

      if (challengeError) throw challengeError;

      // Create habits
      if (createForm.habits.length > 0) {
        const { error: habitsError } = await supabase
          .from('challenge_habits')
          .insert(
            createForm.habits.map(habit => ({
              challenge_id: challengeData.id,
              title: habit.title,
              type: habit.type,
              goal: habit.goal
            }))
          );
        if (habitsError) throw habitsError;
      }

      // Create dailies
      if (createForm.dailies.length > 0) {
        const { error: dailiesError } = await supabase
          .from('challenge_dailies')
          .insert(
            createForm.dailies.map(daily => ({
              challenge_id: challengeData.id,
              title: daily.title,
              notes: daily.notes
            }))
          );
        if (dailiesError) throw dailiesError;
      }

      // Create todos
      if (createForm.todos.length > 0) {
        const { error: todosError } = await supabase
          .from('challenge_todos')
          .insert(
            createForm.todos.map(todo => ({
              challenge_id: challengeData.id,
              title: todo.title,
              notes: todo.notes
            }))
          );
        if (todosError) throw todosError;
      }

      // Create rewards
      if (createForm.rewards.length > 0) {
        const { error: rewardsError } = await supabase
          .from('challenge_rewards')
          .insert(
            createForm.rewards.map(reward => ({
              challenge_id: challengeData.id,
              title: reward.title,
              cost: reward.cost
            }))
          );
        if (rewardsError) throw rewardsError;
      }

      toast({
        title: "Challenge Created!",
        description: "Your challenge has been created successfully.",
      });

      // Reset form and close modal
      setCreateForm({
        title: '',
        description: '',
        category: '',
        prize: 0,
        tags: [],
        habits: [],
        dailies: [],
        todos: [],
        rewards: []
      });
      setIsCreateModalOpen(false);
      
      // Reload challenges
      loadChallenges();
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to create challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.some(cat => challenge.tags.includes(cat));
    return matchesSearch && matchesCategory;
  });

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleJoinChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  const confirmJoin = () => {
    if (selectedChallenge) {
      setJoinedChallenges(prev => [...prev, selectedChallenge.id]);
      setSelectedChallenge(null);
      // In a real app, this would sync with your habit tracking state
      alert(`Successfully joined "${selectedChallenge.title}"! The habits and tasks have been added to your account.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent cursor-pointer hover:opacity-80 transition-opacity">
                Heago
              </h1>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <ProfilePopover player={mockPlayer} />
            </div>
          </div>
          
          {/* Progress bars */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Heart className="w-4 h-4 text-red-500" />
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">50 / 50</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-yellow-500" />
              <div className="flex-1 bg-muted rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '27%' }}></div>
              </div>
              <span className="text-sm text-muted-foreground">8 / 29</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/habits">
              <Button 
                variant="outline" 
                className="text-primary hover:bg-primary/10"
              >
                ← Back to Habits
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Challenge Hub</h1>
          </div>
          <Button 
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Challenge
          </Button>
        </div>

        <p className="text-muted-foreground mb-8">
          Join challenges or create your own to build healthy habits with a community of motivated people!
        </p>

        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className="w-64 space-y-6">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Filters</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">Category</p>
                {categories.map((category) => (
                  <div key={category.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.name}
                      checked={selectedCategories.includes(category.name)}
                      onCheckedChange={() => toggleCategory(category.name)}
                    />
                    <label
                      htmlFor={category.name}
                      className="text-sm cursor-pointer flex-1 flex items-center justify-between"
                    >
                      <span>{category.name}</span>
                      <span className="text-muted-foreground">{category.count}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-challenges">My Challenges</TabsTrigger>
                <TabsTrigger value="discover">Discover Challenges</TabsTrigger>
              </TabsList>

              <TabsContent value="my-challenges" className="space-y-4">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">You haven't joined any challenges yet.</p>
                  <Button variant="outline" className="mt-4">
                    Discover Challenges
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="discover" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-primary">Discover Challenges</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Challenge
                  </Button>
                </div>

                <div className="grid gap-4">
                  {filteredChallenges.map((challenge) => (
                    <Card key={challenge.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <CardTitle className="text-lg leading-tight">
                                {challenge.title}
                              </CardTitle>
                              {challenge.isOfficial && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>👥 {challenge.participants.toLocaleString()}</span>
                              <span>Created By: {challenge.creator}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded">
                              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                {challenge.prize}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">Prize</span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {challenge.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <CardDescription className="text-sm mb-4 line-clamp-2">
                          {challenge.description}
                        </CardDescription>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{challenge.stats.habits}</span>
                              <span>Habit</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{challenge.stats.daily}</span>
                              <span>Daily</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckSquare className="w-4 h-4" />
                              <span>{challenge.stats.todo}</span>
                              <span>To Do</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Gift className="w-4 h-4" />
                              <span>{challenge.stats.rewards}</span>
                              <span>Reward</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            onClick={() => handleJoinChallenge(challenge)}
                            disabled={joinedChallenges.includes(challenge.id)}
                          >
                            {joinedChallenges.includes(challenge.id) ? 'Joined' : 'Join Challenge'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Challenge Details Modal */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => setSelectedChallenge(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedChallenge?.title}
              {selectedChallenge?.isOfficial && (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedChallenge?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Challenge Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Created by</p>
                <p className="font-medium">{selectedChallenge?.creator}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-medium">{selectedChallenge?.participants.toLocaleString()}</p>
              </div>
            </div>

            {/* Habits Section */}
            {selectedChallenge?.habits && selectedChallenge.habits.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Habits ({selectedChallenge.habits.length})
                </h4>
                <div className="space-y-2">
                  {selectedChallenge.habits.map((habit, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{habit.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {habit.type.toUpperCase()}
                          {habit.goal && ` • Goal: ${habit.goal}/day`}
                        </p>
                      </div>
                      <Badge variant={habit.type === 'good' ? 'default' : habit.type === 'bad' ? 'destructive' : 'secondary'}>
                        {habit.type === 'good' ? '+' : habit.type === 'bad' ? '−' : '±'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dailies Section */}
            {selectedChallenge?.dailies && selectedChallenge.dailies.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Dailies ({selectedChallenge.dailies.length})
                </h4>
                <div className="space-y-2">
                  {selectedChallenge.dailies.map((daily, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{daily.title}</p>
                      {daily.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{daily.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* To-dos Section */}
            {selectedChallenge?.todos && selectedChallenge.todos.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5" />
                  To-dos ({selectedChallenge.todos.length})
                </h4>
                <div className="space-y-2">
                  {selectedChallenge.todos.map((todo, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{todo.title}</p>
                      {todo.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{todo.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Section */}
            {selectedChallenge?.rewards && selectedChallenge.rewards.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Rewards ({selectedChallenge.rewards.length})
                </h4>
                <div className="space-y-2">
                  {selectedChallenge.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <p className="font-medium">{reward.title}</p>
                      <span className="text-sm text-muted-foreground">{reward.cost}g</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedChallenge(null)}>
              Cancel
            </Button>
            <Button onClick={confirmJoin} className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
              Join Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Challenge Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
            <DialogDescription>
              Create a challenge that others can join to build healthy habits together.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Challenge Title</label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter challenge title"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your challenge"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={createForm.category} onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Prize (Gold)</label>
                  <Input
                    type="number"
                    value={createForm.prize}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, prize: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma separated)</label>
                <Input
                  value={createForm.tags.join(', ')}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) }))}
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            {/* Tabs for different sections */}
            <Tabs defaultValue="habits" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="habits">Habits</TabsTrigger>
                <TabsTrigger value="dailies">Dailies</TabsTrigger>
                <TabsTrigger value="todos">To-dos</TabsTrigger>
                <TabsTrigger value="rewards">Rewards</TabsTrigger>
              </TabsList>

              <TabsContent value="habits" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Habits</h4>
                  <Button
                    size="sm"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      habits: [...prev.habits, { title: '', type: 'good' as const, goal: undefined }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Habit
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {createForm.habits.map((habit, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Input
                        value={habit.title}
                        onChange={(e) => {
                          const newHabits = [...createForm.habits];
                          newHabits[index].title = e.target.value;
                          setCreateForm(prev => ({ ...prev, habits: newHabits }));
                        }}
                        placeholder="Habit title"
                        className="flex-1"
                      />
                      <Select
                        value={habit.type}
                        onValueChange={(value: 'good' | 'bad' | 'both') => {
                          const newHabits = [...createForm.habits];
                          newHabits[index].type = value;
                          setCreateForm(prev => ({ ...prev, habits: newHabits }));
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good (+)</SelectItem>
                          <SelectItem value="bad">Bad (−)</SelectItem>
                          <SelectItem value="both">Both (±)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        value={habit.goal || ''}
                        onChange={(e) => {
                          const newHabits = [...createForm.habits];
                          newHabits[index].goal = e.target.value ? parseInt(e.target.value) : undefined;
                          setCreateForm(prev => ({ ...prev, habits: newHabits }));
                        }}
                        placeholder="Goal"
                        className="w-20"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newHabits = createForm.habits.filter((_, i) => i !== index);
                          setCreateForm(prev => ({ ...prev, habits: newHabits }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="dailies" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Dailies</h4>
                  <Button
                    size="sm"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      dailies: [...prev.dailies, { title: '', notes: '' }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Daily
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {createForm.dailies.map((daily, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Input
                        value={daily.title}
                        onChange={(e) => {
                          const newDailies = [...createForm.dailies];
                          newDailies[index].title = e.target.value;
                          setCreateForm(prev => ({ ...prev, dailies: newDailies }));
                        }}
                        placeholder="Daily title"
                        className="flex-1"
                      />
                      <Input
                        value={daily.notes || ''}
                        onChange={(e) => {
                          const newDailies = [...createForm.dailies];
                          newDailies[index].notes = e.target.value;
                          setCreateForm(prev => ({ ...prev, dailies: newDailies }));
                        }}
                        placeholder="Notes (optional)"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newDailies = createForm.dailies.filter((_, i) => i !== index);
                          setCreateForm(prev => ({ ...prev, dailies: newDailies }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="todos" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">To-dos</h4>
                  <Button
                    size="sm"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      todos: [...prev.todos, { title: '', notes: '' }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add To-do
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {createForm.todos.map((todo, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Input
                        value={todo.title}
                        onChange={(e) => {
                          const newTodos = [...createForm.todos];
                          newTodos[index].title = e.target.value;
                          setCreateForm(prev => ({ ...prev, todos: newTodos }));
                        }}
                        placeholder="To-do title"
                        className="flex-1"
                      />
                      <Input
                        value={todo.notes || ''}
                        onChange={(e) => {
                          const newTodos = [...createForm.todos];
                          newTodos[index].notes = e.target.value;
                          setCreateForm(prev => ({ ...prev, todos: newTodos }));
                        }}
                        placeholder="Notes (optional)"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newTodos = createForm.todos.filter((_, i) => i !== index);
                          setCreateForm(prev => ({ ...prev, todos: newTodos }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="rewards" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Rewards</h4>
                  <Button
                    size="sm"
                    onClick={() => setCreateForm(prev => ({
                      ...prev,
                      rewards: [...prev.rewards, { title: '', cost: 10 }]
                    }))}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Reward
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {createForm.rewards.map((reward, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Input
                        value={reward.title}
                        onChange={(e) => {
                          const newRewards = [...createForm.rewards];
                          newRewards[index].title = e.target.value;
                          setCreateForm(prev => ({ ...prev, rewards: newRewards }));
                        }}
                        placeholder="Reward title"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={reward.cost}
                        onChange={(e) => {
                          const newRewards = [...createForm.rewards];
                          newRewards[index].cost = parseInt(e.target.value) || 0;
                          setCreateForm(prev => ({ ...prev, rewards: newRewards }));
                        }}
                        placeholder="Cost"
                        className="w-24"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newRewards = createForm.rewards.filter((_, i) => i !== index);
                          setCreateForm(prev => ({ ...prev, rewards: newRewards }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateChallenge}
              disabled={isLoading || !createForm.title || !createForm.description || !createForm.category}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {isLoading ? 'Creating...' : 'Create Challenge'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Challenges;
