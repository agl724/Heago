const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-primary">Welcome to Your App</h1>
        <p className="text-xl text-muted-foreground mb-4">Your application is now running successfully!</p>
        <div className="w-4 h-4 bg-primary rounded-full mx-auto animate-pulse"></div>
      </div>
    </div>
  );
};

export default Index;
