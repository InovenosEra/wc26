import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { LeaderboardEntry, League, Profile } from '@/types';
import { LeaderboardList } from '@/components/LeaderboardList';
import { LeagueSelector } from '@/components/LeagueSelector';
import { Loader2, Trophy } from 'lucide-react';

function generateLeagueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function LeaderboardTab() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchLeagues();
  }, [user]);

  useEffect(() => {
    if (selectedLeague) {
      fetchLeaderboard();
    }
  }, [selectedLeague]);

  const fetchLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('leagues')
        .select('*')
        .order('is_global', { ascending: false });

      if (error) throw error;
      
      const leaguesData = (data || []) as League[];
      setLeagues(leaguesData);
      
      // Select global league by default
      const globalLeague = leaguesData.find(l => l.is_global);
      if (globalLeague) {
        setSelectedLeague(globalLeague);
      }
    } catch (error) {
      console.error('Error fetching leagues:', error);
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    if (!selectedLeague) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(100);

      // If not global, filter by league members
      if (!selectedLeague.is_global) {
        const { data: members } = await supabase
          .from('league_members')
          .select('user_id')
          .eq('league_id', selectedLeague.id);
        
        const userIds = (members || []).map(m => m.user_id);
        if (userIds.length > 0) {
          query = query.in('id', userIds);
        } else {
          setEntries([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const leaderboardEntries: LeaderboardEntry[] = (data || []).map((profile: Profile, index: number) => ({
        rank: index + 1,
        profile,
        total_points: profile.total_points,
      }));
      
      setEntries(leaderboardEntries);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async (name: string): Promise<League | null> => {
    if (!user) return null;
    
    try {
      const code = generateLeagueCode();
      
      const { data, error } = await supabase
        .from('leagues')
        .insert({
          name,
          code,
          owner_id: user.id,
          is_global: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Join the league as owner
      await supabase
        .from('league_members')
        .insert({
          league_id: data.id,
          user_id: user.id,
        });

      await fetchLeagues();
      return data as League;
    } catch (error) {
      console.error('Error creating league:', error);
      return null;
    }
  };

  const handleJoinLeague = async (code: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const { data: league, error: findError } = await supabase
        .from('leagues')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (findError || !league) return false;
      
      const { error: joinError } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          user_id: user.id,
        });

      if (joinError) {
        // Might already be a member
        if (joinError.code === '23505') {
          return true;
        }
        throw joinError;
      }

      await fetchLeagues();
      return true;
    } catch (error) {
      console.error('Error joining league:', error);
      return false;
    }
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Leaderboard</h2>
      </div>

      {/* League Selector */}
      {user && (
        <LeagueSelector
          leagues={leagues}
          selectedLeague={selectedLeague}
          onSelectLeague={setSelectedLeague}
          onCreateLeague={handleCreateLeague}
          onJoinLeague={handleJoinLeague}
        />
      )}

      {/* Leaderboard */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <LeaderboardList entries={entries} currentUserId={user?.id} />
      )}
    </div>
  );
}
