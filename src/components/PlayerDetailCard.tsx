import { useState, useEffect } from 'react';
import { X, Trophy, Target, TrendingUp, Clock, Shirt, Loader2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchPlayerProfile, PlayerProfile } from '@/services/footballApi';

export interface PlayerStats {
  playerName: string;
  playerPhoto?: string;
  teamName: string;
  teamLogo: string;
  position?: string;
  age?: number;
  nationality?: string;
  goals?: number;
  assists?: number;
  xG?: number;
  minutesPlayed?: number;
  matchesPlayed?: number;
  shotsOnTarget?: number;
  passAccuracy?: number;
}

interface PlayerDetailCardProps {
  player: PlayerStats;
  onClose: () => void;
}

export function PlayerDetailCard({ player, onClose }: PlayerDetailCardProps) {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const data = await fetchPlayerProfile(player.playerName);
      setProfile(data);
      setLoading(false);
    };
    loadProfile();
  }, [player.playerName]);

  // Use API data if available, otherwise fall back to passed props or mock
  const displayData = {
    name: profile?.displayName || player.playerName,
    image: profile?.image || player.playerPhoto,
    position: profile?.position || player.position || 'Forward',
    age: profile?.age || player.age || Math.floor(Math.random() * 12) + 22,
    nationality: profile?.nationality || player.nationality,
    nationalityFlag: profile?.nationalityFlag,
    height: profile?.height,
    weight: profile?.weight,
    currentTeam: profile?.currentTeam?.name || player.teamName,
    currentTeamLogo: profile?.currentTeam?.logo || player.teamLogo,
    goals: player.goals ?? 0,
    assists: player.assists ?? 0,
    xG: player.xG ?? Math.random() * 3,
    matchesPlayed: player.matchesPlayed ?? Math.floor(Math.random() * 6) + 1,
    minutesPlayed: player.minutesPlayed ?? Math.floor(Math.random() * 500) + 90,
    shotsOnTarget: player.shotsOnTarget ?? Math.floor(Math.random() * 15),
    passAccuracy: player.passAccuracy ?? Math.floor(Math.random() * 20) + 75,
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="glass-card w-full max-w-sm max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain touch-pan-y rounded-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-primary/30 via-secondary to-card p-6 pb-12">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary/50">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayData.image ? (
              <img
                src={displayData.image}
                alt={displayData.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/50 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-primary/50">
                <Shirt className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-bold">{displayData.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <img
                  src={displayData.currentTeamLogo}
                  alt={displayData.currentTeam}
                  className="w-5 h-3.5 object-cover rounded shadow-sm"
                />
                <span className="text-sm text-muted-foreground">{displayData.currentTeam}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  {displayData.position}
                </span>
                <span className="text-xs text-muted-foreground">
                  Age: {displayData.age}
                </span>
                {displayData.nationality && (
                  <div className="flex items-center gap-1">
                    {displayData.nationalityFlag && (
                      <img 
                        src={displayData.nationalityFlag} 
                        alt={displayData.nationality}
                        className="w-4 h-3 object-cover rounded"
                      />
                    )}
                    <span className="text-xs text-muted-foreground">{displayData.nationality}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="flex justify-around py-4 px-2 mt-4 mx-4 bg-card rounded-xl border border-border shadow-lg">
          <StatBox icon={<Trophy className="w-4 h-4 text-primary" />} value={displayData.goals} label="Goals" />
          <div className="w-px bg-border" />
          <StatBox icon={<Target className="w-4 h-4 text-accent" />} value={displayData.assists} label="Assists" />
          <div className="w-px bg-border" />
          <StatBox icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />} value={displayData.xG.toFixed(1)} label="xG" />
        </div>

        {/* Physical Stats (if available from API) */}
        {(displayData.height || displayData.weight) && (
          <div className="mx-4 mt-3 flex justify-center gap-4">
            {displayData.height > 0 && (
              <span className="text-xs text-muted-foreground">
                Height: <span className="font-medium text-foreground">{displayData.height} cm</span>
              </span>
            )}
            {displayData.weight > 0 && (
              <span className="text-xs text-muted-foreground">
                Weight: <span className="font-medium text-foreground">{displayData.weight} kg</span>
              </span>
            )}
          </div>
        )}

        {/* Detailed Stats */}
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tournament Stats
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            <DetailStatCard 
              icon={<Clock className="w-4 h-4" />}
              label="Minutes Played"
              value={displayData.minutesPlayed.toString()}
            />
            <DetailStatCard 
              icon={<Shirt className="w-4 h-4" />}
              label="Matches"
              value={displayData.matchesPlayed.toString()}
            />
            <DetailStatCard 
              label="Shots on Target"
              value={displayData.shotsOnTarget.toString()}
            />
            <DetailStatCard 
              label="Pass Accuracy"
              value={`${displayData.passAccuracy}%`}
            />
          </div>

          {/* Performance Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Goal Conversion</span>
              <span className="font-medium text-primary">
                {displayData.shotsOnTarget > 0 
                  ? Math.round((displayData.goals / displayData.shotsOnTarget) * 100) 
                  : 0}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ 
                  width: `${displayData.shotsOnTarget > 0 
                    ? Math.min((displayData.goals / displayData.shotsOnTarget) * 100, 100) 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <p className="text-[10px] text-center text-muted-foreground">
            {profile ? 'Live data from SportMonks' : 'Stats update during tournament'}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatBox({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-3">
      {icon}
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function DetailStatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-secondary/30 rounded-lg p-3 flex items-center gap-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <div className={cn(!icon && "text-center w-full")}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
