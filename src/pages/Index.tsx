import { useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { AuthModal } from '@/components/AuthModal';
import { MatchesTab } from '@/components/tabs/MatchesTab';
import { LeaderboardTab } from '@/components/tabs/LeaderboardTab';
import { PredictionsTab } from '@/components/tabs/PredictionsTab';
import { StatsTab } from '@/components/tabs/StatsTab';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const [activeTab, setActiveTab] = useState('matches');
  const [showAuth, setShowAuth] = useState(false);
  const { loading } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case 'matches':
        return <MatchesTab />;
      case 'leaderboard':
        return <LeaderboardTab />;
      case 'predictions':
        return <PredictionsTab onAuthClick={() => setShowAuth(true)} />;
      case 'stats':
        return <StatsTab />;
      default:
        return <MatchesTab />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg gradient-gold animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthClick={() => setShowAuth(true)} />
      
      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        {renderTab()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default Index;
