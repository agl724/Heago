import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Target, TrendingUp, Users, Zap, Calendar } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
const Landing = () => {
  const {
    user,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const features = [{
    icon: <Target className="w-6 h-6" />,
    title: "Goal Setting",
    description: "Set clear, achievable habit goals and track your progress daily."
  }, {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Progress Analytics",
    description: "Visualize your habit streaks and improvement patterns over time."
  }, {
    icon: <CheckCircle className="w-6 h-6" />,
    title: "Daily Check-ins",
    description: "Simple, intuitive interface to mark habits as complete each day."
  }, {
    icon: <Calendar className="w-6 h-6" />,
    title: "Habit Calendar",
    description: "View your habit completion history in a beautiful calendar format."
  }, {
    icon: <Zap className="w-6 h-6" />,
    title: "Streak Tracking",
    description: "Maintain momentum with powerful streak counters and motivation."
  }, {
    icon: <Users className="w-6 h-6" />,
    title: "Community Support",
    description: "Connect with others on similar habit-building journeys."
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/20 backdrop-blur-sm bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">H</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Heago
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            {user ? <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => navigate('/habits')} className="text-sm">
                  My Habits
                </Button>
                <Button variant="ghost" onClick={() => navigate('/challenges')} className="text-sm">
                  Challenges
                </Button>
                <span className="text-sm text-muted-foreground">Welcome back!</span>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div> : <Button onClick={() => navigate('/auth')}>
                Get Started
              </Button>}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">
            ✨ Transform Your Life, One Habit at a Time
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Build Better Habits
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Heago makes it simple to track, maintain, and celebrate your daily habits. 
            Join thousands of users who've transformed their lives through consistent action.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" onClick={() => navigate(user ? '/habits' : '/auth')}>
              {user ? 'Open Habit Tracker' : 'Start Your Journey'}
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Floating elements for visual interest */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-16 h-16 bg-secondary/10 rounded-full blur-xl animate-pulse delay-500"></div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you build and maintain habits that stick.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/20 hover:border-primary/20">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10k+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-secondary mb-2">1M+</div>
              <div className="text-muted-foreground">Habits Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">85%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-violet mb-2">4.9★</div>
              <div className="text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Life?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of users who've already started their habit-building journey with Heago.
          </p>
          <Button size="lg" className="text-lg px-12" onClick={() => navigate(user ? '/habits' : '/auth')}>
            {user ? 'Open Habit Tracker' : 'Get Started for Free'}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Heago. All rights reserved. Built with ❤️ for habit builders.</p>
        </div>
      </footer>
    </div>;
};
export default Landing;
